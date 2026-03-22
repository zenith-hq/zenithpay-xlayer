import { $ } from "bun";
import { app } from "./app";
import { env } from "./env";

async function authenticateCLI() {
  const bin = Bun.which("onchainos");
  if (!bin) {
    console.error("onchainos binary not found in PATH:", process.env.PATH);
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
