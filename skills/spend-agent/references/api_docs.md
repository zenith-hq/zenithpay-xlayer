# ZenithPay API Reference

**Base URL:** `https://api.usezenithpay.xyz`
**Auth:** `Authorization: Bearer $ZENITHPAY_API_KEY` on all endpoints except `/health`

---

## Endpoints

### GET /health
Health check. No auth.
```json
{ "status": "ok" }
```

### POST /wallet/genesis
Create a TEE-secured agent wallet.
```json
// Request
{ "email": "agent@domain.com", "label": "research-agent-01" }
// Response
{ "agentAddress": "0x...", "label": "research-agent-01", "balances": { "USDC": "0.00", "OKB": "0.00" }, "createdAt": "..." }
```

### GET /wallet/balance?address=0x...
Get USDC + OKB balance for agent(s).
```json
{ "agents": [{ "address": "0x...", "label": "...", "balances": { "USDC": "12.50", "OKB": "0.80" }, "remainingDailyBudget": "1.75" }] }
```

### GET /wallet/agents
List all agents under authenticated account.
```json
{ "agents": [{ "address": "0x...", "label": "research-agent-01" }] }
```

### POST /pay
Execute policy-gated x402 payment.
```json
// Request
{ "agentAddress": "0x...", "serviceUrl": "https://service.xyz/api", "maxAmount": "0.25", "intent": "Research DeFi trends" }
// Approved
{ "status": "approved", "txHash": "0x...", "amount": "0.10", "currency": "USDC", "merchant": "service.xyz", "swapUsed": false, "okbSpent": null, "remainingDailyBudget": "1.65", "settledAt": "..." }
// Pending
{ "status": "pending", "approvalId": "apr_...", "amount": "0.50", "merchant": "service.xyz", "intent": "...", "message": "Payment exceeds approval threshold..." }
// Blocked
{ "status": "blocked", "reason": "daily_budget_exceeded", "amount": "0.10", "merchant": "service.xyz", "onchainEvent": "PaymentBlocked" }
```

Block reasons: `per_tx_limit_exceeded`, `daily_budget_exceeded`, `merchant_not_allowlisted`, `insufficient_balance`, `swap_quote_failed`, `payment_failed`

### GET /limits?address=0x...
Get current spend policy.
```json
{ "agents": [{ "address": "0x...", "perTxLimit": "0.25", "dailyBudget": "3.00", "allowlist": ["exa.ai"], "approvalThreshold": "0.25", "policyContract": "0x..." }] }
```

### POST /limits
Deploy/update spend policy. Requires human EOA signature.
```json
// Request
{ "agentAddress": "0x...", "perTxLimit": "0.25", "dailyBudget": "3.00", "allowlist": ["exa.ai"], "humanSignature": "0x..." }
// Response
{ "status": "deployed", "policyContract": "0x...", "txHash": "0x...", "agentAddress": "0x...", "perTxLimit": "0.25", "dailyBudget": "3.00", "allowlist": ["exa.ai"] }
```

### GET /ledger?address=0x...&limit=50&offset=0&status=approved
Transaction audit trail.
```json
{ "transactions": [{ "id": "txn_...", "agentAddress": "0x...", "merchant": "exa.ai", "amount": "0.10", "currency": "USDC", "intent": "...", "status": "approved", "txHash": "0x...", "timestamp": "..." }], "total": 1, "limit": 50, "offset": 0 }
```

### GET /approvals?address=0x...
List pending payments awaiting human review.
```json
{ "approvals": [{ "id": "apr_...", "agentAddress": "0x...", "merchant": "...", "amount": "0.50", "currency": "USDC", "intent": "...", "requestedAt": "...", "status": "pending" }], "total": 1 }
```

### POST /approvals/:id/approve
Approve pending payment — executes immediately.
```json
{ "id": "apr_...", "status": "approved", "txHash": "0x...", "amount": "0.50", "merchant": "...", "settledAt": "..." }
```

### POST /approvals/:id/deny
Deny pending payment — cancels and logs.
```json
{ "id": "apr_...", "status": "denied", "merchant": "...", "amount": "0.50", "deniedAt": "..." }
```

---

## Error Responses

```json
{ "error": "unauthorized", "message": "Invalid or missing API key.", "status": 401 }
```

| Status | Error | Meaning |
|--------|-------|---------|
| 400 | bad_request | Missing or invalid fields |
| 401 | unauthorized | Invalid API key |
| 404 | not_found | Resource not found |
| 422 | policy_violation | Payment blocked by policy |
| 429 | rate_limited | Too many requests |
| 500 | internal_error | Server error |
