<div align="center">

<img src="web/public/banner.png" alt="ZenithPay" width="100" />

# ZenithPay

> Your Agent spends. You Own the Rules.

**The spend control layer for AI agents on X Layer — enabling safe, controlled agent payments through built-in, trustless spend enforcement, policy control, and x402-native routing.**

<a href="">Docs</a> &nbsp;·&nbsp;
<a href="">Live Demo</a> &nbsp;·&nbsp;
<a href="">Video Demo</a> &nbsp;·&nbsp;
<a href="">Skill.md</a> &nbsp;·&nbsp;

![Network](https://img.shields.io/badge/Network-X%20Layer-0052FF?style=flat-square&logoColor=white)
![Payments](https://img.shields.io/badge/Payments-x402-FF69B4?style=flat-square&logoColor=white)
![OKX OnchainOS](https://img.shields.io/badge/OKX%20OnchainOS-000000?style=flat-square&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-yellow?style=flat-square)

</div>

---

## The Problem

X Layer is unlocking an agent economy, but agents still need a safe way to hold funds and pay for services without risking runaway spend.

ZenithPay is the missing payment infrastructure layer: built directly on X Layer and powered by OKX OnchainOS, it gives agents a real wallet, spending controls and limits, and an onchain audit trail. By enabling x402-native routing and onchain-enforced policies, builders can ship agents that spend safely onchain within clear budgets, without rebuilding the rails every time.

---

## The Solution

Five products. Three live. Two in roadmap. Built on OKX OnchainOS.

**Agent Wallet** — Every agent gets a real TEE-secured wallet on X Layer. Email login, zero gas, and private keys protected by OKX Agentic Wallet infrastructure. Agents hold actual USDC balances.

**Agent Pay** — Agents pay any x402-compatible HTTP service directly in USDC. Zero gas on X Layer via the OKX Payments API. If the agent holds OKB, ZenithPay auto-swaps to USDC before the payment goes out — no manual intervention.

**Agent Policy** — Builders define per-transaction limits, daily budgets, and merchant allowlists. Rules are enforced onchain before any payment executes. Every approved and blocked payment is logged with its reason, amount, and agent intent.

**Agent Card** _(Coming Soon)_ — Virtual cards for AI agents. Same policy engine, working anywhere credit cards are accepted.

**Agent Credit** _(Coming Soon)_ — Credit lines for AI agents backed by onchain spend history.

---

## How It Works

```
1. Register & fund your agent
   Agent logs in via email → OKX Agentic Wallet creates TEE-secured wallet
   → Real EVM address on X Layer, zero gas, private key never exposed

2. Set spend policy
   Builder defines: $0.25/tx · $3/day · allowlist: [exa.ai, firecrawl.dev]
   → Policy deployed onchain via SpendPolicy.sol

3. Auto-swap when needed
   Agent holds OKB but service requires USDC?
   → ZenithPay swaps via OKX DEX (500+ sources) before payment executes

4. Agent pays safely
   Agent calls zenithpay_pay_service({ url, maxAmount, intent })
   → SpendPolicy.sol checks limits onchain
   → ALLOWED: OKX Payments API settles x402 payment, zero gas, txHash returned
   → BLOCKED: PaymentBlocked event onchain, error returned to agent

5. Full audit trail
   Every payment logged: time · merchant · amount · intent · status · tx hash
   Visible in dashboard and queryable via API
```

## Architecture

---

## Tech Stack

| Layer              | Technology                                                                      |
| ------------------ | ------------------------------------------------------------------------------- |
| Frontend           | Next.js 16, Tailwind v4, shadcn/ui, Motion                                      |
| Backend API        | Bun, Hono                                                                       |
| Database           | PostgreSQL, Supabase, Drizzle                                                   |
| Wallet Connect     | wagmi, OKX Wallet (EIP-6963)                                                    |
| Smart Contracts    | Solidity, Foundry, OpenZeppelin                                                 |
| Blockchain         | X Layer mainnet (chain ID 196)                                                  |
| Payment            | x402 protocol — OKX OnchainOS facilitator                                       |
| Agent Wallet       | OKX Agentic Wallet                                                              |
| OKX OnchainOS APIs | Wallet API, Portfolio API, DEX Swap API, Onchain Gateway, Market API, Token API |

---

# Quick Start

All run with `bun`. Each workspace has its own `bun.lock`.

```bash
# Web (Next.js) — cd web/
bun dev              # dev server :3000
bun build            # production build
bun lint             # biome check
bun format           # biome format --write
bun check            # biome check --write

# Contracts (Foundry) — cd contracts/
forge build
forge test
forge test --match-test <TestName>
forge script script/Deploy.s.sol --rpc-url $XLAYER_RPC_URL --broadcast --slow

# API (Bun + Hono) — cd api/
bun dev              # dev server :3001
bun test             # run tests
```

### Required env vars

```bash
# api/
AGENT_PRIVATE_KEY=0x...
XLAYER_RPC_URL=https://rpc.xlayer.tech
OKX_API_KEY=...
OKX_SECRET_KEY=...
OKX_PASSPHRASE=...
SPEND_POLICY_ADDRESS=0x...
SUPABASE_URL=...
SUPABASE_SERVICE_KEY=...

# web/
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:3001
```

---

## Integration / Agent Tools

Three ways to connect any agent to ZenithPay.

**MCP Server** — Register ZenithPay as an MCP server. Works with Claude Code, Claude Desktop, Cursor, Codex, Gemini CLI, OpenClaw.

```json
{
	"mcpServers": {
		"zenithpay": {
			"url": "https://api.usezenithpay.xyz/mcp",
			"env": {
				"AGENT_ADDRESS": "0xcadf...1a9"
			}
		}
	}
}
```

**Agent Skill** — One line. Agent reads the skill file and gets three tools instantly.

```
Set up curl -s https://api.usezenithpay.xyz/skill.md
```

**Rest API** — Direct REST integration. Any language, any framework.

```bash
curl -X POST https://api.usezenithpay.xyz/pay \
  -H "Authorization: Bearer $ZENITHPAY_API_KEY" \
  -d '{ "serviceUrl": "https://exa.ai/search", "maxAmount": "0.25", "intent": "Research DeFi trends" }'
```

ZenithPay gives agents controlled access to money — check balance, spend under policies, set limits, and verify every transaction.

**Four tools exposed to your agent:**

| Tool                    | What it does                                |
| ----------------------- | ------------------------------------------- |
| `zenithpay_balance`     | Wallet balance + remaining budget           |
| `zenithpay_pay_service` | Policy-gated x402 payment                   |
| `zenithpay_set_limits`  | Set per-tx cap + daily budget               |
| `zenithpay_ledger`      | Onchain spend audit trail & transaction log |

---

## API Reference

---

## Deployed Contracts

---

## Onchain OS APIs Usage

| Layer           | Provider                                             |
| --------------- | ---------------------------------------------------- |
| Agent wallet    | OKX Agentic Wallet (TEE, email OTP, gas-free)        |
| Balance queries | OKX Wallet Check Balance API                         |
| x402 payments   | OKX Payments API (`/api/v6/x402/verify` + `/settle`) |
| Auto-swap       | OKX DEX Swap API (500+ liquidity sources)            |
| Tx broadcast    | OKX Wallet Transaction API                           |
| Market data     | OKX Market API                                       |
| Token safety    | OKX Token API                                        |

---

## File Structure

```
zenithpay-xlayer/
├── api/
│ └── src/
│ ├── providers/
│ │ ├── wallet.ts ←okx agentic wallet
│ │ ├── onchainos/
│ │ │ ├── balance.ts ← Wallet Check Balance API
│ │ │ ├── gateway.ts ← Wallet Transaction API (simulate + broadcast)
│ │ │ ├── history.ts ← Wallet Transaction History API
│ │ │ ├── swap.ts ← Trade Swap API (auto-swap OKB→USDC)
│ │ │ ├── payments.ts ← Payments API (x402, zero gas)
│ │ │ ├── market.ts ← Market API (prices, token data)
│ │ │ └── token.ts ← Market Token API (safety checks)
│ ├── service/
│ │ ├── policy/ ← SpendPolicy.sol interaction
│ │ ├── payment/ ← x402 routing + auto-swap
│ │ └── ledger/ ← audit trail
│ ├── utils/ ← helper functions, constants
│ ├── mcp/ ← MCP server logic
│ ├── types/ ← TypeScript types & interfaces
│ ├── db/ ← database connection / ORM setup
│ ├── config/
│ │ └── chains.ts ← X Layer config
│ ├── env.ts ← environment variables
│ ├── index.ts ← main entry point
│ └── routes/ ← REST endpoints + MCP server
├── contracts/
│ └── src/SpendPolicy.sol ← onchain enforcement
└── web/ ← Next.js dashboard
└── app/
├── page.tsx ← landing
├── signin/ ← OKX Wallet connect
└── dashboard/ ← balance · policy · ledger
```

---

## Roadmap

- [ ] AgentCard
- [ ] AgentCredit

---

## Hackathon Submission

**Agentic Payments**

## **Proof of Transaction Hash:**

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
