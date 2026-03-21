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

function decodeBase64(encoded: string): string {
  return Buffer.from(encoded, "base64").toString("utf-8");
}

function encodeBase64(data: string): string {
  return Buffer.from(data, "utf-8").toString("base64");
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
 * Uses `onchainos payment x402-pay` which calls:
 * - /priapi/v5/wallet/agentic/pre-transaction/gen-msg-hash (EIP-3009 hash)
 * - /priapi/v5/wallet/agentic/pre-transaction/sign-msg (TEE signature)
 */
async function signX402(
  payerAddress: string,
  requirement: X402PaymentRequirement,
): Promise<X402PaymentProof> {
  const proc = Bun.spawn(
    [
      "onchainos",
      "payment",
      "x402-pay",
      "--network",
      requirement.network,
      "--amount",
      requirement.amount,
      "--pay-to",
      requirement.payTo,
      "--asset",
      requirement.asset,
      "--from",
      payerAddress,
    ],
    { stdout: "pipe", stderr: "pipe" },
  );

  const stdout = await new Response(proc.stdout).text();
  const stderr = await new Response(proc.stderr).text();
  const exitCode = await proc.exited;

  if (exitCode !== 0) {
    throw new Error(`x402 signing failed: ${stderr || stdout}`);
  }

  const result = JSON.parse(stdout);
  if (!result.ok || !result.data?.signature) {
    throw new Error(`x402 signing failed: ${stdout}`);
  }

  return result.data as X402PaymentProof;
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

  const decoded: X402PaymentRequired = JSON.parse(
    decodeBase64(paymentHeader),
  );

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
  const headerName =
    decoded.x402Version >= 2 ? "X-Payment" : "X-Payment";

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
