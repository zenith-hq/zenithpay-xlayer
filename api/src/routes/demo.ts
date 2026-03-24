/**
 * ZenithPay Demo Seller Endpoint
 *
 * GET|POST /sell/agent-intel
 *
 * x402-protected resource. Returns a live X Layer wallet intelligence report
 * for the ZenithPay demo agent wallet. Costs 0.01 USDG.
 *
 * Seller flow:
 * 1. No X-Payment header → 402 + Payment-Required header (base64 JSON)
 * 2. X-Payment header present:
 *    a. Decode + validate amount + payee (before calling OKX — prevents orphan payments)
 *    b. POST /api/v6/x402/verify → confirm signature valid
 *    c. POST /api/v6/x402/settle (syncSettle: true) → settle onchain, wait for confirmation
 *    d. Fetch resource data from providers
 *    e. Return resource + Payment-Response header
 * 3. Orphan guard: settlement succeeded but fetch failed → log critical + return txHash
 */

import { Hono } from "hono";
import {
  XLAYER_CHAIN_ID,
  XLAYER_USDC,
  XLAYER_X402_NETWORK,
} from "../config/chains";
import * as balanceProvider from "../providers/onchainos/balance";
import { okxFetch } from "../providers/onchainos/client";
import * as historyProvider from "../providers/onchainos/history";
import * as marketProvider from "../providers/onchainos/market";
import * as tokenProvider from "../providers/onchainos/token";

const sell = new Hono();

// ── Constants ──────────────────────────────────────────────────────────────

// ZenithPay demo agent wallet — OKX Agentic TEE Wallet on X Layer
const DEMO_AGENT_ADDRESS = "0x726Cf0C4Fe559DB9A32396161694C7b88C60C947";
// Demo seller payout wallet (human owner/deployer)
const DEMO_MERCHANT_ADDRESS = "0xa44fa8ad3e905c8ab525cd0cb14319017f1e04e5";

// 0.01 USDG = 10000 atomic units (USDG has 6 decimals)
const PAYMENT_AMOUNT_ATOMIC = "10000";
const PAYMENT_AMOUNT_DISPLAY = "0.01";
const PAYMENT_TOKEN = "USDG";

// ── Helpers ────────────────────────────────────────────────────────────────

interface AcceptedPayment {
  network: string;
  amount: string;
  asset: string;
  payTo: string;
  maxTimeoutSeconds: number;
  extra?: Record<string, string>;
}

interface DecodedPaymentHeader {
  x402Version: number;
  scheme: string;
  payload: { signature: string; authorization: Record<string, string> };
  accepted: AcceptedPayment;
}

function buildPaymentRequired(): string {
  const requirement = {
    x402Version: 1,
    accepts: [
      {
        network: XLAYER_X402_NETWORK,
        amount: PAYMENT_AMOUNT_ATOMIC,
        asset: XLAYER_USDC,
        payTo: DEMO_MERCHANT_ADDRESS,
        maxTimeoutSeconds: 300,
        extra: { name: "USDG", version: "2" },
      },
    ],
  };
  return Buffer.from(JSON.stringify(requirement)).toString("base64");
}

function decodePaymentHeader(header: string): DecodedPaymentHeader {
  return JSON.parse(
    Buffer.from(header, "base64").toString("utf-8"),
  ) as DecodedPaymentHeader;
}

async function verifyWithOKX(paymentHeader: string): Promise<{
  isValid: boolean;
  payer?: string;
  invalidReason?: string;
}> {
  try {
    const decoded = decodePaymentHeader(paymentHeader);
    const result = await okxFetch<{
      isValid: boolean;
      payer: string | null;
      invalidReason: string | null;
    }>("/api/v6/x402/verify", {
      method: "POST",
      body: {
        x402Version: 1,
        chainIndex: XLAYER_CHAIN_ID,
        paymentPayload: {
          x402Version: decoded.x402Version,
          scheme: decoded.scheme,
          payload: decoded.payload,
        },
        paymentRequirements: {
          scheme: "exact",
          maxAmountRequired: PAYMENT_AMOUNT_ATOMIC,
          payTo: DEMO_MERCHANT_ADDRESS,
          asset: XLAYER_USDC,
          maxTimeoutSeconds: 300,
          extra: { name: "USDG", version: "2" },
        },
      },
    });
    return {
      isValid: result.isValid,
      payer: result.payer ?? undefined,
      invalidReason: result.invalidReason ?? undefined,
    };
  } catch (err) {
    console.error("[sell/verify] OKX verify failed:", err);
    return { isValid: false, invalidReason: "verify_request_failed" };
  }
}

async function settleWithOKX(paymentHeader: string): Promise<{
  success: boolean;
  txHash?: string;
  payer?: string;
  errorReason?: string;
}> {
  try {
    const decoded = decodePaymentHeader(paymentHeader);
    const result = await okxFetch<{
      success: boolean;
      txHash: string | null;
      payer: string | null;
      errorReason: string | null;
      chainIndex: string;
    }>("/api/v6/x402/settle", {
      method: "POST",
      body: {
        x402Version: 1,
        chainIndex: XLAYER_CHAIN_ID,
        syncSettle: true,
        paymentPayload: {
          x402Version: decoded.x402Version,
          scheme: decoded.scheme,
          payload: decoded.payload,
        },
        paymentRequirements: {
          scheme: "exact",
          resource: "https://api.usezenithpay.xyz/sell/agent-intel",
          description: "X Layer DeFi Intelligence — ZenithPay Demo",
          mimeType: "application/json",
          maxAmountRequired: PAYMENT_AMOUNT_ATOMIC,
          payTo: DEMO_MERCHANT_ADDRESS,
          asset: XLAYER_USDC,
          maxTimeoutSeconds: 300,
          extra: { name: "USDG", version: "2" },
        },
      },
    });
    return {
      success: result.success,
      txHash: result.txHash ?? undefined,
      payer: result.payer ?? undefined,
      errorReason: result.errorReason ?? undefined,
    };
  } catch (err) {
    console.error("[sell/settle] OKX settle failed:", err);
    return { success: false, errorReason: "settle_request_failed" };
  }
}

async function fetchAgentIntel(): Promise<Record<string, unknown>> {
  const [balances, totalValue, okbPrice, usdgPrice, trending, txHistory] =
    await Promise.allSettled([
      balanceProvider.getAllTokenBalances(DEMO_AGENT_ADDRESS),
      balanceProvider.getTotalValue(DEMO_AGENT_ADDRESS),
      marketProvider.getTokenPrice(
        "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee",
      ),
      marketProvider.getTokenPrice(XLAYER_USDC),
      tokenProvider.getTrendingTokens(),
      historyProvider.getTransactionHistory(DEMO_AGENT_ADDRESS, "10"),
    ]);

  const topTokens =
    balances.status === "fulfilled"
      ? balances.value
          .filter((t) => t.tokenContractAddress && !t.isRiskToken)
          .slice(0, 3)
      : [];

  const securityScans = await Promise.allSettled(
    topTokens.map((t) =>
      tokenProvider.getTokenSecurity(t.tokenContractAddress),
    ),
  );

  return {
    agent: {
      address: DEMO_AGENT_ADDRESS,
      network: "X Layer",
      chainId: 196,
    },
    portfolio: {
      totalValueUsd: totalValue.status === "fulfilled" ? totalValue.value : "0",
      tokens:
        balances.status === "fulfilled"
          ? balances.value.map((t) => ({
              symbol: t.symbol,
              balance: t.balance,
              valueUsd: t.tokenPrice
                ? (
                    Number.parseFloat(t.balance) *
                    Number.parseFloat(t.tokenPrice)
                  ).toFixed(4)
                : "0",
              address: t.tokenContractAddress || "native",
            }))
          : [],
    },
    prices: {
      okb: okbPrice.status === "fulfilled" ? okbPrice.value.price : "N/A",
      usdg: usdgPrice.status === "fulfilled" ? usdgPrice.value.price : "N/A",
      timestamp: new Date().toISOString(),
    },
    market: {
      trendingOnXLayer:
        trending.status === "fulfilled"
          ? trending.value.slice(0, 5).map((t) => ({
              symbol: t.tokenSymbol,
              name: t.tokenName,
              address: t.tokenAddress,
            }))
          : [],
    },
    security: {
      scanned: topTokens.map((t, i) => ({
        symbol: t.symbol,
        address: t.tokenContractAddress,
        riskLevel:
          securityScans[i]?.status === "fulfilled"
            ? securityScans[i].value.riskLevel
            : "unknown",
        isHoneypot:
          securityScans[i]?.status === "fulfilled"
            ? securityScans[i].value.isHoneypot
            : false,
      })),
    },
    recentActivity: {
      transactions:
        txHistory.status === "fulfilled"
          ? txHistory.value.slice(0, 5).map((tx) => ({
              txHash: tx.txHash,
              from: tx.from,
              to: tx.to,
              value: tx.value,
              symbol: tx.symbol,
              status: tx.status,
              timestamp: tx.timestamp,
            }))
          : [],
    },
    dataSource:
      "OKX OnchainOS — Balance API · Market API · Token API · Transaction API",
    poweredBy: "ZenithPay — spend governance layer for AI agents",
    generatedAt: new Date().toISOString(),
  };
}

// ── Route ──────────────────────────────────────────────────────────────────

sell.on(["GET", "POST"], "/agent-intel", async (c) => {
  const paymentHeader = c.req.header("X-Payment");

  // Step 1: No payment → return 402 + Payment-Required
  if (!paymentHeader) {
    return c.text("Payment Required", 402, {
      "Content-Type": "text/plain",
      "Payment-Required": buildPaymentRequired(),
      "X-ZenithPay-Amount": `${PAYMENT_AMOUNT_DISPLAY} ${PAYMENT_TOKEN}`,
      "X-ZenithPay-Network": `X Layer (${XLAYER_X402_NETWORK})`,
      "X-ZenithPay-Token": XLAYER_USDC,
      "X-ZenithPay-Receiver": DEMO_MERCHANT_ADDRESS,
      "X-ZenithPay-Resource": "Live X Layer wallet intelligence report",
    });
  }

  // Step 2: Decode + validate amount and payee BEFORE calling OKX
  let decoded: DecodedPaymentHeader;
  try {
    decoded = decodePaymentHeader(paymentHeader);
  } catch {
    return c.json(
      {
        error: "invalid_payment_header",
        message: "Could not decode X-Payment header",
      },
      400,
    );
  }

  // Amount check — protect against underpayment
  const requestedAmount = decoded.accepted?.amount ?? "0";
  if (requestedAmount !== PAYMENT_AMOUNT_ATOMIC) {
    return c.json(
      {
        error: "payment_amount_mismatch",
        expected: PAYMENT_AMOUNT_ATOMIC,
        received: requestedAmount,
        message: `Expected ${PAYMENT_AMOUNT_ATOMIC} atomic units (${PAYMENT_AMOUNT_DISPLAY} ${PAYMENT_TOKEN})`,
      },
      402,
    );
  }

  // Payee check — ensure payment goes to the right wallet
  const payTo = decoded.accepted?.payTo ?? "";
  if (payTo.toLowerCase() !== DEMO_MERCHANT_ADDRESS.toLowerCase()) {
    return c.json(
      {
        error: "payment_payee_mismatch",
        expected: DEMO_MERCHANT_ADDRESS,
        message: "Payment recipient does not match this endpoint",
      },
      402,
    );
  }

  // Step 3: Verify signature with OKX x402 facilitator
  const verification = await verifyWithOKX(paymentHeader);
  if (!verification.isValid) {
    return c.json(
      {
        error: "payment_verification_failed",
        reason: verification.invalidReason ?? "unknown",
        message: "OKX x402 verification rejected this payment",
      },
      402,
    );
  }

  // Step 4: Settle onchain via OKX x402 facilitator
  const settlement = await settleWithOKX(paymentHeader);
  if (!settlement.success || !settlement.txHash) {
    return c.json(
      {
        error: "payment_settlement_failed",
        reason: settlement.errorReason ?? "unknown",
        message: "OKX x402 settlement failed",
      },
      402,
    );
  }

  // ORPHAN GUARD: settlement succeeded — must not return an error from here.
  // If resource fetch fails, log critical and return txHash with fallback data.
  let resourceData: Record<string, unknown>;
  try {
    resourceData = await fetchAgentIntel();
  } catch (err) {
    console.error(
      `[sell/agent-intel] ORPHAN PAYMENT: settlement succeeded but resource fetch failed. ` +
        `txHash=${settlement.txHash} payer=${settlement.payer} error=${err}`,
    );
    resourceData = {
      note: "Intelligence report temporarily unavailable — payment was settled. Contact support with txHash.",
      agent: { address: DEMO_AGENT_ADDRESS, network: "X Layer", chainId: 196 },
    };
  }

  // Step 5: Return resource + Payment-Response header
  const paymentResponse = Buffer.from(
    JSON.stringify({
      network: XLAYER_X402_NETWORK,
      payer: settlement.payer ?? verification.payer ?? "",
      success: true,
      transaction: settlement.txHash,
    }),
  ).toString("base64");

  return c.json(
    {
      ...resourceData,
      payment: {
        status: "settled",
        txHash: settlement.txHash,
        network: "X Layer",
        token: PAYMENT_TOKEN,
        amount: PAYMENT_AMOUNT_DISPLAY,
        payer: settlement.payer ?? verification.payer ?? "",
        explorer: `https://www.oklink.com/xlayer/tx/${settlement.txHash}`,
      },
    },
    200,
    {
      "Payment-Response": paymentResponse,
    },
  );
});

export { sell };
