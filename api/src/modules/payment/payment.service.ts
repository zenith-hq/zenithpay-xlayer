import { createPublicClient, http } from "viem";
import { OKB_NATIVE, XLAYER_USDC, xlayer } from "../../config/chains";
import { SPEND_POLICY_ABI, SPEND_POLICY_ADDRESS } from "../../config/contracts";
import * as balanceProvider from "../../providers/onchainos/balance";
import * as paymentsProvider from "../../providers/onchainos/payments";
import * as swapProvider from "../../providers/onchainos/swap";
import { extractHost, unitsToUsdc, usdcToUnits } from "../../utils";
import * as approvalsService from "../approvals/approvals.service";
import * as ledgerService from "../ledger/ledger.service";
import { getLimits } from "../limits/limits.service";
import type { PaymentRequest, PaymentResult } from "./payment.types";

const viemClient = createPublicClient({
  chain: xlayer,
  transport: http(),
});

/**
 * Core payment execution — follows the non-negotiable 6-step flow:
 * 1. SpendPolicy.sol check (on-chain)
 * 2. USDC balance check
 * 3. OKB auto-swap (conditional)
 * 4. x402 payment (verify + settle)
 * 5. Ledger write
 * 6. Return response
 */
export async function executePayment(
  request: PaymentRequest,
): Promise<PaymentResult> {
  const { agentAddress, serviceUrl, maxAmount, intent } = request;
  const merchant = extractHost(serviceUrl);
  const amountUnits = usdcToUnits(maxAmount);

  // ── STEP 1: SpendPolicy.sol check ──
  const policy = await getLimits(agentAddress);

  // Merchant is identified by URL in this flow; zero address is the on-chain placeholder.
  // If merchantAllowlistEnabled=false (default), the contract skips the merchant check.
  // If enabled, the human must allowlist specific EVM addresses via the dashboard.
  const ZERO_ADDRESS =
    "0x0000000000000000000000000000000000000000" as `0x${string}`;

  try {
    const [allowed, reason] = (await viemClient.readContract({
      address: SPEND_POLICY_ADDRESS,
      abi: SPEND_POLICY_ABI,
      functionName: "checkPayment",
      args: [agentAddress as `0x${string}`, ZERO_ADDRESS, amountUnits],
    })) as [boolean, string];

    if (!allowed) {
      const blockReason = mapOnchainReason(reason);

      await ledgerService.writeTransaction({
        agentAddress,
        merchant,
        amount: maxAmount,
        currency: "USDC",
        intent,
        status: "blocked",
        reason: blockReason,
        swapUsed: false,
      });

      return {
        status: "blocked",
        reason: blockReason,
        amount: maxAmount,
        merchant,
        onchainEvent: "PaymentBlocked",
      };
    }
  } catch (error) {
    // RPC failure — fail closed: block the payment rather than skip the policy check
    const message =
      error instanceof Error ? error.message : "Policy check failed";
    await ledgerService.writeTransaction({
      agentAddress,
      merchant,
      amount: maxAmount,
      currency: "USDC",
      intent,
      status: "blocked",
      reason: "policy_check_failed",
      swapUsed: false,
    });
    return {
      status: "blocked",
      reason: "policy_check_failed",
      amount: maxAmount,
      merchant,
      onchainEvent: "PaymentBlocked",
      message,
    };
  }

  // Check approval threshold (off-chain soft gate)
  if (policy.approvalThreshold) {
    const thresholdUnits = usdcToUnits(policy.approvalThreshold);
    if (amountUnits > thresholdUnits) {
      const approval = await approvalsService.createPendingApproval({
        agentAddress,
        merchant,
        serviceUrl,
        amount: maxAmount,
        intent,
      });

      return {
        status: "pending",
        approvalId: approval.id,
        amount: maxAmount,
        merchant,
        intent,
        message:
          "Payment exceeds approval threshold. Awaiting human review at GET /approvals.",
      };
    }
  }

  // ── STEP 2: USDC balance check ──
  const tokenBalances = await balanceProvider.getTokenBalances(agentAddress, [
    XLAYER_USDC,
    OKB_NATIVE,
  ]);

  let usdcBalance = 0;
  let okbBalance = 0;
  for (const tb of tokenBalances) {
    if (tb.tokenAddress.toLowerCase() === XLAYER_USDC.toLowerCase()) {
      usdcBalance = Number.parseFloat(tb.balance);
    }
    if (
      tb.tokenAddress.toLowerCase() === OKB_NATIVE.toLowerCase() ||
      tb.symbol === "OKB"
    ) {
      okbBalance = Number.parseFloat(tb.balance);
    }
  }

  const amountFloat = Number.parseFloat(maxAmount);
  let swapUsed = false;
  let okbSpent: string | null = null;

  // ── STEP 3: OKB auto-swap (conditional) ──
  if (usdcBalance < amountFloat) {
    const deficit = amountFloat - usdcBalance;

    if (okbBalance <= 0) {
      await ledgerService.writeTransaction({
        agentAddress,
        merchant,
        amount: maxAmount,
        currency: "USDC",
        intent,
        status: "blocked",
        reason: "insufficient_balance",
        swapUsed: false,
      });

      return {
        status: "blocked",
        reason: "insufficient_balance",
        amount: maxAmount,
        merchant,
        onchainEvent: "PaymentBlocked",
      };
    }

    try {
      const quote = await swapProvider.quoteOkbToUsdc(
        usdcToUnits(deficit.toFixed(6)).toString(),
        agentAddress,
      );

      const swapResult = await swapProvider.swapOkbToUsdc(
        quote.routerResult.fromTokenAmount,
        agentAddress,
      );

      swapUsed = true;
      okbSpent = swapResult.routerResult.fromTokenAmount;
    } catch {
      await ledgerService.writeTransaction({
        agentAddress,
        merchant,
        amount: maxAmount,
        currency: "USDC",
        intent,
        status: "blocked",
        reason: "swap_quote_failed",
        swapUsed: false,
      });

      return {
        status: "blocked",
        reason: "swap_quote_failed",
        amount: maxAmount,
        merchant,
        onchainEvent: "PaymentBlocked",
      };
    }
  }

  // ── STEP 4: x402 payment ──
  let txHash: string;
  try {
    await paymentsProvider.verifyX402(serviceUrl, agentAddress, maxAmount);
    const settleResult = await paymentsProvider.settleX402(
      serviceUrl,
      agentAddress,
      maxAmount,
      "", // signature handled by OKX Payments API internally
    );
    txHash = settleResult.txHash;
  } catch {
    await ledgerService.writeTransaction({
      agentAddress,
      merchant,
      amount: maxAmount,
      currency: "USDC",
      intent,
      status: "blocked",
      reason: "payment_failed",
      swapUsed,
      okbSpent,
    });

    return {
      status: "blocked",
      reason: "payment_failed",
      amount: maxAmount,
      merchant,
      onchainEvent: "PaymentBlocked",
    };
  }

  // ── STEP 5: Ledger write ──
  await ledgerService.writeTransaction({
    agentAddress,
    merchant,
    amount: maxAmount,
    currency: "USDC",
    intent,
    status: "approved",
    txHash,
    swapUsed,
    okbSpent,
  });

  // ── STEP 6: Return response ──
  let remainingDailyBudget = "0";
  try {
    const remaining = await viemClient.readContract({
      address: SPEND_POLICY_ADDRESS,
      abi: SPEND_POLICY_ABI,
      functionName: "getRemainingDailyBudget",
      args: [agentAddress as `0x${string}`],
    });
    remainingDailyBudget = unitsToUsdc(remaining as bigint);
  } catch {
    // fallback
  }

  return {
    status: "approved",
    txHash,
    amount: maxAmount,
    currency: "USDC",
    merchant,
    intent,
    swapUsed,
    okbSpent,
    remainingDailyBudget,
    settledAt: new Date().toISOString(),
  };
}

function mapOnchainReason(
  reason: string,
): PaymentResult extends { reason: infer R } ? R : never {
  const map: Record<string, string> = {
    exceeds_per_tx_limit: "per_tx_limit_exceeded",
    exceeds_daily_limit: "daily_budget_exceeded",
    merchant_not_allowed: "merchant_not_allowlisted",
    agent_not_active: "agent_not_active",
  };
  return (map[reason] ?? reason) as ReturnType<typeof mapOnchainReason>;
}
