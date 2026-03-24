# AGENTS.md

Global operating guide for any coding agent working in this repo (Cursor, Codex, Claude Code, Gemini, etc.).

- **Claude Code-specific skill triggers** live in `CLAUDE.md`.
- **Product + architecture source of truth** lives in `.context/PRD.md`.

---

## Project

**ZenithPay** — spend management layer for AI agents on X Layer.

> Agents securely pay x402-native HTTP endpoints with enforced on-chain spend policies, zero-gas USDC transfers, and auto-swap, full audit via OKX OnchainOS DEX.

**Hackathon:** X Layer OnchainOS AI Hackathon — Agentic Payments track
**Deadline:** March 26, 2026

---

## Repo map

| Path                                 | Purpose                                                             |
| ------------------------------------ | ------------------------------------------------------------------- |
| `.context/PRD.md`                    | Architecture decisions + full product spec. Source of truth.        |
| `.context/MEMORY.md`                 | Current build state: done / next / blockers. Updated every session. |
| `.context/OnchainOS-AI-hackathon.md` | Official hackathon requirements and judging criteria.               |
| `web/`                               | Frontend — Next.js 16 + Tailwind v4 + shadcn/ui                     |
| `api/`                               | Backend API — Bun + Hono _(not scaffolded yet)_                     |
| `contracts/`                         | Smart contracts — Solidity + Foundry _(not scaffolded yet)_         |

---

## Development commands

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

---

## Build state

| Layer        | Status          | What's needed                                                           |
| ------------ | --------------- | ----------------------------------------------------------------------- |
| `web/`       | In progress     | Landing page done. Privy removed, wagmi v3 done. Needs dashboard pages. |
| `api/`       | **Not created** | Full Bun + Hono scaffold + providers layer                              |
| `contracts/` | **Not created** | SpendPolicy.sol + Foundry setup                                         |

---

## Architecture

### Payment flow

```
Agent → zenithpay_pay_service(url, maxAmount, intent)
  → Check USDC balance            (okx-wallet-portfolio)
  → [If USDC < required]
      auto-swap OKB → USDC        (okx-dex-swap)
  → SpendPolicy.sol checkAndRecord()  ← on-chain enforcement gate
  → OKX TEE agentic wallet signs EIP-3009 transferWithAuthorization
  → POST /api/v6/x402/verify      ← OKX Payments API (verify payment)
  → POST /api/v6/x402/settle      ← OKX Payments API (zero-gas settle)
  → txHash returned
  → PaymentExecuted event emitted on-chain
  → Ledger entry written to Supabase
```

Blocked call path: `SpendPolicy.sol` reverts → `PaymentBlocked` event → error returned to agent.

**OKX x402 Payments API** (zero-gas on X Layer):

- `GET /api/v6/x402/supported` — check supported tokens (USDC, USDT, USDG on X Layer)
- `POST /api/v6/x402/verify` — verify EIP-3009 authorization before settlement
- `POST /api/v6/x402/settle` — execute settlement (zero gas, OKX acts as facilitator)

Agent signs an EIP-3009 `transferWithAuthorization` with a deadline, passes it to `/verify`, then `/settle` executes the USDC transfer on-chain. Full spec in `.context/PRD.md` §4.

### API provider layer (`api/src/providers/`)

| File                            | Responsibility                                          |
| ------------------------------- | ------------------------------------------------------- |
| `onchainos/agentic-wallet.ts`   | OKX TEE agentic wallet — ak/verify, session, sign + broadcast |
| `onchainos/balance.ts`          | OKX Wallet Check Balance API                            |
| `onchainos/gateway.ts`          | OKX Transaction API — simulate + broadcast              |
| `onchainos/swap.ts`             | OKX DEX Swap API — OKB→USDC pre-payment                 |
| `onchainos/payments.ts`         | OKX Payments API — x402 zero-gas execution              |
| `onchainos/history.ts`          | OKX Transaction History API                             |
| `onchainos/market.ts`           | OKX Market API — prices + token data                    |

### X Layer chain config

```typescript
// api/src/config/chains.ts
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

## Session workflow

### Start of session

1. Read `AGENTS.md`
2. Read `.context/MEMORY.md` — current build state
3. Read `.context/PRD.md` — scope + architecture
4. State what you'll do and any blockers

### End of session

1. Update `.context/MEMORY.md` — what changed, decisions made, what's next, blockers
2. Commit + push

---

## Commit format

```
<type>: <what was built or decided>

- detail

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
```

Types: `feat` `fix` `contracts` `deploy` `docs` `test`

Commit after every meaningful unit. Deploy commits must include contract address + chain.

---

## Hard rules

1. Every decision gets logged in `.context/MEMORY.md`
2. Every session ends with a commit
3. No mocks, no workarounds — real execution only
4. Do not re-litigate decisions already in `.context/PRD.md` — read and build
5. Build on OnchainOS **X Layer ecosystem** (chainId: 196)
6. X Layer integrations use OKX OnchainOS APIs only
7. x402 payments are required — zero-gas on X Layer via OKX Payments API
8. Complete at least one X Layer transaction and capture the tx hash
9. Keep the GitHub repo public

## Solidity rules

- CEI pattern on all external calls — non-negotiable
- Never `tx.origin` for auth — always `msg.sender`
- Custom errors over `require` strings
- Events for every state change
- NatSpec on all public/external functions
- Run security audit before any deployment

## TypeScript rules

- Never use JS `number` for token amounts — use `bigint`
- `Address` type from viem (`0x${string}`) for all addresses
- Always check `receipt.status` after transactions
- Handle wallet disconnection, chain switching, tx revert gracefully

---

## OKX OnchainOS — Tool map

OnchainOS tools are the **only** approved integrations for X Layer. No Base, no Locus, no Privy.

### MCP tools (`onchainos-cli` server)

| Task                         | Tool                                |
| ---------------------------- | ----------------------------------- |
| Check agent USDC/OKB balance | `portfolio_token_balances`          |
| Get total portfolio value    | `portfolio_total_value`             |
| Get all token balances       | `portfolio_all_balances`            |
| Get swap quote (OKB→USDC)    | `swap_quote`                        |
| Execute swap                 | `swap_swap`                         |
| Approve token for swap       | `swap_approve`                      |
| Estimate gas                 | `gateway_gas` + `gateway_gas_limit` |
| Simulate tx                  | `gateway_simulate`                  |
| Broadcast signed tx          | `gateway_broadcast`                 |
| Track tx status              | `gateway_orders`                    |
| Get token price              | `market_price`                      |
| Search / validate token      | `token_search` + `token_info`       |
| Token safety check           | `token_advanced_info`               |

### Skills → provider file mapping

| Provider file                     | Skill to invoke before writing                    |
| --------------------------------- | ------------------------------------------------- |
| `providers/onchainos/balance.ts`  | `okx-wallet-portfolio`                            |
| `providers/onchainos/gateway.ts`  | `okx-onchain-gateway`                             |
| `providers/onchainos/swap.ts`     | `okx-dex-swap`                                    |
| `providers/onchainos/payments.ts` | `okx-onchain-gateway` (OKX x402 API — see PRD §4) |
| `providers/onchainos/market.ts`   | `okx-dex-market`                                  |
| `providers/onchainos/token.ts`    | `okx-dex-token`                                   |
| `providers/onchainos/agentic-wallet.ts` | `okx-agentic-wallet` — TEE agentic wallet   |
| Token risk before allowlist       | `okx-security`                                    |

### Hard rules — ecosystem

- **Agent wallet:** OKX TEE agentic wallet (`onchainos/agentic-wallet.ts`) — API key auth, session cert, `preTransactionUnsignedInfo` + `broadcastTransaction`. No viem EOA.
- **Frontend wallet connect:** wagmi `injected()` — OKX Wallet auto-detected via EIP-6963, no Privy
- **Payment execution:** OKX x402 Payments API (`POST /api/v6/x402/verify` + `/settle`) — zero gas, no raw broadcast needed
- **x402 routing:** `@x402/fetch` + `@x402/hono` client-side; settlement via OKX facilitator
- **Swaps:** `okx-dex-swap` only — 500+ DEX sources

---

## Tech stack

| Layer               | Technology                                                                          |
| ------------------- | ----------------------------------------------------------------------------------- |
| Chain               | X Layer (chainId: 196, EVM-compatible)                                              |
| Agent wallet        | OKX TEE agentic wallet (`onchainos/agentic-wallet.ts`) + `okx-agentic-wallet` skill |
| Balance / portfolio | `okx-wallet-portfolio` skill + `portfolio_*` MCP tools                              |
| DEX swap            | `okx-dex-swap` skill + `swap_*` MCP tools                                           |
| Tx broadcast        | `okx-onchain-gateway` skill + `gateway_*` MCP tools                                 |
| Market data         | `okx-dex-market` skill + `market_*` MCP tools                                       |
| Token data / safety | `okx-dex-token` + `okx-security` skills                                             |
| Payment routing     | x402 (`@x402/fetch` + `@x402/hono`) + OKX Payments API (`/x402/verify` + `/settle`) |
| Policy enforcement  | SpendPolicy.sol (Solidity + Foundry)                                                |
| Backend             | Hono + Bun                                                                          |
| Database            | Supabase + Drizzle                                                                  |
| Frontend            | Next.js 16 + Tailwind v4 + shadcn/ui                                                |
| Frontend wallet     | wagmi `injected()` — OKX Wallet via EIP-6963 (no Privy)                             |
