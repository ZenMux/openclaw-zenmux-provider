import { describe, expect, it } from "vitest";
import { staticZenmuxModelDefinitions, ZENMUX_BASE_URL } from "./zenmux-models.js";

describe("ZENMUX_BASE_URL", () => {
  it("is the OpenAI-compatible v1 base", () => {
    expect(ZENMUX_BASE_URL).toBe("https://zenmux.ai/api/v1");
  });
});

describe("staticZenmuxModelDefinitions", () => {
  it("returns the single onboarding default model", () => {
    const models = staticZenmuxModelDefinitions();
    expect(models).toHaveLength(1);
    expect(models[0]).toMatchObject({
      id: "openai/gpt-5.4",
      name: "GPT-5.4",
      reasoning: false,
      input: ["text", "image"],
      contextWindow: 200_000,
      maxTokens: 8192,
    });
  });

  it("each call returns a fresh object (caller can mutate without bleed)", () => {
    const a = staticZenmuxModelDefinitions();
    const b = staticZenmuxModelDefinitions();
    expect(a).not.toBe(b);
    expect(a[0]).not.toBe(b[0]);
  });
});
