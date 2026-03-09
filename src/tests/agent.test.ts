import { describe, it, expect } from "vitest";
import { runAgent } from "../agent/agent";

describe("Agent", () => {
  it("explains what an API is", async () => {
    const result = await runAgent("Explain what an API is in two sentences");

    expect(result.success).toBe(true);
  }, 20000); // 20 seconds
});
