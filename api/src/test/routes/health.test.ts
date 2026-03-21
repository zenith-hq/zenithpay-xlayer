import { describe, expect, it } from "vitest";
import { app } from "../../app";

describe("Public routes", () => {
  it("GET /health → 200 with status ok", async () => {
    const res = await app.request("/health");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.status).toBe("ok");
    expect(body.service).toBe("zenithpay-api");
  });

  it("GET / unknown route → 404 with endpoints list", async () => {
    const res = await app.request("/nonexistent");
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.error).toBe("not_found");
    expect(body.endpoints).toBeDefined();
    expect(Array.isArray(body.endpoints)).toBe(true);
  });

  it("GET /skill.md → 200 with markdown content-type", async () => {
    const res = await app.request("/skill.md");
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toContain("text/markdown");
  });
});
