import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { tmpdir } from "node:os";
import { mkdtempSync, readFileSync, rmSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join } from "node:path";

// Each test gets its own temp dir to use as the openclaw state dir, so the
// disk cache is isolated. We mock `resolveStateDir` accordingly.
let stateDir: string;
const cacheFilePath = () => join(stateDir, "cache", "zenmux-models.json");

const sampleApiResponse = (ids: string[]) => ({
  data: ids.map((id) => ({
    id,
    display_name: id.split("/").pop() ?? id,
    context_length: 128_000,
    input_modalities: ["text", "image"],
    output_modalities: ["text"],
    capabilities: { reasoning: false },
    pricings: {
      prompt: [{ value: 1, unit: "per_million_tokens", currency: "USD" }],
      completion: [{ value: 2, unit: "per_million_tokens", currency: "USD" }],
    },
  })),
});

describe("zenmux-capabilities-cache", () => {
  beforeEach(() => {
    stateDir = mkdtempSync(join(tmpdir(), "openclaw-zenmux-test-"));
    vi.resetModules();
    vi.doMock("openclaw/plugin-sdk/state-paths", () => ({
      resolveStateDir: () => stateDir,
    }));
  });

  afterEach(() => {
    if (existsSync(stateDir)) rmSync(stateDir, { recursive: true, force: true });
    vi.restoreAllMocks();
    vi.resetModules();
  });

  it("loadZenmuxModelCapabilities populates the cache via the live fetch + persists to disk", async () => {
    vi.doMock("openclaw/plugin-sdk/ssrf-runtime", () => ({
      fetchWithSsrFGuard: async () => ({
        response: new Response(
          JSON.stringify(sampleApiResponse(["openai/gpt-5.4", "anthropic/claude-opus-4.7"])),
          { status: 200, headers: { "Content-Type": "application/json" } },
        ),
        release: async () => {},
      }),
    }));
    const mod = await import("./zenmux-capabilities-cache.js?test1");
    await mod.loadZenmuxModelCapabilities("openai/gpt-5.4");

    const caps = mod.getZenmuxModelCapabilities("openai/gpt-5.4");
    expect(caps).toBeDefined();
    expect(caps?.name).toBe("gpt-5.4");
    expect(caps?.input).toEqual(["text", "image"]);
    expect(caps?.cost.input).toBe(1);
    expect(caps?.cost.output).toBe(2);

    // Disk cache populated
    expect(existsSync(cacheFilePath())).toBe(true);
    const onDisk = JSON.parse(readFileSync(cacheFilePath(), "utf-8"));
    expect(Object.keys(onDisk.models)).toContain("openai/gpt-5.4");
    expect(Object.keys(onDisk.models)).toContain("anthropic/claude-opus-4.7");
  });

  it("getZenmuxModelCapabilities reads from disk cache on cold start (no network call)", async () => {
    // Pre-populate the disk cache before importing the module.
    mkdirSync(join(stateDir, "cache"), { recursive: true });
    writeFileSync(
      cacheFilePath(),
      JSON.stringify({
        models: {
          "openai/gpt-5.4": {
            name: "GPT-5.4",
            reasoning: false,
            input: ["text", "image"],
            cost: { input: 1, output: 2, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 200_000,
            maxTokens: 8192,
          },
        },
      }),
      "utf-8",
    );
    const fetchSpy = vi.fn();
    vi.doMock("openclaw/plugin-sdk/ssrf-runtime", () => ({
      fetchWithSsrFGuard: fetchSpy,
    }));
    const mod = await import("./zenmux-capabilities-cache.js?test2");
    const caps = mod.getZenmuxModelCapabilities("openai/gpt-5.4");
    expect(caps).toBeDefined();
    expect(caps?.name).toBe("GPT-5.4");
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("multiple concurrent loadZenmuxModelCapabilities calls share a single fetch (single-flight)", async () => {
    let fetchCount = 0;
    vi.doMock("openclaw/plugin-sdk/ssrf-runtime", () => ({
      fetchWithSsrFGuard: async () => {
        fetchCount++;
        // Slow response so the second call can join the in-flight promise.
        await new Promise((r) => setTimeout(r, 50));
        return {
          response: new Response(JSON.stringify(sampleApiResponse(["openai/gpt-5.4"])), {
            status: 200,
          }),
          release: async () => {},
        };
      },
    }));
    const mod = await import("./zenmux-capabilities-cache.js?test3");
    await Promise.all([
      mod.loadZenmuxModelCapabilities("openai/gpt-5.4"),
      mod.loadZenmuxModelCapabilities("openai/gpt-5.4"),
      mod.loadZenmuxModelCapabilities("openai/gpt-5.4"),
    ]);
    expect(fetchCount).toBe(1);
  });

  it("getZenmuxModelCapabilities returns undefined for unknown model id", async () => {
    vi.doMock("openclaw/plugin-sdk/ssrf-runtime", () => ({
      fetchWithSsrFGuard: async () => ({
        response: new Response(JSON.stringify(sampleApiResponse(["openai/gpt-5.4"])), {
          status: 200,
        }),
        release: async () => {},
      }),
    }));
    const mod = await import("./zenmux-capabilities-cache.js?test4");
    await mod.loadZenmuxModelCapabilities("openai/gpt-5.4");
    expect(mod.getZenmuxModelCapabilities("never/exists")).toBeUndefined();
  });

  it("falls back gracefully when fetch fails (no exception, no cache populated)", async () => {
    vi.doMock("openclaw/plugin-sdk/ssrf-runtime", () => ({
      fetchWithSsrFGuard: async () => {
        throw new Error("network down");
      },
    }));
    const mod = await import("./zenmux-capabilities-cache.js?test5");
    await expect(mod.loadZenmuxModelCapabilities("openai/gpt-5.4")).resolves.toBeUndefined();
    expect(mod.getZenmuxModelCapabilities("openai/gpt-5.4")).toBeUndefined();
    expect(existsSync(cacheFilePath())).toBe(false);
  });
});
