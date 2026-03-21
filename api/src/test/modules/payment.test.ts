import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("viem", async () => {
  const actual = await vi.importActual("viem");
  return {
    ...actual,
    createPublicClient: () => ({
      readContract: vi.fn().mockResolvedValue([true, ""]),
    }),
  };
});

const mockGetLimits = vi.fn();
const mockGetTokenBalances = vi.fn();
const mockWriteTransaction = vi.fn();
const mockCreatePendingApproval = vi.fn();
const mockVerifyX402 = vi.fn();
const mockSettleX402 = vi.fn();
const mockQuoteOkbToUsdc = vi.fn();
const mockSwapOkbToUsdc = vi.fn();

vi.mock("../../modules/limits/limits.service", () => ({
  getLimits: (...args: unknown[]) => mockGetLimits(...args),
}));

vi.mock("../../providers/onchainos/balance", () => ({
  getTokenBalances: (...args: unknown[]) => mockGetTokenBalances(...args),
}));

vi.mock("../../modules/ledger/ledger.service", () => ({
  writeTransaction: (...args: unknown[]) => mockWriteTransaction(...args),
}));

vi.mock("../../modules/approvals/approvals.service", () => ({
  createPendingApproval: (...args: unknown[]) =>
    mockCreatePendingApproval(...args),
}));

vi.mock("../../providers/onchainos/payments", () => ({
  verifyX402: (...args: unknown[]) => mockVerifyX402(...args),
  settleX402: (...args: unknown[]) => mockSettleX402(...args),
}));

vi.mock("../../providers/onchainos/swap", () => ({
  quoteOkbToUsdc: (...args: unknown[]) => mockQuoteOkbToUsdc(...args),
  swapOkbToUsdc: (...args: unknown[]) => mockSwapOkbToUsdc(...args),
}));

describe("Payment service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetLimits.mockResolvedValue({
      address: "0x0000000000000000000000000000000000000001",
      perTxLimit: "1.00",
      dailyBudget: "10.00",
      allowlist: [],
      approvalThreshold: null,
      autoSwapEnabled: true,
      swapSlippageTolerance: "0.01",
      policyContract: "0xF5875F25ccEB2edDc57F218eaF1F71c5CF161f21",
    });
    mockWriteTransaction.mockResolvedValue({ id: "txn_test" });
  });

  it("approved path: sufficient USDC, no swap needed", async () => {
    mockGetTokenBalances.mockResolvedValue([
      {
        tokenContractAddress: "0x74b7f16337b8972027f6196a17a631ac6de26d22",
        symbol: "USDC",
        balance: "5.00",
      },
      {
        tokenContractAddress: "",
        symbol: "OKB",
        balance: "1.00",
      },
    ]);
    mockVerifyX402.mockResolvedValue({ valid: true });
    mockSettleX402.mockResolvedValue({ txHash: "0xabc123", status: "settled" });

    const { executePayment } = await import(
      "../../modules/payment/payment.service"
    );
    const result = await executePayment({
      agentAddress: "0x0000000000000000000000000000000000000001",
      serviceUrl: "https://exa.ai",
      maxAmount: "0.10",
      intent: "Test payment",
    });

    expect(result.status).toBe("approved");
    if (result.status === "approved") {
      expect(result.txHash).toBe("0xabc123");
      expect(result.swapUsed).toBe(false);
    }
  });

  it("blocked path: insufficient balance (no OKB)", async () => {
    mockGetTokenBalances.mockResolvedValue([
      {
        tokenContractAddress: "0x74b7f16337b8972027f6196a17a631ac6de26d22",
        symbol: "USDC",
        balance: "0.01",
      },
      {
        tokenContractAddress: "",
        symbol: "OKB",
        balance: "0",
      },
    ]);

    const { executePayment } = await import(
      "../../modules/payment/payment.service"
    );
    const result = await executePayment({
      agentAddress: "0x0000000000000000000000000000000000000001",
      serviceUrl: "https://exa.ai",
      maxAmount: "0.10",
      intent: "Test",
    });

    expect(result.status).toBe("blocked");
    if (result.status === "blocked") {
      expect(result.reason).toBe("insufficient_balance");
    }
  });

  it("pending path: above approval threshold", async () => {
    mockGetLimits.mockResolvedValue({
      address: "0x0000000000000000000000000000000000000001",
      perTxLimit: "10.00",
      dailyBudget: "100.00",
      allowlist: [],
      approvalThreshold: "0.25",
      policyContract: "0xF5875F25ccEB2edDc57F218eaF1F71c5CF161f21",
    });
    mockCreatePendingApproval.mockResolvedValue({
      id: "apr_test123",
    });

    const { executePayment } = await import(
      "../../modules/payment/payment.service"
    );
    const result = await executePayment({
      agentAddress: "0x0000000000000000000000000000000000000001",
      serviceUrl: "https://exa.ai",
      maxAmount: "0.50",
      intent: "Expensive query",
    });

    expect(result.status).toBe("pending");
    if (result.status === "pending") {
      expect(result.approvalId).toBe("apr_test123");
    }
  });

  it("auto-swap triggered when USDC insufficient but OKB available", async () => {
    mockGetTokenBalances.mockResolvedValue([
      {
        tokenContractAddress: "0x74b7f16337b8972027f6196a17a631ac6de26d22",
        symbol: "USDC",
        balance: "0.01",
      },
      {
        tokenContractAddress: "",
        symbol: "OKB",
        balance: "5.00",
      },
    ]);
    mockQuoteOkbToUsdc.mockResolvedValue({
      routerResult: {
        fromTokenAmount: "50000000000000000",
        toTokenAmount: "90000",
      },
    });
    mockSwapOkbToUsdc.mockResolvedValue({
      routerResult: {
        fromTokenAmount: "50000000000000000",
        toTokenAmount: "90000",
      },
    });
    mockVerifyX402.mockResolvedValue({ valid: true });
    mockSettleX402.mockResolvedValue({
      txHash: "0xswap123",
      status: "settled",
    });

    const { executePayment } = await import(
      "../../modules/payment/payment.service"
    );
    const result = await executePayment({
      agentAddress: "0x0000000000000000000000000000000000000001",
      serviceUrl: "https://exa.ai",
      maxAmount: "0.10",
      intent: "Swap and pay",
    });

    expect(result.status).toBe("approved");
    if (result.status === "approved") {
      expect(result.swapUsed).toBe(true);
      expect(result.okbSpent).toBeDefined();
    }
    expect(mockQuoteOkbToUsdc).toHaveBeenCalled();
    expect(mockSwapOkbToUsdc).toHaveBeenCalled();
  });

  it("swap NOT triggered when USDC is sufficient", async () => {
    mockGetTokenBalances.mockResolvedValue([
      {
        tokenContractAddress: "0x74b7f16337b8972027f6196a17a631ac6de26d22",
        symbol: "USDC",
        balance: "10.00",
      },
      {
        tokenContractAddress: "",
        symbol: "OKB",
        balance: "5.00",
      },
    ]);
    mockVerifyX402.mockResolvedValue({ valid: true });
    mockSettleX402.mockResolvedValue({ txHash: "0xnoswap", status: "settled" });

    const { executePayment } = await import(
      "../../modules/payment/payment.service"
    );
    const result = await executePayment({
      agentAddress: "0x0000000000000000000000000000000000000001",
      serviceUrl: "https://exa.ai",
      maxAmount: "0.10",
      intent: "No swap needed",
    });

    expect(result.status).toBe("approved");
    if (result.status === "approved") {
      expect(result.swapUsed).toBe(false);
    }
    expect(mockQuoteOkbToUsdc).not.toHaveBeenCalled();
    expect(mockSwapOkbToUsdc).not.toHaveBeenCalled();
  });

  it("blocked path: x402 payment failure", async () => {
    mockGetTokenBalances.mockResolvedValue([
      {
        tokenContractAddress: "0x74b7f16337b8972027f6196a17a631ac6de26d22",
        symbol: "USDC",
        balance: "5.00",
      },
    ]);
    mockVerifyX402.mockRejectedValue(new Error("x402 verify failed"));

    const { executePayment } = await import(
      "../../modules/payment/payment.service"
    );
    const result = await executePayment({
      agentAddress: "0x0000000000000000000000000000000000000001",
      serviceUrl: "https://exa.ai",
      maxAmount: "0.10",
      intent: "Will fail",
    });

    expect(result.status).toBe("blocked");
    if (result.status === "blocked") {
      expect(result.reason).toBe("payment_failed");
    }
  });
});
