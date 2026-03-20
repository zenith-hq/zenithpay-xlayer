# ZenithPay — Spend Agent Skill

> Security middleware for AI agents that spend money. Policy-enforced x402 payments on X Layer.

**Base URL:** `https://api.usezenithpay.xyz`

---

## Setup

Set these environment variables before using ZenithPay tools:

```
AGENT_ADDRESS=0x...       # Your agent wallet address on X Layer
ZENITHPAY_API_KEY=...     # API key from your human account
```

---

## Tools

### zenithpay_get_limits

**Call this first** at the start of every session to understand your spending policy.

```
GET /limits?address=${AGENT_ADDRESS}
Authorization: Bearer ${ZENITHPAY_API_KEY}
```

Returns: `perTxLimit`, `dailyBudget`, `remainingDailyBudget`, `allowlist`, `policyContract`

### zenithpay_balance

Check your current funds before spending.

```
GET /wallet/balance?address=${AGENT_ADDRESS}
Authorization: Bearer ${ZENITHPAY_API_KEY}
```

Returns: `USDC` balance, `OKB` balance, `remainingDailyBudget`

### zenithpay_verify_merchant

Safety check a merchant URL before paying. Runs OKX security scan and checks your allowlist.

```
POST /verify-merchant
{ "merchantUrl": "https://service.xyz/api" }
```

Returns: `safe` (boolean), `allowlisted` (boolean), `riskLevel`, `scanResult`

**If `safe: false`** — do NOT proceed with payment.
**If `allowlisted: false`** and your policy has an allowlist — payment will be blocked on-chain.

### zenithpay_pay_service

Execute a policy-gated x402 payment. SpendPolicy.sol is checked on-chain before any money moves. If you hold OKB instead of USDC, auto-swap happens internally.

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

**Responses:**
- `status: "approved"` — payment settled, `txHash` included
- `status: "pending"` — above approval threshold, human must review at `/approvals`
- `status: "blocked"` — policy violation, `reason` included

### zenithpay_set_limits

Update your spend policy on-chain. Requires human EOA signature — you cannot change your own limits.

```
POST /limits
{
  "agentAddress": "${AGENT_ADDRESS}",
  "perTxLimit": "0.25",
  "dailyBudget": "3.00",
  "allowlist": ["exa.ai"],
  "humanSignature": "0x..."
}
```

### zenithpay_ledger

Query your transaction audit trail.

```
GET /ledger?address=${AGENT_ADDRESS}&limit=20&status=approved
Authorization: Bearer ${ZENITHPAY_API_KEY}
```

Returns: array of transactions with `merchant`, `amount`, `intent`, `status`, `txHash`, `timestamp`

---

## Behavior Rules

1. **Always check limits first** — call `zenithpay_get_limits` before any payment
2. **Always check balance** — call `zenithpay_balance` before `zenithpay_pay_service`
3. **Verify new merchants** — call `zenithpay_verify_merchant` for any URL you haven't paid before
4. **Include intent** — every payment requires a human-readable `intent` string explaining why you're spending
5. **Respect blocks** — if a payment returns `status: "blocked"`, report the `reason` and do not retry
6. **Never exceed maxAmount** — set a sensible cap per transaction based on your remaining daily budget
7. **Log sessions** — call `zenithpay_ledger` at the end of your session for a complete audit trail

---

## Recommended Call Order

```
zenithpay_get_limits()         → understand policy before spending
zenithpay_balance()            → confirm funds available
zenithpay_verify_merchant()    → safety check the merchant
zenithpay_pay_service()        → pay
zenithpay_ledger()             → review audit trail
```

---

## API Reference

Full endpoint documentation: `${CLAUDE_SKILL_DIR}/references/api_docs.md`
