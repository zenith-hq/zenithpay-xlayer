import { $ } from "bun";
import { app } from "./app";
import { env } from "./env";

// onchainos installs to /root/.local/bin which is not in PATH in Railway's
// non-login shell. Prepend it so Bun.spawn and Bun.$ both resolve the binary.
process.env.PATH = `/root/.local/bin:${process.env.PATH}`;

async function authenticateCLI() {
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
