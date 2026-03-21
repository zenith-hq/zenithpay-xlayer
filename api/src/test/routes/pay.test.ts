import { describe, expect, it, vi } from "vitest";
import { app } from "../../app";

const API_KEY = "test_secret_key_minimum_32_characters_long";
const AUTH_HEADER = { Authorization: `Bearer ${API_KEY}` };
const JSON_HEADERS = { ...AUTH_HEADER, "Content-Type": "application/json" };

const mockExecutePayment = vi.fn();

vi.mock("../../modules/payment/payment.service", () => ({
  executePayment: (...args: unknown[]) => mockExecutePayment(...args),
}));

describe("Pay routes", () => {
  it("POST /pay without auth → 401", async () => {
    const res = await app.request("/pay", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        agentAddress: "0x0000000000000000000000000000000000000001",
        serviceUrl: "https://exa.ai",
        maxAmount: "0.10",
        intent: "Test",
      }),
    });
    expect(res.status).toBe(401);
  });

  it("POST /pay missing agentAddress → 400", async () => {
    const res = await app.request("/pay", {
      method: "POST",
      headers: JSON_HEADERS,
      body: JSON.stringify({
        serviceUrl: "https://exa.ai",
        maxAmount: "0.10",
        intent: "Test",
      }),
    });
    expect(res.status).toBe(400);
  });

  it("POST /pay missing intent → 400", async () => {
    const res = await app.request("/pay", {
      method: "POST",
      headers: JSON_HEADERS,
      body: JSON.stringify({
        agentAddress: "0x0000000000000000000000000000000000000001",
        serviceUrl: "https://exa.ai",
        maxAmount: "0.10",
      }),
    });
    expect(res.status).toBe(400);
  });

  it("POST /pay, policy approved → 200", async () => {
    mockExecutePayment.mockResolvedValueOnce({
      status: "approved",
      txHash: "0xabc123",
      amount: "0.10",
      currency: "USDC",
      merchant: "exa.ai",
      intent: "Test",
      swapUsed: false,
      okbSpent: null,
      remainingDailyBudget: "1.65",
      settledAt: "2026-01-01T00:00:00.000Z",
    });

    const res = await app.request("/pay", {
      method: "POST",
      headers: JSON_HEADERS,
      body: JSON.stringify({
        agentAddress: "0x0000000000000000000000000000000000000001",
        serviceUrl: "https://exa.ai",
        maxAmount: "0.10",
        intent: "Test",
      }),
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.status).toBe("approved");
    expect(body.txHash).toBe("0xabc123");
  });

  it("POST /pay, above threshold → 202", async () => {
    mockExecutePayment.mockResolvedValueOnce({
      status: "pending",
      approvalId: "apr_abc123",
      amount: "0.50",
      merchant: "exa.ai",
      intent: "Expensive query",
      message:
        "Payment exceeds approval threshold. Awaiting human review at GET /approvals.",
    });

    const res = await app.request("/pay", {
      method: "POST",
      headers: JSON_HEADERS,
      body: JSON.stringify({
        agentAddress: "0x0000000000000000000000000000000000000001",
        serviceUrl: "https://exa.ai",
        maxAmount: "0.50",
        intent: "Expensive query",
      }),
    });
    expect(res.status).toBe(202);
    const body = await res.json();
    expect(body.status).toBe("pending");
    expect(body.approvalId).toBeDefined();
  });

  it("POST /pay, policy blocked → 422", async () => {
    mockExecutePayment.mockResolvedValueOnce({
      status: "blocked",
      reason: "per_tx_limit_exceeded",
      amount: "10.00",
      merchant: "exa.ai",
      onchainEvent: "PaymentBlocked",
    });

    const res = await app.request("/pay", {
      method: "POST",
      headers: JSON_HEADERS,
      body: JSON.stringify({
        agentAddress: "0x0000000000000000000000000000000000000001",
        serviceUrl: "https://exa.ai",
        maxAmount: "10.00",
        intent: "Too expensive",
      }),
    });
    expect(res.status).toBe(422);
    const body = await res.json();
    expect(body.status).toBe("blocked");
    expect(body.reason).toBe("per_tx_limit_exceeded");
  });
});
