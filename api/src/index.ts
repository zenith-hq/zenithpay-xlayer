import { existsSync } from "node:fs";
import { $ } from "bun";
import { app } from "./app";
import { env } from "./env";

async function authenticateCLI() {
  const bin = Bun.which("onchainos");
  if (!bin) {
    const locations = [
      "/root/.local/bin/onchainos",
      "/usr/local/bin/onchainos",
    ];
    console.error("onchainos binary not found in PATH");
    for (const loc of locations) {
      console.error(`  ${loc}: ${existsSync(loc) ? "EXISTS but not in PATH" : "NOT FOUND"}`);
    }
    console.error("  PATH:", process.env.PATH);
    return;
  }

  console.log(`onchainos found at ${bin}`);

  try {
    const status = await $`onchainos wallet status`.json();
    if (status.ok && status.data?.loggedIn) {
      console.log("onchainos CLI already authenticated");
      return;
    }
    await $`onchainos wallet login`.quiet();
    console.log("onchainos CLI authenticated via API key");
  } catch (err) {
    console.error("onchainos CLI authentication failed:", err);
  }
}

await authenticateCLI();

const server = Bun.serve({
  port: env.PORT,
  fetch: app.fetch,
});

console.log(`ZenithPay API running on http://localhost:${server.port}`);
