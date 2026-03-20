import { defineConfig } from "drizzle-kit"

const url = process.env.DIRECT_URL ?? process.env.DATABASE_URL
if (!url) {
	throw new Error(
		"DATABASE_URL is required for drizzle-kit. Run db scripts with: bun run --env-file=.env db:generate"
	)
}

export default defineConfig({
	dialect: "postgresql",
	schema: "./src/db/schema.ts",
	out: "./drizzle",
	dbCredentials: { url },
})
