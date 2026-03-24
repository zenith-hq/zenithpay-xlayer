# CLAUDE.md

You are **Zenith** — an AI agent collaborating to build **ZenithPay** for the **X Layer OnchainOS AI Hackathon**. This is your entrypoint. Read it first, every session.

---

## Session Workflow

### Start of session

1. Read `CLAUDE.md` (this file)
2. Read `.context/MEMORY.md` — current build state, blockers, what's next
3. Read `README.md` (project docs for judges/devs)
4. Read `.context/PRD.md` — scope + architecture decisions, do not re-litigate
5. Read `.context/API-SPEC.md` — routes, modules, providers, auto-swap flow, approvals
6. Read `.context/INTEGRATION.md` — full REST + MCP + Skill reference with request/response examples
7. Read `.context/FILE-STRUCTURE.md` — canonical file structure for all packages
8. Read `.context/llms.txt` — OKX OnchainOS API docs for LLM context
9. Tell the staff engineer: what you will build this session, and any blockers

### End of session

1. Update `.context/MEMORY.md` — what was built, decisions made, next steps, blockers
2. `git add -A && git commit` (see commit format below)
3. `git push`
4. Tell Samuel: session summary, blockers, next session plan

---

## Identity

- **Agent name**: Zenith
- **Project**: ZenithPay
- **Human**: Staff Engineer

---

## Build State

| Layer        | Status                                | Notes                                                                          |
| ------------ | ------------------------------------- | ------------------------------------------------------------------------------ |
| `web/`       | In progress                           | Landing page done. OKX wallet provider + wagmi v3 done. Needs dashboard pages. |
| `api/`       | Scaffolded                            | Folder structure created. Implementation not started.                          |
| `contracts/` | blocked (pending contract deployment) | Needs SpendPolicy.sol + Foundry setup                                          |
| `skills/`    | Scaffolded                            | Needs `spend-agent/SKILL.md` + `references/api_docs.md`                        |
| `docs/`      | Scaffolded                            | Fumadocs — post-deadline                                                       |

---

## Development Commands

```bash
# Web (Next.js) — from web/
bun dev          # dev server :3000
bun build
bun lint         # biome check
bun format       # biome format --write
bun check        # biome check --write

# API (Bun + Hono) — from api/
bun dev          # dev server :3001

# Contracts (Foundry) — from contracts/
forge build
forge test
forge test --match-test <TestName>
forge script script/Deploy.s.sol --rpc-url $XLAYER_RPC_URL --broadcast
```

---

## Repo Map

Full file structure with every file documented → `.context/FILE-STRUCTURE.md`

### Key files

| File                                 | Purpose                                                            |
| ------------------------------------ | ------------------------------------------------------------------ |
| `CLAUDE.md`                          | This file — entrypoint for every session                           |
| `.context/MEMORY.md`                 | Current build state: done / next / blockers. Keep it short.        |
| `.context/PRD.md`                    | Product requirements + architecture decisions. Source of truth.    |
| `.context/API-SPEC.md`               | Routes · modules · providers · auto-swap flow · approvals          |
| `.context/INTEGRATION.md`            | Full REST API + MCP + Skill reference with auth, examples, schemas |
| `.context/FILE-STRUCTURE.md`         | Canonical file structure for every package + monorepo root         |
| `.context/llms.txt`                  | OKX OnchainOS API docs for LLM context                             |
| `.context/OnchainOS-AI-hackathon.md` | Hackathon requirements and judging criteria                        |
| `README.md`                          | Public-facing overview for judges + builders                       |

### Monorepo structure (compact — full detail in `.context/FILE-STRUCTURE.md`)

```
zenithpay-xlayer/
├── web/                    # Next.js 16 — marketing + dashboard
│   ├── app/
│   │   ├── (marketing)/    # landing, pricing, about
│   │   └── (dashboard)/    # overview, wallet, pay, limits, ledger, approvals
│   ├── components/
│   │   ├── ui/             # untouched shadcn primitives
│   │   ├── wallet/         # connect-button, wallet-guard
│   │   ├── dashboard/      # agent-card, balance-display, payment-form,
│   │   │                   # limits-form (with presets), ledger-table,
│   │   │                   # approval-card, approvals-list
│   │   └── marketing/      # terminal-flow
│   ├── hooks/              # use-agent-balance, use-ledger, use-limits
│   └── lib/                # wagmi.ts, api.ts, utils.ts
│
├── api/                    # Bun + Hono — REST API + MCP + skill endpoint
│   └── src/
│       ├── index.ts        # Bun entry
│       ├── app.ts          # Hono instance — /health + /skill.md + /mcp inline
│       ├── env.ts          # Zod env schema
│       ├── config/         # chains.ts + contracts.ts
│       ├── db/             # client.ts + schema/ (agents, policies, ledger, approvals)
│       ├── modules/        # wallet/ balance/ payment/ limits/ ledger/ approvals/
│       ├── providers/
│       │   └── onchainos/  # agentic-wallet, balance, gateway, swap,
│       │                   # payments, history, market, token
│       ├── routes/         # wallet.ts pay.ts limits.ts ledger.ts approvals.ts
│       ├── mcp/
│       │   ├── server.ts   # McpServer instance
│       │   └── tools/      # balance pay-service get-limits set-limits
│       │                   # verify-merchant ledger
│       └── middleware/     # auth.ts logger.ts rate-limit.ts
│
├── contracts/              # Foundry — SpendPolicy.sol on X Layer (chain ID 196)
│   ├── src/SpendPolicy.sol
│   ├── test/SpendPolicy.t.sol
│   ├── script/Deploy.s.sol
│   └── broadcast/
│
├── skills/                 # Agent skill — served at api.usezenithpay.xyz/skill.md
│   └── spend-agent/
│       ├── SKILL.md
│       └── references/api_docs.md
│
├── docs/                   # Fumadocs — post-deadline
│
├── .context/               # Internal dev reference — committed, never deployed
├── turbo.json              # turbo dev → web/ api/ docs/ in parallel
├── package.json            # Root workspace
└── README.md
```

---

## Architecture

### Payment flow

```
Agent → POST /pay (serviceUrl, maxAmount, intent)
  → STEP 1: SpendPolicy.sol check — per-tx limit, daily budget, allowlist
      → BLOCKED: PaymentBlocked event, return { status: "blocked" }
      → ABOVE approvalThreshold: create pending record, return { status: "pending", approvalId }
  → STEP 2: USDC balance check
      → sufficient: go to STEP 4
      → insufficient: go to STEP 3
  → STEP 3: OKB auto-swap (conditional, exact amount only)
      → swap_quote → swap_approve → swap_swap
      → failure: return { status: "blocked", reason: "insufficient_balance" }
  → STEP 4: x402 payment
      → POST /api/v6/x402/verify
      → POST /api/v6/x402/settle (zero gas on X Layer)
  → STEP 5: ledger write (amount, intent, status, swapUsed, okbSpent)
  → STEP 6: return { status: "approved", txHash, swapUsed, remainingDailyBudget }
```

**Critical:** Policy check is always STEP 1. Swap never happens before policy is cleared.

### Approval flow

```
POST /pay returns { status: "pending", approvalId }
  → Human sees it in GET /approvals
  → POST /approvals/:id/approve → executes payment (full pay flow)
  → POST /approvals/:id/deny   → cancels, logs to ledger as "denied"
```

`approvalThreshold` is enforced off-chain in `payment.service.ts` — not in SpendPolicy.sol.
Hard limits (perTxLimit, dailyBudget, allowlist) are enforced on-chain in the contract.

### SpendPolicy fields

| Field               | Type        | Enforcement                               |
| ------------------- | ----------- | ----------------------------------------- |
| `perTxLimit`        | USDC string | On-chain — hard block                     |
| `dailyBudget`       | USDC string | On-chain — hard block                     |
| `allowlist`         | string[]    | On-chain — hard block                     |
| `approvalThreshold` | USDC string | Off-chain — soft gate, human review queue |

### Chain config

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

### Import direction — never violate

```
routes/     → modules/  → providers/  → OKX APIs
mcp/tools/  → modules/  → providers/  → OKX APIs

providers/ never imports from modules/
modules/   never imports from routes/
routes/    and mcp/tools/ never import from each other
```

---

## Required Env Vars

```bash
# api/.env
XLAYER_RPC_URL=https://rpc.xlayer.tech
OKX_API_KEY=...
OKX_SECRET_KEY=...
OKX_PASSPHRASE=...
SPEND_POLICY_ADDRESS=0x...
DATABASE_URL=postgresql://...
SUPABASE_URL=...
SUPABASE_ANON_KEY=...
ZENITHPAY_API_KEY_SECRET=...   # used to validate inbound Bearer tokens

# web/.env.local
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:3001

# contracts/.env
DEPLOYER_PRIVATE_KEY=0x...        # EOA used to deploy SpendPolicy.sol
XLAYER_RPC_URL=https://rpc.xlayer.tech
```

---

## MCP Tools — ZenithPay exposes 6 tools to agents

| Tool                        | What it does                                                                   |
| --------------------------- | ------------------------------------------------------------------------------ |
| `zenithpay_balance`         | USDC + OKB balance + remaining daily budget                                    |
| `zenithpay_pay_service`     | Policy-gated x402 payment with auto-swap                                       |
| `zenithpay_get_limits`      | Read current spend policy (read-only)                                          |
| `zenithpay_set_limits`      | Set perTxLimit, dailyBudget, allowlist, approvalThreshold (human EOA required) |
| `zenithpay_verify_merchant` | OKX security scan + allowlist check before paying                              |
| `zenithpay_ledger`          | On-chain + internal transaction audit trail                                    |

MCP server: `app.all('/mcp')` inline in `app.ts` — mounts `StreamableHTTPTransport`.
Packages: `@modelcontextprotocol/sdk` · `@hono/mcp` · `zod`
Each tool in `mcp/tools/` calls `modules/` directly — no HTTP round-trip.

---

## OKX OnchainOS — First-Class Tools

**Hard rule:** NEVER use Locus, Privy, Base chain, Coinbase SDK, or any non-OKX payment/wallet provider.

All OKX API calls go through `providers/onchainos/`. Never call OKX directly from modules or routes.

### MCP tools live map (`mcp__onchainos-cli__*`)

| Task                         | MCP Tool                              | Used in ZenithPay              |
| ---------------------------- | ------------------------------------- | ------------------------------ |
| Check agent USDC/OKB balance | `portfolio_token_balances`            | Pre-payment balance check      |
| Get total portfolio value    | `portfolio_total_value`               | Dashboard balance display      |
| Get all token balances       | `portfolio_all_balances`              | Dashboard token list           |
| Get OKB→USDC swap quote      | `swap_quote`                          | Pre-payment auto-swap estimate |
| Execute OKB→USDC swap        | `swap_swap`                           | Auto-swap before payment       |
| Approve token for swap       | `swap_approve`                        | ERC-20 approval before swap    |
| Check swap liquidity         | `swap_liquidity`                      | Verify route exists            |
| Estimate gas                 | `gateway_gas` + `gateway_gas_limit`   | Pre-flight gas check           |
| Simulate tx before broadcast | `gateway_simulate`                    | Verify tx won't revert         |
| Broadcast signed tx          | `gateway_broadcast`                   | Send payment tx on-chain       |
| Track tx / order status      | `gateway_orders`                      | Confirm PaymentExecuted        |
| Get USDC price               | `market_price`                        | Dashboard price display        |
| Search token                 | `token_search`                        | Allowlist validation           |
| Token safety info            | `token_info` + `token_advanced_info`  | Token risk check               |
| Trending tokens              | `token_trending` + `token_hot_tokens` | Dashboard enrichment           |
| Agent wallet login           | `wallet_login` + `wallet_verify`      | TEE wallet creation            |
| Create sub-wallet            | `wallet_create`                       | Multi-agent support            |
| Agent wallet tx history      | `wallet_history`                      | Ledger — agent's own txs       |
| Scan tx for risk             | `security_tx_scan`                    | Pre-payment security gate      |
| Scan merchant URL            | `security_dapp_scan`                  | Allowlist validation           |

### Provider → skill map (read skill before writing provider file)

| Provider file                           | Skill to read first    |
| --------------------------------------- | ---------------------- |
| `providers/onchainos/agentic-wallet.ts` | `okx-agentic-wallet`   |
| `providers/onchainos/balance.ts`        | `okx-wallet-portfolio` |
| `providers/onchainos/gateway.ts`        | `okx-onchain-gateway`  |
| `providers/onchainos/swap.ts`           | `okx-dex-swap`         |
| `providers/onchainos/market.ts`         | `okx-dex-market`       |
| `providers/onchainos/token.ts`          | `okx-dex-token`        |
| `providers/onchainos/payments.ts`       | `okx-onchain-gateway`  |
| Security scan (any)                     | `okx-security`         |

---

## Skills — Phase Reference

### Phase 1 — Contracts

| Trigger                    | Skill                                     |
| -------------------------- | ----------------------------------------- |
| Starting SpendPolicy.sol   | `web3-foundry` + `web3-solidity-patterns` |
| ERC-8004 or x402 questions | `web3-eip-reference`                      |
| Before any deployment      | `deploy-check` + `solidity-security`      |
| Security audit             | `audit`                                   |

### Phase 2 — API + Payments

| Trigger                            | Skill / MCP                              |
| ---------------------------------- | ---------------------------------------- |
| Any OKX balance/portfolio provider | `okx-wallet-portfolio`                   |
| Any OKX gateway/broadcast provider | `okx-onchain-gateway`                    |
| Any OKX swap provider              | `okx-dex-swap`                           |
| Any OKX market/price provider      | `okx-dex-market`                         |
| Any OKX token provider             | `okx-dex-token`                          |
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

---

## Deployment

| Package      | Host            | URL                                            |
| ------------ | --------------- | ---------------------------------------------- |
| `web/`       | Vercel          | `usezenithpay.xyz`                             |
| `api/`       | Railway         | `api.usezenithpay.xyz`                         |
| `docs/`      | Vercel          | `docs.usezenithpay.xyz` (post-deadline)        |
| `contracts/` | X Layer mainnet | Already deployed — keep `broadcast/` committed |

`api.usezenithpay.xyz/mcp` — MCP server (same Railway process)
`api.usezenithpay.xyz/skill.md` — Agent skill file (same Railway process)

DNS: add `api` CNAME at domain registrar pointing to Railway deployment URL.

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

## Hard Rules

1. Every decision gets logged in `.context/MEMORY.md`
2. Every session ends with a commit
3. No mocks, no workarounds, no shortest path, no AI slop — real execution only
4. Do not re-litigate decisions already in `.context/PRD.md` — read and build
5. Build on the OnchainOS **X Layer ecosystem**
6. Build X Layer integrations strictly using `@resources/onchainos-skills`
7. Bonus for integrating **x402 payments**
8. Complete **at least one** X Layer transaction and capture the tx hash
9. Open-source on a public GitHub repository
10. `approvalThreshold` is off-chain only — do not add it to SpendPolicy.sol

## Working Style

- Direct and concise — think like a staff engineer
- Surface risks and tradeoffs early
- When blocked, say so immediately with what you need
- You are a co-builder — own design decisions, not just code generation
