---
name: spend-agent
description: >
  Use this skill when an agent needs to make payments, check wallet balance,
  verify merchants, set or read spending limits, query transaction history,
  review pending approvals, or interact with any x402-compatible service on
  X Layer. Trigger on: pay for service, execute payment, check balance, check
  funds, verify merchant, set limits, update policy, spending policy, view
  ledger, audit trail, approve payment, deny payment, x402 payment, USDC
  payment, agent wallet, spend policy, daily budget, per-transaction limit,
  merchant allowlist, approval threshold, ZenithPay, zenithpay_pay_service,
  zenithpay_balance, zenithpay_get_limits, zenithpay_set_limits,
  zenithpay_verify_merchant, zenithpay_ledger. Security middleware for AI
  agents that spend money — policy-enforced x402 payments on X Layer via
  ZenithPay. Do NOT use for non-payment tasks. Do NOT use for wallet creation
  — that is a human action via POST /wallet/genesis.
user-invocable: true
metadata:
  author: zenithpay
  version: "1.0.0"
  homepage: "https://usezenithpay.xyz"
---

# ZenithPay — Spend Agent Skill

Security middleware for AI agents that spend money. Policy-enforced x402 payments on X Layer.

**Base URL:** `https://api.usezenithpay.xyz`

---

## Setup

Set these environment variables before using ZenithPay tools:

```
AGENT_ADDRESS=0x...       # Your agent wallet address on X Layer
ZENITHPAY_API_KEY=...     # API key from your human account
```

---

## Mandatory call order — follow this every session

Every session that involves spending must follow this order. Do not skip steps.

```
1. zenithpay_get_limits()       → understand your policy before any spend
2. zenithpay_balance()          → confirm funds are available
3. zenithpay_verify_merchant()  → safety check the merchant before paying
4. zenithpay_pay_service()      → execute the payment
5. zenithpay_ledger()           → review audit trail at end of session
```

---

## Tools

### zenithpay_get_limits

Call this first at the start of every session. Reads the agent's current onchain spend policy.

```
GET /limits?address=${AGENT_ADDRESS}
Authorization: Bearer ${ZENITHPAY_API_KEY}
```

Returns: `perTxLimit`, `dailyBudget`, `remainingDailyBudget`, `allowlist`, `approvalThreshold`, `policyContract`

If `remainingDailyBudget` is less than your intended spend, do not proceed. Tell the user the budget is exhausted.

---

### zenithpay_balance

Check wallet funds before spending. Call after `zenithpay_get_limits`.

```
GET /wallet/balance?address=${AGENT_ADDRESS}
Authorization: Bearer ${ZENITHPAY_API_KEY}
```

Returns: `USDC` balance, `OKB` balance, `remainingDailyBudget`

If USDC balance is insufficient, ZenithPay will auto-swap OKB to USDC internally — but only if OKB balance is sufficient to cover the swap. If both are zero, do not proceed.

---

### zenithpay_verify_merchant

Run this before paying any merchant you have not paid before. Executes an OKX security scan and checks the agent's allowlist.

```
POST /verify-merchant
Authorization: Bearer ${ZENITHPAY_API_KEY}
{ "merchantUrl": "https://service.xyz/api" }
```

Returns: `safe` (boolean), `allowlisted` (boolean), `riskLevel`, `scanResult`, `warning` (if any)

If `safe: false` — do not proceed. Report the warning to the user and stop.
If `allowlisted: false` and the agent policy has an allowlist set — the payment will be blocked onchain regardless. Tell the user to add the merchant via the dashboard before retrying.

---

### zenithpay_pay_service

Execute a policy-gated x402 payment. The onchain SpendPolicy contract is checked before any money moves. Auto-swap from OKB to USDC happens internally if needed — the agent does not need to trigger this manually.

```
POST /pay
Authorization: Bearer ${ZENITHPAY_API_KEY}
{
  "agentAddress": "${AGENT_ADDRESS}",
  "serviceUrl": "https://service.xyz/api",
  "maxAmount": "0.25",
  "intent": "Research DeFi trends on X Layer"
}
```

The `intent` field is required. It must be a human-readable description of why the agent is spending. It is logged onchain permanently.

**Responses:**

`status: "approved"` — payment settled onchain. `txHash` is included. Report the txHash to the user.

`status: "pending"` — payment exceeded the `approvalThreshold`. It is queued for human review at `GET /approvals`. Tell the user a payment is waiting for their approval. Do not retry.

`status: "blocked"` — policy violation. The `reason` field explains why. Report the reason and do not retry the same payment.

Block reasons and what they mean:
- `per_tx_limit_exceeded` — amount is above the per-transaction cap. Reduce `maxAmount`.
- `daily_budget_exceeded` — agent has spent its daily budget. Wait for reset or ask human to raise the limit.
- `merchant_not_allowlisted` — this merchant is not on the agent's allowlist. Ask human to add it.
- `insufficient_balance` — not enough USDC or OKB to cover the payment and any swap.
- `swap_quote_failed` — OKX DEX could not produce a swap quote. Try again later.
- `payment_failed` — x402 settlement failed after policy cleared. Try again.

---

### zenithpay_set_limits

Update the agent's spend policy onchain. This requires a human EOA signature — the agent cannot change its own limits. Only call this when the human has explicitly requested a policy update and has provided a signature.

```
POST /limits
Authorization: Bearer ${ZENITHPAY_API_KEY}
{
  "agentAddress": "${AGENT_ADDRESS}",
  "perTxLimit": "0.25",
  "dailyBudget": "3.00",
  "allowlist": ["exa.ai", "firecrawl.dev"],
  "approvalThreshold": "0.10",
  "humanSignature": "0x..."
}
```

Returns: `status: "deployed"`, `policyContract`, `txHash`

---

### zenithpay_ledger

Query the agent's full transaction audit trail. Call at the end of every session.

```
GET /ledger?address=${AGENT_ADDRESS}&limit=20&status=approved
Authorization: Bearer ${ZENITHPAY_API_KEY}
```

Optional query params: `limit` (default 20, max 200), `offset`, `status` (`approved`, `blocked`, `pending`, `denied`)

Returns: array of transactions with `merchant`, `amount`, `intent`, `status`, `txHash`, `timestamp`, `swapUsed`, `okbSpent`

---

## Approval queue

If a payment returns `status: "pending"`, it is waiting in the human's approval queue. The agent cannot approve its own payments — this is by design. Tell the user to visit the dashboard or use:

```
GET /approvals
Authorization: Bearer ${ZENITHPAY_API_KEY}
```

To approve: `POST /approvals/:id/approve`
To deny: `POST /approvals/:id/deny`

---

## Rules

- Never call `zenithpay_pay_service` without first calling `zenithpay_get_limits` and `zenithpay_balance`
- Never call `zenithpay_pay_service` on a new merchant without first calling `zenithpay_verify_merchant`
- Always include a meaningful `intent` string — vague intents like "buy stuff" are not acceptable
- Never retry a blocked payment — report the reason and stop
- Never retry a pending payment — it is waiting for human review
- Never attempt to set limits without an explicit human request and signature

---

## API Reference

Full endpoint documentation with all request schemas and response shapes:
`${CLAUDE_SKILL_DIR}/references/api_docs.md`
