![ZenithPay banner](web/public/banner.png)

## ZenithPay

> Your agent spends. You own the rules.

**ZenithPay is the spend management layer for AI agents on X Layer—enabling safe, controlled agent payments with trustless spend enforcement, on-chain policies, and x402-native routing.**


X Layer is unlocking an agent economy, but agents still need a safe way to hold funds and pay for services without risking runaway spend. ZenithPay is the missing infrastructure layer: built directly on X Layer and integrated with OKX OnchainOS for balance checks, swaps, and market data, it lets agents pay x402-native endpoints while staying within clear, on-chain enforced policies. Agents can hold real balances, auto-swap tokens when needed, and pay services over HTTP, while builders define where, how much, and how often they can spend—backed by policies, approvals, and audit trails.

ZenithPay delivers a **safe, controlled autonomous agent payment flow within the X Layer ecosystem** for AI agents.

**Hackathon track:** Agentic Payments

### What ZenithPay enables

- **Safe x402 payments**: agents pay HTTP services on X Layer with enforced spend rules.
- **Controlled autonomy**: per-agent limits and allowlists define what’s allowed before any payment is sent.
- **Token flexibility**: agents can auto-swap into the right token when needed while keeping a clear, verifiable spend trail.

## Tech stack

- **Frontend**: Next.js 16 + Tailwind v4 + shadcn/ui + Motion + wagmi + viem
- **Wallet**: OKX Wallet (EIP-6963) · agent EOA via viem `privateKeyToAccount`
- **Backend API**: Bun + Hono + PostgreSQL + Supabase + Drizzle → Railway
- **Smart Contracts**: Solidity + Foundry + OpenZeppelin → X Layer mainnet (chain ID 196)
- **X Layer**: OKX OnchainOS — Wallet Portfolio API · DEX Swap API · Onchain Gateway (simulate + broadcast) · Market API · Token API
- **Payments**: x402 protocol (`@x402/fetch`, `@x402/hono`) · USDC on X Layer (`0x74b7f16337b8972027f6196a17a631ac6de26d22`)
