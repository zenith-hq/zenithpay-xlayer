<div align="center">

<img src="web/public/banner.png" alt="ZenithPay"/>

# ZenithPay

> Your Agent spends. You Own the Rules.

**Security middleware for AI agents that spend money — hard limits enforced at the smart contract level, x402-native payment routing, auto-swap, and a human approval queue. Built on X Layer and OKX OnchainOS.**

<a href="https://docs.usezenithpay.xyz">Docs</a> &nbsp;·&nbsp;
<a href="https://api.usezenithpay.xyz/skill.md">Skill.md</a> &nbsp;·&nbsp;
<a href="https://usezenithpay.xyz">Live Demo</a> &nbsp;·&nbsp;
<a href="">Video Demo</a> &nbsp;·&nbsp;
<a href="https://www.oklink.com/xlayer/tx/0xf0be30b27021c475fcdfcb8657f8d392617ebc25454a329af9240df3ded22ae9">TX Proof</a>

![Network](https://img.shields.io/badge/Network-X%20Layer-19191A?style=flat-square&logoColor=white)
![Payments](https://img.shields.io/badge/Payments-x402-FF69B4?style=flat-square&logoColor=white)
![OKX OnchainOS](https://img.shields.io/badge/OKX%20OnchainOS-000000?style=flat-square&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-yellow?style=flat-square)

</div>

---

## The Problem

X Layer is unlocking an agent economy, but agents that spend money are a new kind of risk. Give them unlimited access and you lose control. Rely on off-chain guardrails and you're trusting a database — one that can be changed, bypassed, or go down entirely.

ZenithPay is security middleware for AI agents that spend money. It sits between your agent and every service it pays, enforcing hard limits at the smart contract level — limits that no API call can override and no server outage can remove.

Think of it as a corporate card spend policy system, but for AI agents instead of employees: per-transaction limits, daily budgets, merchant allowlists, and a human approval queue for anything above your threshold. Built directly on X Layer and powered by OKX OnchainOS.

---

## The Solution

Five products. Three live. Two in roadmap. Built on OKX OnchainOS.

**Agent Wallet** — Every agent gets a real TEE-secured wallet on X Layer. Email login, zero gas, private keys protected by OKX Agentic Wallet infrastructure. Agents hold actual USDC balances — not simulated floats.

**Agent Pay** — Agents pay any x402-compatible HTTP service directly in USDC. Zero gas on X Layer via the OKX Payments API. If the agent holds OKB, ZenithPay auto-swaps to USDC before payment — no manual intervention, no failed transactions.

**Spend Policy** — Hard limits deployed onchain via smart contract. No API can override them — even if ZenithPay goes down, the rules hold. Per-transaction cap, daily budget, merchant allowlist. Plus an approval threshold: payments above it are paused for human review, giving builders a human-in-the-loop control without blocking routine spending. Every approved, blocked, and pending payment is logged with agent intent.

**Agent Card** _(Coming Soon)_ — Virtual cards for AI agents. Same policy engine, working anywhere cards are accepted.

**Agent Credit** _(Coming Soon)_ — Credit lines for AI agents backed by onchain spend history.

---

## How It Works

```
1. Create & fund your agent
   POST /wallet/genesis → OKX Agentic Wallet creates TEE-secured wallet
   → Real EVM address on X Layer, zero gas, private key never exposed

2. Set spend policy
   Builder defines: $0.25/tx · $3/day · allowlist: [service.xyz] · approval above $0.10
   → Policy deployed onchain via smart contract

3. Agent pays — one call, ZenithPay handles the rest
   Agent calls zenithpay_pay_service({ url, maxAmount, intent })
   → Policy check runs first — limits, budget, allowlist checked onchain
   → If agent holds OKB: auto-swaps exact amount via OKX DEX (500+ sources)
   → APPROVED: x402 payment settles zero gas — PaymentExecuted event onchain
   → PENDING:  Above approval threshold — queued for human review
   → BLOCKED:  PaymentBlocked event onchain, reason returned to agent
   Every outcome is permanent onchain proof — verifiable on OKLink

5. Human reviews (optional)
   Dashboard shows pending payments → approve or deny
   → Approved: executes immediately
   → Denied: cancelled and logged

6. Full audit trail
   Every payment logged: time · merchant · amount · intent · status · tx hash
   Visible in dashboard and queryable via API
```

---

## Architecture

```
┌──────────────────────────────────────────────────────────────────────────┐
│                            Any agent                                     │
│  Claude Code · Claude Desktop · Cursor · Codex · Gemini CLI · OpenClaw  │
│                                                                          │
│                  Agent wallet  (USDC / OKB on X Layer)                   │
└──────────────┬────────────────────────┬────────────────────┬─────────────┘
               │                        │                    │
         MCP server               Agent Skill            REST API
               │                        │                    │
               └────────────────────────┴────────────────────┘
                                         │
                              zenithpay_pay_service()
                                         │
┌────────────────────────────────────────▼────────────────────────────────┐
│                           ZenithPay API                                  │
│                                                                          │
│   Wallet  │  Payment  │  Limits  │  Approvals  │  Ledger                 │
│                                                                          │
│   ┌──────────────────────────────────────────────────────────────────┐  │
│   │  Enforcement gate — policy check always runs first               │  │
│   │  APPROVED → execute   PENDING → queue   BLOCKED → reject         │  │
│   └──────────────────────────────────────────────────────────────────┘  │
└──────────┬──────────────────────────────────────────────────────────────┘
           │                                              │
    OKB → USDC auto-swap                        x402 payment (zero gas)
    (if agent holds OKB)                         USDC transfer
           │                                              │
┌──────────▼──────────────┐              ┌───────────────▼──────────────────┐
│     OKX OnchainOS       │              │         x402 Service             │
│                         │              │                                  │
│  DEX Swap  · Gateway    │              │  Any x402-compatible endpoint    │
│  Agentic Wallet (TEE)   │              │  search · data · AI tools · APIs │
│  Market · Token APIs    │              │                                  │
└──────────┬──────────────┘              └───────────────┬──────────────────┘
           │                                              │
           └──────────────────────┬───────────────────────┘
                                  │
┌─────────────────────────────────▼───────────────────────────────────────┐
│                    X Layer mainnet  ·  chain ID 196                      │
│         SpendPolicy.sol  ·  PaymentExecuted / PaymentBlocked events      │
└─────────────────────────────────────────────────────────────────────────┘
```

### x402 Payment Flow

Four actors, six steps. ZenithPay handles everything between the agent's intent and the settled USDC transfer.

```
  AI Agent             ZenithPay API          x402 Service         OKX TEE Wallet
     │                      │                      │                      │
     │── POST /pay ────────>│                      │                      │
     │   { serviceUrl,      │                      │                      │
     │     maxAmount,       │                      │                      │
     │     intent }         │                      │                      │
     │                      │                      │                      │
     │                      │── 1. SpendPolicy ───>│                      │
     │                      │   check (on-chain)   │                      │
     │                      │<── ok ───────────────│                      │
     │                      │                      │                      │
     │                      │── 2. POST ──────────>│                      │
     │                      │   (probe request)    │                      │
     │                      │<── 402 + payment ────│                      │
     │                      │   requirements       │                      │
     │                      │                      │                      │
     │                      │── 3. onchainos ─────────────────────────────>│
     │                      │   x402-pay           │                      │
     │                      │   (sign EIP-3009)    │                      │
     │                      │<── { signature, ─────────────────────────────│
     │                      │     authorization }  │                      │
     │                      │                      │                      │
     │                      │── 4. POST ──────────>│                      │
     │                      │   X-Payment: base64( │                      │
     │                      │    { accepted,       │                      │
     │                      │      payload:        │                      │
     │                      │       { sig, auth }  │                      │
     │                      │    })                │                      │
     │                      │                      │── verify + settle ──>│
     │                      │                      │   (on-chain USDC     │
     │                      │                      │    transfer via      │
     │                      │                      │    EIP-3009)         │
     │                      │                      │<── txHash ───────────│
     │                      │<── 200 + data ───────│                      │
     │                      │   payment-response:  │                      │
     │                      │   { txHash, success }│                      │
     │                      │                      │                      │
     │                      │── 5. ledger write    │                      │
     │                      │                      │                      │
     │<── 200 ──────────────│                      │                      │
     │   { status: approved │                      │                      │
     │     txHash, amount } │                      │                      │
     │                      │                      │                      │
```

The agent calls `POST /pay` with a service URL and budget. ZenithPay enforces spend policy on-chain, probes the service for x402 requirements, signs a USDC `transferWithAuthorization` (EIP-3009) inside the OKX TEE, replays the request with the signed payment header, and returns the result with a settlement txHash. The agent never touches private keys.

---

## Spend Policy

Spend limits are enforced at the smart contract level on X Layer — no API override possible.

| Field               | Enforcement               | Behaviour                                                                                |
| ------------------- | ------------------------- | ---------------------------------------------------------------------------------------- |
| `perTxLimit`        | On-chain — smart contract | Blocks if payment exceeds per-transaction cap                                            |
| `dailyBudget`       | On-chain — smart contract | Blocks if agent has exceeded daily spend                                                 |
| `allowlist`         | On-chain — smart contract | Blocks if merchant not in approved list                                                  |
| `approvalThreshold` | Off-chain — ZenithPay API | Pauses for human review if exceeded. Blank = no approvals. `"0"` = all require approval. |

**Preset rules (dashboard):**

| Preset       | perTxLimit | dailyBudget | approvalThreshold |
| ------------ | ---------- | ----------- | ----------------- |
| Conservative | $5         | $25         | $1                |
| Balanced     | $25        | $100        | $10               |
| Open         | $100       | $500        | $50               |

---

## Built for Any Agent

ZenithPay is not tied to a single agent or framework. Any agent — Claude Code, Claude Desktop, Cursor, Codex, Gemini CLI, OpenClaw, or a custom bot — can integrate ZenithPay through MCP, Agent Skill, or REST API and immediately gain policy-enforced payments on X Layer.

```
Claude Code     → MCP server   → zenithpay_pay_service()
Claude Desktop  → MCP server   → zenithpay_pay_service()
Cursor          → MCP server   → zenithpay_pay_service()
Codex           → MCP server   → zenithpay_pay_service()
Gemini CLI      → Agent Skill  → zenithpay_pay_service()
OpenClaw        → Agent Skill  → zenithpay_pay_service()
Custom agent    → REST API     → POST /pay
Any agent       → one line     → policy-gated x402 payments on X Layer
```

Each agent gets its own isolated SpendPolicy.sol — independent limits, allowlists, and approval thresholds enforced onchain per agent. One human can own and monitor multiple agents from a single dashboard.

This is what makes ZenithPay ecosystem infrastructure: every developer building an agent on X Layer gets a production-ready payment and enforcement layer without rebuilding it from scratch.

---

## Agent Integration

Three ways to connect any agent to ZenithPay.

**Base URL:** `https://api.usezenithpay.xyz`

### 1. MCP Server

Works with Claude Code, Claude Desktop, Cursor, Codex, Gemini CLI, OpenClaw.

```json
{
	"mcpServers": {
		"zenithpay": {
			"url": "https://api.usezenithpay.xyz/mcp",
			"env": {
				"AGENT_ADDRESS": "0xcadf...1a9",
				"ZENITHPAY_API_KEY": "your_key_here"
			}
		}
	}
}
```

### 2. Agent Skill

One line. Agent reads the skill and gets all six tools instantly.

```bash
curl -s https://api.usezenithpay.xyz/skill.md
```

### 3. REST API

Direct HTTP integration. Any language, any framework.

```bash
curl -X POST https://api.usezenithpay.xyz/pay \
  -H "Authorization: Bearer $ZENITHPAY_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "agentAddress": "0xcadf...1a9",
    "serviceUrl": "https://service.xyz/api",
    "maxAmount": "0.25",
    "intent": "Research DeFi trends"
  }'
```

---

## API Reference

Authentication: `Authorization: Bearer $ZENITHPAY_API_KEY` on all endpoints except `/health`.

| Method | Route                    | Description                                                          |
| ------ | ------------------------ | -------------------------------------------------------------------- |
| `GET`  | `/health`                | Health check — no auth required                                      |
| `POST` | `/wallet/genesis`        | Create TEE-secured agent wallet                                      |
| `GET`  | `/wallet/balance`        | Agent USDC + OKB balance + remaining daily budget                    |
| `GET`  | `/wallet/agents`         | List all agents under authenticated account                          |
| `POST` | `/pay`                   | Execute policy-gated x402 payment                                    |
| `GET`  | `/limits`                | Get current spend policy for agent(s)                                |
| `POST` | `/limits`                | Deploy / update spend policy contract — requires human EOA signature |
| `GET`  | `/ledger`                | Full transaction audit trail                                         |
| `GET`  | `/approvals`             | Pending payments awaiting human review                               |
| `POST` | `/approvals/:id/approve` | Approve pending payment — executes immediately                       |
| `POST` | `/approvals/:id/deny`    | Deny pending payment — cancels and logs                              |

### POST /pay — response shapes

```jsonc
// Approved
{
  "status": "approved",
  "txHash": "0xabc...",
  "amount": "0.10",
  "currency": "USDC",
  "merchant": "service.xyz",
  "swapUsed": false,
  "okbSpent": null,
  "remainingDailyBudget": "1.65"
}

// Pending — above approvalThreshold
{
  "status": "pending",
  "approvalId": "apr_01abc",
  "amount": "0.50",
  "merchant": "service.xyz",
  "intent": "Research DeFi trends"
}

// Blocked
{
  "status": "blocked",
  "reason": "per_tx_limit_exceeded",
  // also: daily_budget_exceeded · merchant_not_allowlisted · insufficient_balance
  "onchainEvent": "PaymentBlocked"
}
```

Full endpoint documentation with all request schemas → [docs.usezenithpay.xyz](https://docs.usezenithpay.xyz)

---

## Agent Tools

Six tools available via MCP server and Agent Skill. Approvals are REST-only by design — agents cannot approve their own payments.

| Tool                        | Input                                                                           | What it does                                      |
| --------------------------- | ------------------------------------------------------------------------------- | ------------------------------------------------- |
| `zenithpay_balance`         | —                                                                               | USDC + OKB balance + remaining daily budget       |
| `zenithpay_pay_service`     | `serviceUrl`, `maxAmount`, `intent`                                             | Policy-gated x402 payment with auto-swap          |
| `zenithpay_get_limits`      | —                                                                               | Read current spend policy                         |
| `zenithpay_set_limits`      | `perTxLimit`, `dailyBudget`, `allowlist`, `approvalThreshold`, `humanSignature` | Deploy / update onchain spend policy              |
| `zenithpay_verify_merchant` | `merchantUrl`                                                                   | OKX security scan + allowlist check before paying |
| `zenithpay_ledger`          | `limit?`, `offset?`, `status?`                                                  | Onchain + internal spend audit trail              |

**Recommended pre-payment call order:**

```
zenithpay_get_limits()         → understand policy before spending
zenithpay_balance()            → confirm funds available
zenithpay_verify_merchant()    → safety check the merchant
zenithpay_pay_service()        → pay
```

---

## Quick Start

**Prerequisites:** [Bun](https://bun.sh) · [Foundry](https://getfoundry.sh) · [OKX API key](https://web3.okx.com/onchain-os/dev-portal) · [Supabase](https://supabase.com) project

### 1. Clone and install

```bash
git clone https://github.com/zenith-hq/zenithpay-xlayer.git
cd zenithpay-xlayer
bun install
```

### 2. Set environment variables

```bash
cp api/.env.example api/.env
cp web/.env.example web/.env.local
```

`api/.env`:

```bash
XLAYER_RPC_URL=https://rpc.xlayer.tech
OKX_API_KEY=...                   # get at web3.okx.com/onchain-os/dev-portal
OKX_SECRET_KEY=...
OKX_PASSPHRASE=...
DATABASE_URL=postgresql://...
SUPABASE_URL=...
SUPABASE_ANON_KEY=...
SPEND_POLICY_ADDRESS=0x...        # fill after step 4
ZENITHPAY_API_KEY_SECRET=...
```

`contracts/.env`:

```bash
DEPLOYER_PRIVATE_KEY=0x...        # EOA used to deploy SpendPolicy.sol
XLAYER_RPC_URL=https://rpc.xlayer.tech
```

`web/.env.local`:

```bash
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:3001
```

### 3. Deploy contracts to X Layer

```bash
cd contracts
forge build
forge test
forge script script/Deploy.s.sol --rpc-url $XLAYER_RPC_URL --broadcast --slow
```

Copy the deployed address → `SPEND_POLICY_ADDRESS` in `api/.env`, then run migrations:

```bash
cd api && bun run db:migrate
```

### 4. Run locally

```bash
cd web && bun dev   # :3000
cd api && bun dev   # :3001
```

### 5. Deploy to production

| Service | Host                           | Config                                                      |
| ------- | ------------------------------ | ----------------------------------------------------------- |
| `api/`  | [Railway](https://railway.app) | Root dir: `api/` · add env vars · CNAME `api` → Railway URL |
| `web/`  | [Vercel](https://vercel.com)   | Root dir: `web/` · add env vars · auto-deploys on push      |
| `docs/` | [Vercel](https://vercel.com)   | Root dir: `docs/` · auto-deploys on push                    |

---

## Tech Stack

| Layer           | Technology                                                                       |
| --------------- | -------------------------------------------------------------------------------- |
| Frontend        | Next.js 16, Tailwind v4, shadcn/ui, Motion                                       |
| Backend API     | Bun, Hono                                                                        |
| Database        | PostgreSQL, Supabase, Drizzle ORM                                                |
| Wallet Connect  | wagmi, OKX Wallet (EIP-6963)                                                     |
| Smart Contracts | Solidity, Foundry, OpenZeppelin                                                  |
| Blockchain      | X Layer mainnet (chain ID 196)                                                   |
| Payment         | x402 — OKX Payments API (zero gas on X Layer)                                    |
| Agent Wallet    | OKX Agentic Wallet (TEE)                                                         |
| Agent Protocol  | MCP (Model Context Protocol)                                                     |
| OKX OnchainOS   | Wallet API · Portfolio API · DEX Swap · Onchain Gateway · Market API · Token API |
| Web Deploy      | Vercel                                                                           |
| API Deploy      | Railway                                                                          |

---

## OKX OnchainOS Usage

| Capability                | OnchainOS API                                    |
| ------------------------- | ------------------------------------------------ |
| Agent wallet creation     | OKX Agentic Wallet — TEE, email OTP, gas-free    |
| Balance queries           | Wallet Check Balance API                         |
| x402 payments             | Payments API — `/api/v6/x402/verify` + `/settle` |
| Auto-swap OKB → USDC      | DEX Swap API — 500+ liquidity sources            |
| Tx simulation + broadcast | Wallet Transaction API                           |
| Market + price data       | Market API                                       |
| Token safety checks       | Token API                                        |
| Merchant security scan    | Agentic Wallet — `security_dapp_scan`            |

---

## Deployed Contracts

| Contract     | Source                                                           | Network                        | Address                                                                                                                                          | TX                                                                                                                                                                               |
| ------------ | ---------------------------------------------------------------- | ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Spend Policy | [`contracts/src/SpendPolicy.sol`](contracts/src/SpendPolicy.sol) | X Layer mainnet (chain ID 196) | [`0xF5875F25ccEB2edDc57F218eaF1F71c5CF161f21`](https://www.oklink.com/xlayer/address/0xF5875F25ccEB2edDc57F218eaF1F71c5CF161f21) | [`0xf0be30b...22ae9`](https://www.oklink.com/xlayer/tx/0xf0be30b27021c475fcdfcb8657f8d392617ebc25454a329af9240df3ded22ae9) |

## Live Transaction Proof

| Description | Chain | TX Hash |
| --- | --- | --- |
| x402 payment to stableenrich.dev (Exa search) | X Layer | [`0x6cecdfbd...`](https://www.oklink.com/xlayer/tx/0x6cecdfbd813da3c9792f78ff4bc49e60af976a424b53da7b2f1c78e6192389eb) |
| x402 payment to stableenrich.dev | X Layer | [`0x141eab48...`](https://www.oklink.com/xlayer/tx/0x141eab489df25fe3b37c9f2cb851417fcbc6f665fdba52e5827b6a6f4c6e0b15) |
| Real x402 service payment (Exa neural search) | Base | [`0xa8b200a1...`](https://basescan.org/tx/0xa8b200a12812a847d8d3affa1f992ab77ba304e4d5d0f9bbe6031d41f603527f) |
| SpendPolicy agent registration | X Layer | [`0xf04cc8c1...`](https://www.oklink.com/xlayer/tx/0xf04cc8c1d7d1facf257170a98ad6935b7d0fe825d5bdfbfad443223c5dc99920) |

**Agent Wallet:** [`0x726Cf0C4Fe559DB9A32396161694C7b88C60C947`](https://www.oklink.com/xlayer/address/0x726Cf0C4Fe559DB9A32396161694C7b88C60C947) (OKX Agentic Wallet, TEE-signed)

---

## Project Structure

```
zenithpay-xlayer/
│
├── api/                                   # Bun + Hono — REST API · MCP server · Agent Skill
│   └── src/
│       ├── app.ts                         # Entry — /health · /mcp · /skill.md mounted inline
│       │
│       ├── providers/onchainos/           # ★ OKX OnchainOS — all external API calls live here
│       │   ├── agentic-wallet.ts          # ★ OKX Agentic Wallet — wallet_login · wallet_create (TEE)
│       │   ├── balance.ts                 # ★ OKX Wallet Check Balance API — portfolio_token_balances
│       │   ├── swap.ts                    # ★ OKX DEX Swap API — OKB→USDC auto-swap (500+ sources)
│       │   ├── payments.ts                # ★ OKX Payments API — x402 verify + settle (zero gas)
│       │   ├── gateway.ts                 # ★ OKX Onchain Gateway — simulate · broadcast · orders
│       │   ├── market.ts                  # ★ OKX Market API — token prices · portfolio overview
│       │   └── token.ts                   # ★ OKX Token API — token safety · security_dapp_scan
│       │
│       ├── modules/
│       │   ├── payment/payment.service.ts # Core spend flow — policy gate → auto-swap → x402 settle
│       │   ├── wallet/wallet.service.ts   # Agent wallet creation via OKX Agentic Wallet TEE
│       │   ├── limits/limits.service.ts   # SpendPolicy.sol read/write via viem on X Layer
│       │   ├── approvals/                 # Human review queue — approve · deny pending payments
│       │   ├── balance/                   # Agent balance reads
│       │   └── ledger/                    # Audit trail — every payment logged with intent
│       │
│       ├── mcp/
│       │   ├── server.ts                  # ★ MCP server — StreamableHTTPTransport at /mcp
│       │   └── tools/                     # 6 tools: balance · pay · get/set limits · verify · ledger
│       │
│       └── routes/                        # REST endpoints — wallet · pay · limits · ledger · approvals
│
├── contracts/
│   └── src/SpendPolicy.sol                # ★ X Layer — onchain enforcement · PaymentExecuted/Blocked events
│
├── skills/
│   └── spend-agent/SKILL.md               # ★ Agent Skill — curl https://api.usezenithpay.xyz/skill.md
│
├── web/                                   # Next.js 16 — marketing + dashboard
│   └── app/
│       ├── (marketing)/                   # Landing page
│       └── (dashboard)/                   # Wallet · Pay · Limits · Approvals · Ledger
│
└── docs/                                  # Fumadocs — docs.usezenithpay.xyz
```

---

## Roadmap

- [ ] Smart accounts + session keys (ERC-4337) — scoped, expiring agent permissions
- [ ] skills.sh — `npx skills add zenithpay/spend-agent`
- [ ] Agent Card — virtual cards backed by SpendPolicy engine
- [ ] Agent Credit — credit lines backed by onchain spend history

---

## Acknowledgements

- [OKX OnchainOS](https://web3.okx.com/onchain-os) — agentic infrastructure that makes this possible
- [x402 Protocol](https://www.x402.org) — machine-native micropayments
- [X Layer](https://www.okx.com/xlayer) — the blockchain powering ZenithPay

---

## Contributing

PRs welcome. Open an issue first for significant changes.

---

## License

MIT
