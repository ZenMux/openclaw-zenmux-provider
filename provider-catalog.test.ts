import { describe, expect, it } from "vitest";
import { buildZenmuxProvider } from "./provider-catalog.js";
import { ZENMUX_BASE_URL } from "./zenmux-models.js";

describe("buildZenmuxProvider", () => {
  it("returns an OpenAI-compatible provider config under VITEST=1", async () => {
    // vitest auto-sets process.env.VITEST, so discoverZenmuxModels() takes
    // the static-fallback path and never hits the network.
    const provider = await buildZenmuxProvider();
    expect(provider.baseUrl).toBe(ZENMUX_BASE_URL);
    expect(provider.api).toBe("openai-completions");
    expect(Array.isArray(provider.models)).toBe(true);
    expect(provider.models.length).toBeGreaterThan(0);
    expect(provider.models[0]).toMatchObject({
      id: "openai/gpt-5.2",
      name: "GPT-5.2",
    });
  });
});
