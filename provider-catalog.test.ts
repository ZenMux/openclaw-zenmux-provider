import { describe, expect, it } from "vitest";
import { buildZenmuxProvider } from "./provider-catalog.js";
import { ZENMUX_BASE_URL } from "./zenmux-models.js";

describe("buildZenmuxProvider", () => {
  it("returns a small static OpenAI-compatible provider config (no network)", () => {
    const provider = buildZenmuxProvider();
    expect(provider.baseUrl).toBe(ZENMUX_BASE_URL);
    expect(provider.api).toBe("openai-completions");
    expect(Array.isArray(provider.models)).toBe(true);
    // Catalog stays small on purpose — full discovery happens via
    // resolveDynamicModel + prepareDynamicModel.
    expect(provider.models.length).toBeGreaterThanOrEqual(1);
    expect(provider.models.length).toBeLessThanOrEqual(5);
    expect(provider.models[0]).toMatchObject({
      id: "openai/gpt-5.5",
      name: "GPT-5.5",
    });
  });
});
