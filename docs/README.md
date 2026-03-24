# ZenithPay Docs

Technical docs site for ZenithPay, built with Next.js + Fumadocs.

## Purpose

This package documents:

- architecture and security model
- onboarding and authentication
- REST + MCP integration paths
- concepts (`SpendPolicy`, Agent Wallet, Auto-Swap)
- API reference

## Run locally

```bash
cd docs
bun install
bun dev
```

Open `http://localhost:3000/docs`.

## Structure

- `content/docs/index.mdx` — introduction
- `content/docs/quickstart.mdx` — setup + first payment
- `content/docs/authentication.mdx` — auth model
- `content/docs/integration/*` — REST, MCP, and skill integration guides
- `content/docs/concepts/*` — spend policy, wallet, and swap concepts
- `content/docs/api-reference/*` — API reference content and OpenAPI

## Deployment

Docs are deployed from this package to:

- `https://docs.usezenithpay.xyz`
