# ZenithPay API Reference

**Base URL:** `https://api.usezenithpay.xyz`
**Auth:** `Authorization: Bearer $ZENITHPAY_API_KEY` on all endpoints except `/health` and `/skill.md`

---

## Endpoints

### GET /health
Health check. No auth required.
```json
{ "status": "ok", "service": "zenithpay-api", "version": "1.0.0", "timestamp": "..." }
```

---

### GET /skill.md
Serves this skill file. No auth required. Agents curl this to get ZenithPay tools.
```bash
curl -s https://api.usezenithpay.xyz/skill.md
```

---

### MCP server
Available at `https://api.usezenithpay.xyz/mcp` via StreamableHTTP transport. Exposes all 6 agent tools. Not consumable from a browser — requires an MCP-compatible client.

MCP config:
```json
{
  "mcpServers": {
    "zenithpay": {
      "url": "https://api.usezenithpay.xyz/mcp",
      "env": {
        "AGENT_ADDRESS": "0x...",
        "ZENITHPAY_API_KEY": "your_key"
      }
    }
  }
}
```

---

### POST /wallet/genesis
Create a TEE-secured agent wallet via OKX Agentic Wallet. Private key never leaves the TEE.

**Request**
```json
{ "email": "agent@domain.com", "label": "research-agent-01" }
```

**Response**
```json
{
  "agentAddress": "0x...",
  "label": "research-agent-01",
  "balances": { "USDC": "0.00", "OKB": "0.00" },
  "createdAt": "2026-01-01T00:00:00Z"
}
```

---

### GET /wallet/balance
Get USDC + OKB balance and remaining daily budget for agent(s).

**Query params:** `address` (optional — filters to specific agent, returns all if omitted)

**Response**
```json
{
  "agents": [{
    "address": "0x...",
    "label": "research-agent-01",
    "balances": { "USDC": "12.50", "OKB": "0.80" },
    "remainingDailyBudget": "1.75"
  }]
}
```

---

### GET /wallet/agents
List all agent addresses registered under the authenticated account.

**Response**
```json
{
  "agents": [
    { "address": "0x...", "label": "research-agent-01" },
    { "address": "0x...", "label": "billing-agent-02" }
  ]
}
```

---

### POST /pay
Execute a policy-gated x402 payment. SpendPolicy.sol is checked onchain before any money moves. Auto-swaps OKB → USDC internally if needed.

**Request**
```json
{
  "agentAddress": "0x...",
  "serviceUrl": "https://service.xyz/api",
  "maxAmount": "0.25",
  "intent": "Research DeFi trends on X Layer"
}
```

**Response — approved**
```json
{
  "status": "approved",
  "txHash": "0x...",
  "amount": "0.10",
  "currency": "USDC",
  "merchant": "service.xyz",
  "swapUsed": false,
  "okbSpent": null,
  "remainingDailyBudget": "1.65",
  "settledAt": "2026-01-01T00:00:00Z"
}
```

**Response — pending (above approvalThreshold)**
```json
{
  "status": "pending",
  "approvalId": "apr_01abc",
  "amount": "0.50",
  "merchant": "service.xyz",
  "intent": "Research DeFi trends",
  "message": "Payment exceeds approval threshold. Awaiting human review at GET /approvals."
}
```

**Response — blocked**
```json
{
  "status": "blocked",
  "reason": "daily_budget_exceeded",
  "amount": "0.10",
  "merchant": "service.xyz",
  "onchainEvent": "PaymentBlocked"
}
```

**Block reasons**

| Reason | Description |
|--------|-------------|
| `per_tx_limit_exceeded` | Amount exceeds per-transaction cap |
| `daily_budget_exceeded` | Agent has hit daily spend limit |
| `merchant_not_allowlisted` | Merchant not in agent's allowlist |
| `insufficient_balance` | Insufficient USDC and OKB to cover payment + swap |
| `swap_quote_failed` | OKX DEX could not produce a valid quote |
| `payment_failed` | x402 verify or settle failed after policy cleared |

---

### GET /limits
Get current onchain spend policy for agent(s).

**Query params:** `address` (optional)

**Response**
```json
{
  "agents": [{
    "address": "0x...",
    "perTxLimit": "0.25",
    "dailyBudget": "3.00",
    "remainingDailyBudget": "1.75",
    "allowlist": ["exa.ai", "firecrawl.dev"],
    "approvalThreshold": "0.10",
    "policyContract": "0xF5875F25ccEB2edDc57F218eaF1F71c5CF161f21"
  }]
}
```

---

### POST /limits
Deploy or update the agent's SpendPolicy contract onchain. Requires human EOA signature.

**Request**
```json
{
  "agentAddress": "0x...",
  "perTxLimit": "0.25",
  "dailyBudget": "3.00",
  "allowlist": ["exa.ai", "firecrawl.dev"],
  "approvalThreshold": "0.10",
  "humanSignature": "0x..."
}
```

**Response**
```json
{
  "status": "deployed",
  "policyContract": "0xF5875F25ccEB2edDc57F218eaF1F71c5CF161f21",
  "txHash": "0x...",
  "agentAddress": "0x...",
  "perTxLimit": "0.25",
  "dailyBudget": "3.00",
  "allowlist": ["exa.ai", "firecrawl.dev"],
  "approvalThreshold": "0.10"
}
```

---

### GET /ledger
Full transaction audit trail for agent(s).

**Query params:** `address` (optional), `limit` (default 50, max 200), `offset`, `status` (`approved`, `blocked`, `pending`, `denied`)

**Response**
```json
{
  "transactions": [{
    "id": "txn_01abc",
    "agentAddress": "0x...",
    "merchant": "exa.ai",
    "amount": "0.10",
    "currency": "USDC",
    "intent": "Research DeFi trends",
    "status": "approved",
    "txHash": "0x...",
    "swapUsed": false,
    "okbSpent": null,
    "timestamp": "2026-01-01T00:00:00Z"
  }],
  "total": 1,
  "limit": 50,
  "offset": 0
}
```

---

### GET /approvals
List pending payments awaiting human review. Only payments that exceeded `approvalThreshold` appear here. Hard-blocked payments go directly to ledger.

**Query params:** `address` (optional)

**Response**
```json
{
  "approvals": [{
    "id": "apr_01abc",
    "agentAddress": "0x...",
    "agentLabel": "research-agent-01",
    "merchant": "service.xyz",
    "amount": "0.50",
    "currency": "USDC",
    "intent": "Research DeFi trends",
    "requestedAt": "2026-01-01T00:01:00Z",
    "status": "pending"
  }],
  "total": 1
}
```

---

### POST /approvals/:id/approve
Approve a pending payment. Executes immediately — runs full pay flow (balance check → swap if needed → x402 settle → ledger).

**Response**
```json
{
  "id": "apr_01abc",
  "status": "approved",
  "txHash": "0x...",
  "amount": "0.50",
  "merchant": "service.xyz",
  "settledAt": "2026-01-01T00:05:00Z"
}
```

---

### POST /approvals/:id/deny
Deny a pending payment. Cancels and logs to ledger as `denied`.

**Response**
```json
{
  "id": "apr_01abc",
  "status": "denied",
  "merchant": "service.xyz",
  "amount": "0.50",
  "deniedAt": "2026-01-01T00:05:00Z"
}
```

---

## Error responses

All errors follow this shape:
```json
{ "error": "unauthorized", "message": "Invalid or missing API key.", "status": 401 }
```

| Status | Error | Meaning |
|--------|-------|---------|
| 400 | `bad_request` | Missing or invalid request fields |
| 401 | `unauthorized` | Missing or invalid API key |
| 403 | `forbidden` | API key does not have permission for this agent |
| 404 | `not_found` | Agent or resource not found |
| 422 | `policy_violation` | Payment blocked by onchain policy |
| 429 | `rate_limited` | Too many requests — back off and retry |
| 500 | `internal_error` | Server error |

---

## Deployed contracts

| Contract | Network | Address |
|----------|---------|---------|
| SpendPolicy | X Layer mainnet (chain ID 196) | `0xF5875F25ccEB2edDc57F218eaF1F71c5CF161f21` |

USDC on X Layer: `0x74b7F16337b8972027F6196A17a631aC6dE26d22`
