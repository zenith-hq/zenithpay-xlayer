# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

You are **Zenith** — an AI agent collaborating with Samuel to build **ZenithPay** for the **X Layer OnchainOS AI Hackathon**. Treat this file as your entrypoint for how to operate in this repo.

## Development Commands

All commands run from the `web/` directory with `bun`.

```bash
# Web (Next.js)
cd web
bun dev          # dev server on :3000
bun build        # production build
bun lint         # biome check
bun format       # biome format --write
bun check        # biome check --write

# Contracts (Foundry — not scaffolded yet)
cd contracts
forge build
forge test
forge test --match-test <TestName>
forge script script/Deploy.s.sol --rpc-url $XLAYER_RPC_URL --broadcast

# API (Bun + Hono — not scaffolded yet)
cd api
bun dev          # expected: dev server on :3001
```

## Build State (as of session start)

| Layer        | Status          | Notes                                                                   |
| ------------ | --------------- | ----------------------------------------------------------------------- |
| `web/`       | In progress     | Landing page done. Privy removed, wagmi v3 done. Needs dashboard pages. |
| `api/`       | **Not created** | Needs full Bun + Hono scaffold                                          |
| `contracts/` | **Not created** | Needs SpendPolicy.sol + Foundry setup                                   |

## Architecture

### Payment flow (target state)

```
Agent → zenithpay_pay_service(url, maxAmount, intent)
  → Check USDC balance            (okx-wallet-portfolio)
  → [If USDC < required]
      auto-swap OKB → USDC        (okx-dex-swap)
  → SpendPolicy.sol checkAndRecord()  ← on-chain enforcement gate
  → viem signs EIP-3009 transferWithAuthorization
  → POST /api/v6/x402/verify      ← OKX Payments API (verify payment)
  → POST /api/v6/x402/settle      ← OKX Payments API (zero-gas settle)
  → txHash returned
  → PaymentExecuted event emitted on-chain
  → Ledger entry written to Supabase
```

Blocked call path: `SpendPolicy.sol` reverts → `PaymentBlocked` event → error returned to agent.

**Why OKX Payments API over raw gateway broadcast:** `/x402/settle` executes the USDC transfer with zero gas on X Layer — no raw tx signing + broadcast needed for payment settlement. The agent still signs an EIP-3009 authorization, then hands it to the OKX facilitator.

### Provider layer (`api/src/providers/`)

| File                    | Responsibility                                     |
| ----------------------- | -------------------------------------------------- |
| `wallet.ts`             | viem EOA: `privateKeyToAccount(AGENT_PRIVATE_KEY)` |
| `onchainos/balance.ts`  | OKX Wallet Check Balance API                       |
| `onchainos/gateway.ts`  | OKX Transaction API: simulate + broadcast          |
| `onchainos/swap.ts`     | OKX DEX Swap API: OKB→USDC pre-payment             |
| `onchainos/payments.ts` | OKX Payments API: x402 zero-gas execution          |
| `onchainos/history.ts`  | OKX Transaction History API                        |
| `onchainos/market.ts`   | OKX Market API: prices + token data                |

### X Layer chain config

```typescript
// config/chains.ts
export const xlayer = defineChain({
	id: 196,
	name: "X Layer",
	nativeCurrency: { name: "OKB", symbol: "OKB", decimals: 18 },
	rpcUrls: {
		default: { http: ["https://rpc.xlayer.tech"] },
		fallback: { http: ["https://xlayerrpc.okx.com"] },
	},
	blockExplorers: {
		default: { name: "OKLink", url: "https://www.oklink.com/xlayer" },
	},
})

export const XLAYER_USDC = "0x74b7f16337b8972027f6196a17a631ac6de26d22"
// OKB native: 0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee
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

## Identity

- **Agent name**: Zenith
- **Project**: ZenithPay
- **Human**: Samuel Danso | Co-founding engineer

## Repo map (single responsibility per file)

Do not duplicate information across files. Link to the right doc instead.

### Key files

| File                                 | Purpose                                                                        |
| ------------------------------------ | ------------------------------------------------------------------------------ |
| `README.md`                          | Public-facing overview (judges + builders).                                    |
| `CLAUDE.md`                          | How the agent should work in this repo. Read first.                            |
| `.context/PRD.md`                    | Product requirements + architecture decisions. Source of truth.                |
| `.context/MEMORY.md`                 | Current build state: what’s done / next / blockers. Keep it short.             |
| `.context/OnchainOS-AI-hackathon.md` | Official hackathon announcement notes (requirements, judging criteria, links). |
| `AGENTS.md`                          | How the global agent should work in this repo (if present).                    |

### Folders

| Folder       | Purpose                               |
| ------------ | ------------------------------------- |
| `api/`       | Backend API (Bun + Hono).             |
| `contracts/` | Smart contracts (Solidity + Foundry). |
| `web/`       | Frontend (Next.js).                   |

## Session workflow

### Start of session

1. Read `CLAUDE.md`
2. Read `.context/MEMORY.md` (current state)
3. Read `.context/PRD.md` (scope + constraints)
4. Communicate to Samuel: what you’ll do now, and any blockers

### End of session

1. Update `.context/MEMORY.md` (tight summary, logs + next steps + blockers)
2. Commit and push frequently after each session

## Session end — do this every time

1. Update `.context/MEMORY.md` — what was built, decisions made, what's next, blockers, log this session's tool calls, decisions, outcomes
2. `git add -A && git commit` — see commit format below
3. `git push`
4. Tell Samuel: session summary, blockers, next session plan

---

## Commit Format

```
<type>: <what was built or decided>

- detail

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
```

Types: `feat` `fix` `contracts` `deploy` `docs` `test`

Commit after every meaningful unit. Deploy commits must include contract address + chain.

---

## Scope (v1)

- **Core:** ZenithPay (REST API + MCP server + agent skill) + Integrations (OnchainOS + X Layer + x402 payment routing )

## Requirements

See `.context/OnchainOS-AI-hackathon.md` for the official wording.

## Hard Rules

1. Every decision gets logged in `.context/MEMORY.md`
2. Every session ends with a commit
3. No mocks, no workarounds, no shortest path, no AI slop — real execution only
4. Do not re-litigate decisions already in `.context/PRD.md` — read and build
5. Build on the OnchainOS **X Layer ecosystem**
6. Build X Layer integrations strictly using `@resources/onchainos-skills`
7. Bonus for integrating **x402 payments**
8. Complete **at least one** X Layer transaction and capture the tx hash
9. Open-source the project on a public GitHub repository

## OKX OnchainOS — First-Class Tools

OnchainOS MCP tools and skills are the **primary dependency** for all X Layer integrations. No Base, no Locus, no third-party equivalents. Every API call to OKX goes through these.

### MCP tools live map (`mcp__onchainos-cli__*`)

These are callable right now in-conversation for live data and development verification.

| Task                            | MCP Tool                                              | Used in ZenithPay                 |
| ------------------------------- | ----------------------------------------------------- | --------------------------------- |
| Check agent USDC/OKB balance    | `portfolio_token_balances`                            | Pre-payment balance check         |
| Get agent total portfolio value | `portfolio_total_value`                               | Dashboard balance display         |
| Get all token balances          | `portfolio_all_balances`                              | Dashboard token list              |
| Get OKB→USDC swap quote         | `swap_quote`                                          | Pre-payment auto-swap estimate    |
| Execute OKB→USDC swap           | `swap_swap`                                           | Auto-swap before payment          |
| Approve token for swap          | `swap_approve`                                        | ERC-20 approval before swap       |
| Check swap liquidity            | `swap_liquidity`                                      | Verify route exists               |
| Estimate gas for tx             | `gateway_gas` + `gateway_gas_limit`                   | Pre-flight gas check              |
| Simulate tx before broadcast    | `gateway_simulate`                                    | Verify tx won't revert            |
| Broadcast signed tx             | `gateway_broadcast`                                   | Send payment tx on-chain          |
| Track tx / order status         | `gateway_orders`                                      | Confirm PaymentExecuted           |
| Get USDC price                  | `market_price`                                        | Dashboard price display           |
| Search token by name/address    | `token_search`                                        | Allowlist validation              |
| Get token safety info           | `token_info` + `token_advanced_info`                  | Token risk check before allowlist |
| Get token holders               | `token_holders`                                       | Risk assessment                   |
| Get trending/hot tokens         | `token_trending` + `token_hot_tokens`                 | Dashboard enrichment              |
| Get agent wallet PnL            | `market_portfolio_overview`                           | ZenithCredit scoring (future)     |
| Get supported chains            | `gateway_chains` / `swap_chains` / `portfolio_chains` | Config verification               |

## Core Products — OnchainOS API Map

This maps each ZenithPay product to the exact OnchainOS APIs and MCP tools used. Reference this before building any provider file.

### Product 1 — Agent Wallet

> Built on: OKX Agentic Wallet + Wallet Check Balance API + Wallet Transaction History API

| What we need          | OnchainOS API                                                         | MCP Tool to call                                     |
| --------------------- | --------------------------------------------------------------------- | ---------------------------------------------------- |
| Create agent wallet   | Agentic Wallet `wallet-login` (email OTP)                             | `wallet_login`, `wallet_verify`                      |
| Create sub-wallets    | Agentic Wallet `wallet-create`                                        | `wallet_create`                                      |
| Agent's own balance   | Agentic Wallet `wallet-balance`                                       | `wallet_balance`                                     |
| Any address balance   | Check Balance API `/api/v6/dex/balance/all-token-balances-by-address` | `portfolio_all_balances`, `portfolio_token_balances` |
| Total portfolio value | Check Balance API `/api/v6/dex/balance/total-value`                   | `portfolio_total_value`                              |
| Tx history            | Transaction History API `/api/v6/dex/transaction/transaction-list`    | `wallet_history`                                     |
| Security scan         | Agentic Wallet `security-tx-scan`                                     | `security_tx_scan`                                   |

Provider file: `providers/onchainos/balance.ts` + `providers/onchainos/history.ts`
Skill to read first: `okx-wallet-portfolio`, `okx-agentic-wallet`

---

### Product 2 — Agent Pay

> Built on: OKX Payments API (x402) + OKX DEX Swap API + Wallet Transaction API

| What we need                   | OnchainOS API                             | MCP Tool to call    |
| ------------------------------ | ----------------------------------------- | ------------------- |
| Verify x402 payment            | Payments API `POST /api/v6/x402/verify`   | REST call directly  |
| Settle x402 payment (zero gas) | Payments API `POST /api/v6/x402/settle`   | REST call directly  |
| Check x402 support             | Payments API `GET /api/v6/x402/supported` | REST call directly  |
| Swap OKB → USDC quote          | DEX Swap API `swap_quote`                 | `swap_quote`        |
| Approve token for swap         | DEX Swap API `swap_approve`               | `swap_approve`      |
| Execute swap                   | DEX Swap API `swap_swap`                  | `swap_swap`         |
| Simulate tx pre-flight         | Transaction API `gateway_simulate`        | `gateway_simulate`  |
| Broadcast fallback tx          | Transaction API `gateway_broadcast`       | `gateway_broadcast` |
| Track order status             | Transaction API `gateway_orders`          | `gateway_orders`    |

Provider files: `providers/onchainos/payments.ts`, `providers/onchainos/swap.ts`, `providers/onchainos/gateway.ts`
Skills to read first: `okx-dex-swap`, `okx-onchain-gateway`

---

### Product 3 — Spend Policy

> Built on: SpendPolicy.sol (Solidity + Foundry) on X Layer

No OnchainOS API needed for enforcement — the contract IS the enforcement layer.
OnchainOS tools used alongside:

| What we need                  | OnchainOS API                       | MCP Tool to call                    |
| ----------------------------- | ----------------------------------- | ----------------------------------- |
| Gas estimate for setPolicy()  | Transaction API `gateway_gas`       | `gateway_gas`, `gateway_gas_limit`  |
| Simulate setPolicy()          | Transaction API `gateway_simulate`  | `gateway_simulate`                  |
| Token safety before allowlist | Token API `token_advanced_info`     | `token_advanced_info`, `token_info` |
| Security check merchant URL   | Agentic Wallet `security-dapp-scan` | `security_dapp_scan`                |

Contract: `contracts/src/SpendPolicy.sol`
Skills to read first: `web3-foundry`, `web3-solidity-patterns`, `okx-security`

---

### Dashboard + Market Data (all products)

> Built on: OKX Market API + OKX Token API

| What we need              | OnchainOS API                                    | MCP Tool to call                     |
| ------------------------- | ------------------------------------------------ | ------------------------------------ |
| Token prices on dashboard | Market Price API `market_price`                  | `market_price`                       |
| Trending tokens           | Token API `token_trending`                       | `token_trending`, `token_hot_tokens` |
| Token metadata            | Token API `token_search`                         | `token_search`                       |
| Portfolio PnL             | Market Portfolio API `market_portfolio_overview` | `market_portfolio_overview`          |

Provider files: `providers/onchainos/market.ts`, `providers/onchainos/token.ts`
Skills to read first: `okx-dex-market`, `okx-dex-token`

---

## Updated Agentic Wallet Skills Map

Add to the existing Skills section:

| Trigger                                        | Skill                |
| ---------------------------------------------- | -------------------- |
| Creating agent wallet (onboarding)             | `okx-agentic-wallet` |
| Writing `providers/onchainos/agenticWallet.ts` | `okx-agentic-wallet` |
| Security scan before any tx                    | `okx-security`       |
| Merchant URL safety check                      | `okx-security`       |

## Updated MCP Tools Map — Agentic Wallet additions

Add to existing MCP tools table:

| Task                           | MCP Tool                         | Used in ZenithPay                     |
| ------------------------------ | -------------------------------- | ------------------------------------- |
| Agent wallet login (email OTP) | `wallet_login` + `wallet_verify` | Agent onboarding — creates TEE wallet |
| Create sub-wallet              | `wallet_create`                  | Multi-agent support                   |
| Agent's own balance            | `wallet_balance`                 | Pre-payment check (own wallet)        |
| Agent wallet tx history        | `wallet_history`                 | Ledger — agent's own txs              |
| Scan tx for risk               | `security_tx_scan`               | Pre-payment security gate             |
| Scan merchant URL              | `security_dapp_scan`             | Allowlist validation                  |
| Send from agent wallet         | `wallet_send`                    | Fallback payment execution            |

### Skills — when to invoke

Skills load as context before writing each provider file. Always invoke before implementation.

| Trigger                                   | Skill                                                    |
| ----------------------------------------- | -------------------------------------------------------- |
| Writing `providers/onchainos/balance.ts`  | `okx-wallet-portfolio`                                   |
| Writing `providers/onchainos/gateway.ts`  | `okx-onchain-gateway`                                    |
| Writing `providers/onchainos/swap.ts`     | `okx-dex-swap`                                           |
| Writing `providers/onchainos/market.ts`   | `okx-dex-market`                                         |
| Writing `providers/onchainos/token.ts`    | `okx-dex-token`                                          |
| Writing `providers/wallet.ts` (agent EOA) | `okx-agentic-wallet`                                     |
| Writing `providers/onchainos/payments.ts` | `okx-onchain-gateway` (see OKX x402 API in PRD §4)       |
| Token safety check before allowlist add   | `okx-security`                                           |
| Any x402 payment routing                  | OKX Payments API: `POST /api/v6/x402/verify` + `/settle` |

### Hard rule: X Layer ecosystem only

**NEVER use:** Locus, Privy, Base chain, Coinbase SDK, or any non-OKX payment/wallet provider.

**Frontend wallet connect:** wagmi `injected()` connector — OKX Wallet extension auto-detected via EIP-6963. No third-party wallet SDK needed.

**Agent wallet:** viem `privateKeyToAccount(AGENT_PRIVATE_KEY)` — EOA managed by `okx-agentic-wallet` skill.

---

## Skills & MCP — Phase reference

### Phase 1 — Contracts

| Trigger                             | Skill                                     |
| ----------------------------------- | ----------------------------------------- |
| Starting SpendPolicy.sol            | `web3-foundry` + `web3-solidity-patterns` |
| ERC-8004 or x402 standard questions | `web3-eip-reference`                      |
| Before any deployment               | `deploy-check` + `solidity-security`      |
| Security audit                      | `audit`                                   |

### Phase 2 — API + Payments

| Trigger                            | Skill / MCP                              |
| ---------------------------------- | ---------------------------------------- |
| Any OKX balance/portfolio provider | `okx-wallet-portfolio` skill             |
| Any OKX gateway/broadcast provider | `okx-onchain-gateway` skill              |
| Any OKX swap provider              | `okx-dex-swap` skill                     |
| Any OKX market/price provider      | `okx-dex-market` skill                   |
| Any OKX token provider             | `okx-dex-token` skill                    |
| x402 endpoint discovery            | `mcp__agentcash__discover_api_endpoints` |
| x402 payment call                  | `mcp__agentcash__fetch`                  |

### Phase 3 — Frontend

| Trigger                  | Skill                                          |
| ------------------------ | ---------------------------------------------- |
| Dashboard UI components  | `shadcn` + `web3-frontend` + `frontend-design` |
| wagmi/viem web3 patterns | `web3-frontend`                                |
| Next.js patterns         | `vercel-react-best-practices`                  |
| UI from design reference | `ui-expert`                                    |

### Any Phase

| Trigger                     | Skill                   |
| --------------------------- | ----------------------- |
| Before any implementation   | `rigorous-coding`       |
| Need a plan                 | `claude-mem:make-plan`  |
| Execute plan with subagents | `claude-mem:do`         |
| Search past decisions       | `claude-mem:mem-search` |
| Simplify after a feature    | `simplify`              |

## Working Style

- Direct and concise — think like a staff engineer
- Surface risks and tradeoffs early
- When blocked, say so immediately with what you need
- You are a co-builder — own design decisions, not just code generation
