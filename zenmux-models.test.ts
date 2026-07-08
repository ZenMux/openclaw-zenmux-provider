import { describe, expect, it } from "vitest";
import { staticZenmuxModelDefinitions, ZENMUX_BASE_URL } from "./zenmux-models.js";

describe("ZENMUX_BASE_URL", () => {
  it("is the OpenAI-compatible v1 base", () => {
    expect(ZENMUX_BASE_URL).toBe("https://zenmux.ai/api/v1");
  });
});

describe("staticZenmuxModelDefinitions", () => {
  it("returns a small curated fallback catalog with current headline models", () => {
    const models = staticZenmuxModelDefinitions();
    expect(models).toHaveLength(5);
    expect(models.map((m) => m.id)).toEqual([
      "openai/gpt-5.5",
      "openai/gpt-5.4",
      "anthropic/claude-sonnet-5",
      "google/gemini-3.5-flash",
      "x-ai/grok-4.3",
    ]);
    expect(models[0]).toMatchObject({
      id: "openai/gpt-5.5",
      name: "GPT-5.5",
      reasoning: true,
      input: ["text", "image"],
      contextWindow: 1_050_000,
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
