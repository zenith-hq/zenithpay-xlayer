# ZenithPay — Web

Next.js frontend for ZenithPay. Landing, docs, and sign-in UI. Backend is in `../api` (Hono + Bun).

## Stack

- **Framework:** [Next.js](https://nextjs.org) (App Router)
- **Styling:** [Tailwind CSS](https://tailwindcss.com) + [shadcn/ui](https://ui.shadcn.com)
- **Animation:** [Motion](https://motion.dev)
- **Runtime:** [Bun](https://bun.sh)

## Getting Started

```bash
bun install
bun dev
```

## Project Structure

```
web/
├── app/          # Pages: /, /signin, /docs
├── components/   # UI components
└── lib/          # Utilities
```

## License

[MIT](LICENSE)
