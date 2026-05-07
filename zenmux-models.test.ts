import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  ZENMUX_BASE_URL,
  _extractZenmuxCostForTesting as extractCost,
  discoverZenmuxModels,
} from "./zenmux-models.js";

const sampleTier = (value: number) => ({ value, unit: "per_million_tokens", currency: "USD" });

describe("ZENMUX_BASE_URL", () => {
  it("is the OpenAI-compatible v1 base", () => {
    expect(ZENMUX_BASE_URL).toBe("https://zenmux.ai/api/v1");
  });
});

describe("discoverZenmuxModels (VITEST guard)", () => {
  it("returns the static fallback under VITEST=1 without network", async () => {
    expect(process.env.VITEST).toBeTruthy();
    const models = await discoverZenmuxModels();
    expect(models).toHaveLength(1);
    expect(models[0]).toMatchObject({
      id: "openai/gpt-5.4",
      name: "GPT-5.4",
      reasoning: false,
      input: ["text", "image"],
      contextWindow: 200000,
      maxTokens: 8192,
    });
  });
});

describe("extractZenmuxCost", () => {
  it("reads value[0] from prompt/completion/cache-read tiers", () => {
    const cost = extractCost({
      prompt: [sampleTier(3)],
      completion: [sampleTier(15)],
      input_cache_read: [sampleTier(0.3)],
      input_cache_write: [sampleTier(3.75)],
    });
    expect(cost).toEqual({ input: 3, output: 15, cacheRead: 0.3, cacheWrite: 3.75 });
  });

  it("defaults each missing tier to 0", () => {
    expect(extractCost({})).toEqual({ input: 0, output: 0, cacheRead: 0, cacheWrite: 0 });
  });

  it("picks the first non-empty cache-write tier (regression: moltbot e70cae5173)", () => {
    // input_cache_write is empty; should fall through to input_cache_write_5_min.
    expect(
      extractCost({
        input_cache_write: [],
        input_cache_write_5_min: [sampleTier(2.5)],
        input_cache_write_1_h: [sampleTier(5)],
      }),
    ).toMatchObject({ cacheWrite: 2.5 });

    // First two empty; should fall through to 1_h.
    expect(
      extractCost({
        input_cache_write: [],
        input_cache_write_5_min: [],
        input_cache_write_1_h: [sampleTier(5)],
      }),
    ).toMatchObject({ cacheWrite: 5 });

    // All three undefined → 0.
    expect(extractCost({})).toMatchObject({ cacheWrite: 0 });
  });
});

describe("discoverZenmuxModels (mocked fetch)", () => {
  // Bypass the VITEST guard for these tests, restore afterwards.
  const savedVitest = process.env.VITEST;
  const savedNodeEnv = process.env.NODE_ENV;

  beforeEach(() => {
    delete process.env.VITEST;
    delete process.env.NODE_ENV;
    vi.resetModules();
  });

  afterEach(() => {
    if (savedVitest !== undefined) process.env.VITEST = savedVitest;
    if (savedNodeEnv !== undefined) process.env.NODE_ENV = savedNodeEnv;
    vi.restoreAllMocks();
    vi.resetModules();
  });

  it("maps upstream /models response into ModelDefinitionConfig entries", async () => {
    vi.doMock("openclaw/plugin-sdk/ssrf-runtime", () => ({
      fetchWithSsrFGuard: async () => ({
        response: new Response(
          JSON.stringify({
            data: [
              {
                id: "openai/gpt-test",
                display_name: "GPT Test",
                context_length: 128000,
                input_modalities: ["text", "image"],
                output_modalities: ["text"],
                capabilities: { reasoning: true },
                pricings: {
                  prompt: [sampleTier(1)],
                  completion: [sampleTier(2)],
                  input_cache_read: [sampleTier(0.1)],
                  input_cache_write: [sampleTier(1.25)],
                },
              },
              {
                id: "anthropic/claude-test",
                display_name: "",
                context_length: 200000,
                input_modalities: ["text"],
                output_modalities: ["text"],
                pricings: {},
              },
            ],
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        ),
        release: async () => {},
      }),
    }));

    const mod = await import("./zenmux-models.js?mocked");
    const out = await mod.discoverZenmuxModels();
    expect(out).toHaveLength(2);
    expect(out[0]).toMatchObject({
      id: "openai/gpt-test",
      name: "GPT Test",
      reasoning: true,
      input: ["text", "image"],
      cost: { input: 1, output: 2, cacheRead: 0.1, cacheWrite: 1.25 },
      contextWindow: 128000,
      maxTokens: 8192,
    });
    // Falls back to id when display_name is empty; defaults reasoning to false.
    expect(out[1]).toMatchObject({
      id: "anthropic/claude-test",
      name: "anthropic/claude-test",
      reasoning: false,
      input: ["text"],
      contextWindow: 200000,
    });
  });

  it("returns the static fallback when upstream response has no data", async () => {
    vi.doMock("openclaw/plugin-sdk/ssrf-runtime", () => ({
      fetchWithSsrFGuard: async () => ({
        response: new Response(JSON.stringify({ data: [] }), { status: 200 }),
        release: async () => {},
      }),
    }));
    const mod = await import("./zenmux-models.js?empty");
    const out = await mod.discoverZenmuxModels();
    expect(out).toHaveLength(1);
    expect(out[0]?.id).toBe("openai/gpt-5.4");
  });

  it("returns the static fallback when upstream returns a non-2xx", async () => {
    vi.doMock("openclaw/plugin-sdk/ssrf-runtime", () => ({
      fetchWithSsrFGuard: async () => ({
        response: new Response("upstream failure", { status: 503 }),
        release: async () => {},
      }),
    }));
    const mod = await import("./zenmux-models.js?http503");
    const out = await mod.discoverZenmuxModels();
    expect(out).toHaveLength(1);
    expect(out[0]?.id).toBe("openai/gpt-5.4");
  });

  it("returns the static fallback when fetch throws", async () => {
    vi.doMock("openclaw/plugin-sdk/ssrf-runtime", () => ({
      fetchWithSsrFGuard: async () => {
        throw new Error("network down");
      },
    }));
    const mod = await import("./zenmux-models.js?throw");
    const out = await mod.discoverZenmuxModels();
    expect(out).toHaveLength(1);
    expect(out[0]?.id).toBe("openai/gpt-5.4");
  });
});
