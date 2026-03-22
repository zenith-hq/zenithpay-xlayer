import crypto from "node:crypto";
import { Aead, CipherSuite, Kdf, Kem } from "hpke-js";
import { XLAYER_CHAIN_ID } from "../../config/chains";
import { akLogin } from "./agentic-wallet";

interface X402VerifyResult {
  valid: boolean;
  paymentRequired: boolean;
  amount: string;
  currency: string;
  network: string;
  receiver: string;
}

interface X402SettleResult {
  txHash: string;
  status: string;
  amount: string;
  currency: string;
}

interface X402Authorization {
  from: string;
  to: string;
  value: string;
  validAfter: string;
  validBefore: string;
  nonce: string;
}

interface X402PaymentProof {
  signature: string;
  authorization: X402Authorization;
}

interface X402PaymentRequirement {
  scheme: string;
  network: string;
  amount: string;
  asset: string;
  payTo: string;
  maxTimeoutSeconds: number;
  extra: Record<string, unknown>;
}

interface X402PaymentRequired {
  x402Version: number;
  resource?: Record<string, unknown>;
  accepts: X402PaymentRequirement[];
  extensions?: Record<string, unknown>;
}

interface X402PaymentResponse {
  network: string;
  payer: string;
  success: boolean;
  transaction: string;
}

const OKX_BASE = "https://web3.okx.com";
const WALLET_PREFIX = "/priapi/v5/wallet/agentic";
const HPKE_INFO = new TextEncoder().encode("okx-tee-sign");
const ED25519_PKCS8_PREFIX = Buffer.from(
  "302e020100300506032b657004220420",
  "hex",
);

function decodeBase64(encoded: string): string {
  return Buffer.from(encoded, "base64").toString("utf-8");
}

function encodeBase64(data: string): string {
  return Buffer.from(data, "utf-8").toString("base64");
}

async function hpkeDecryptSessionSk(
  encryptedB64: string,
  sessionKeyB64: string,
): Promise<Uint8Array> {
  const encrypted = Buffer.from(encryptedB64, "base64");
  const skBytes = Buffer.from(sessionKeyB64, "base64");

  if (skBytes.length !== 32) {
    throw new Error(`session key must be 32 bytes, got ${skBytes.length}`);
  }
  if (encrypted.length <= 32) {
    throw new Error(`encrypted blob too short: ${encrypted.length} bytes`);
  }

  const enc = encrypted.subarray(0, 32);
  const ciphertext = encrypted.subarray(32);

  const suite = new CipherSuite({
    kem: Kem.DhkemX25519HkdfSha256,
    kdf: Kdf.HkdfSha256,
    aead: Aead.Aes256Gcm,
  });

  const recipientKey = await suite.importKey("raw", skBytes, false);
  const ctx = await suite.createRecipientContext({
    recipientKey,
    enc,
    info: HPKE_INFO,
  });

  const plaintext = await ctx.open(ciphertext, new Uint8Array(0));
  const seed = new Uint8Array(plaintext);

  if (seed.length !== 32) {
    throw new Error(`decrypted seed must be 32 bytes, got ${seed.length}`);
  }

  return seed;
}

function ed25519Sign(seed: Uint8Array, message: Uint8Array): Uint8Array {
  const der = Buffer.concat([ED25519_PKCS8_PREFIX, seed]);
  const privateKey = crypto.createPrivateKey({
    key: der,
    format: "der",
    type: "pkcs8",
  });
  return new Uint8Array(crypto.sign(null, message, privateKey));
}

/**
 * Probe a service URL for x402 payment requirements.
 * Sends the original request body to trigger a 402 response,
 * then decodes the `payment-required` header.
 */
export async function verifyX402(
  serviceUrl: string,
  _payerAddress: string,
  _maxAmount: string,
): Promise<X402VerifyResult> {
  try {
    const resp = await fetch(serviceUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: "probe" }),
      signal: AbortSignal.timeout(10000),
    });

    if (resp.status === 402) {
      const paymentHeader = resp.headers.get("payment-required");
      if (paymentHeader) {
        const decoded: X402PaymentRequired = JSON.parse(
          decodeBase64(paymentHeader),
        );
        const accepted = decoded.accepts[0];
        if (accepted) {
          return {
            valid: true,
            paymentRequired: true,
            amount: accepted.amount,
            currency: "USDC",
            network: accepted.network,
            receiver: accepted.payTo,
          };
        }
      }
    }

    return {
      valid: true,
      paymentRequired: false,
      amount: _maxAmount,
      currency: "USDC",
      network: "unknown",
      receiver: "unknown",
    };
  } catch {
    return {
      valid: false,
      paymentRequired: false,
      amount: _maxAmount,
      currency: "USDC",
      network: "unknown",
      receiver: "unknown",
    };
  }
}

/**
 * Sign an x402 payment via OKX Agentic Wallet TEE.
 *
 * Calls the OKX REST API directly (no CLI dependency):
 * 1. gen-msg-hash — get EIP-3009 unsigned hash from TEE
 * 2. HPKE decrypt encryptedSessionSk → Ed25519 signing seed
 * 3. Ed25519 sign the msgHash locally (proves session validity)
 * 4. sign-msg — TEE produces the final EIP-3009 signature
 */
async function signX402(
  payerAddress: string,
  requirement: X402PaymentRequirement,
): Promise<X402PaymentProof> {
  const session = await akLogin();

  const now = Math.floor(Date.now() / 1000);
  const validBefore = (now + (requirement.maxTimeoutSeconds || 300)).toString();
  const nonce = `0x${Buffer.from(crypto.randomBytes(32)).toString("hex")}`;

  const baseFields = {
    chainIndex: XLAYER_CHAIN_ID,
    from: payerAddress,
    to: requirement.payTo,
    value: requirement.amount,
    validAfter: "0",
    validBefore,
    nonce,
    verifyingContract: requirement.asset,
  };

  const headers = {
    "Content-Type": "application/json",
    "ok-client-version": "2.1.0",
    "Ok-Access-Client-type": "agent-cli",
    Authorization: `Bearer ${session.accessToken}`,
  };

  const genHashResp = await fetch(
    `${OKX_BASE}${WALLET_PREFIX}/pre-transaction/gen-msg-hash`,
    {
      method: "POST",
      headers,
      body: JSON.stringify(baseFields),
    },
  );
  const genHashJson = (await genHashResp.json()) as {
    code: string | number;
    msg: string;
    data: Array<{ msgHash: string; domainHash: string }>;
  };

  if (genHashJson.code !== "0" && genHashJson.code !== 0) {
    throw new Error(
      `gen-msg-hash failed [${genHashJson.code}]: ${genHashJson.msg}`,
    );
  }

  const { msgHash, domainHash } = genHashJson.data[0];

  const seed = await hpkeDecryptSessionSk(
    session.encryptedSessionSk,
    session.sessionPrivateKey,
  );

  const msgHashBytes = Buffer.from(msgHash.replace(/^0x/, ""), "hex");
  const sessionSignature = ed25519Sign(seed, msgHashBytes);
  const sessionSignatureB64 = Buffer.from(sessionSignature).toString("base64");

  const signMsgBody = {
    ...baseFields,
    domainHash,
    sessionCert: session.sessionCert,
    sessionSignature: sessionSignatureB64,
  };

  const signResp = await fetch(
    `${OKX_BASE}${WALLET_PREFIX}/pre-transaction/sign-msg`,
    {
      method: "POST",
      headers,
      body: JSON.stringify(signMsgBody),
    },
  );
  const signJson = (await signResp.json()) as {
    code: string | number;
    msg: string;
    data: Array<{ signature: string }>;
  };

  if (signJson.code !== "0" && signJson.code !== 0) {
    throw new Error(`sign-msg failed [${signJson.code}]: ${signJson.msg}`);
  }

  return {
    signature: signJson.data[0].signature,
    authorization: {
      from: payerAddress,
      to: requirement.payTo,
      value: requirement.amount,
      validAfter: "0",
      validBefore,
      nonce,
    },
  };
}

/**
 * Full x402 payment settlement:
 * 1. Probe service → get 402 with payment-required header
 * 2. Sign EIP-3009 transferWithAuthorization via OKX TEE
 * 3. Build PaymentPayload with `accepted` (singular) + signature
 * 4. Replay original request with X-Payment header
 * 5. Parse payment-response header for txHash
 */
export async function settleX402(
  serviceUrl: string,
  payerAddress: string,
  _amount: string,
  _signature: string,
): Promise<X402SettleResult> {
  // Step 1: Probe service for fresh 402 + payment requirements
  const probeResp = await fetch(serviceUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query: "payment" }),
    signal: AbortSignal.timeout(10000),
  });

  if (probeResp.status !== 402) {
    throw new Error(`Expected 402 from ${serviceUrl}, got ${probeResp.status}`);
  }

  const paymentHeader = probeResp.headers.get("payment-required");
  if (!paymentHeader) {
    throw new Error("No payment-required header in 402 response");
  }

  const decoded: X402PaymentRequired = JSON.parse(decodeBase64(paymentHeader));

  if (!decoded.accepts?.length) {
    throw new Error("No payment options in 402 response");
  }

  // Pick the first EVM option (prefer Base for AgentCash services)
  const accepted =
    decoded.accepts.find((a) => a.network.startsWith("eip155:")) ??
    decoded.accepts[0];

  // Step 2: Sign via OKX TEE
  const proof = await signX402(payerAddress, accepted);

  // Step 3: Build PaymentPayload — `accepted` is SINGULAR (the chosen option)
  const paymentPayload = {
    x402Version: decoded.x402Version,
    ...(decoded.resource ? { resource: decoded.resource } : {}),
    accepted,
    payload: {
      signature: proof.signature,
      authorization: proof.authorization,
    },
  };

  const headerValue = encodeBase64(JSON.stringify(paymentPayload));

  // Step 4: Replay original request with payment header
  const headerName = decoded.x402Version >= 2 ? "X-Payment" : "X-Payment";

  const replayResp = await fetch(serviceUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      [headerName]: headerValue,
    },
    body: JSON.stringify({ query: "payment" }),
    signal: AbortSignal.timeout(30000),
  });

  if (!replayResp.ok) {
    const body = await replayResp.text();
    throw new Error(
      `x402 replay failed (${replayResp.status}): ${body.slice(0, 200)}`,
    );
  }

  // Step 5: Parse payment-response header for txHash
  const responseHeader = replayResp.headers.get("payment-response");
  let txHash = "";

  if (responseHeader) {
    const paymentResponse: X402PaymentResponse = JSON.parse(
      decodeBase64(responseHeader),
    );
    if (paymentResponse.success && paymentResponse.transaction) {
      txHash = paymentResponse.transaction;
    }
  }

  if (!txHash) {
    throw new Error("x402 settlement succeeded but no txHash in response");
  }

  return {
    txHash,
    status: "settled",
    amount: accepted.amount,
    currency: "USDC",
  };
}
