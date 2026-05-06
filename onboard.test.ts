import { describe, expect, it } from "vitest";
import {
  applyZenmuxConfig,
  applyZenmuxProviderConfig,
  ZENMUX_DEFAULT_MODEL_REF,
} from "./onboard.js";
import { ZENMUX_BASE_URL } from "./zenmux-models.js";

describe("zenmux onboard", () => {
  it("exposes the canonical default model ref", () => {
    expect(ZENMUX_DEFAULT_MODEL_REF).toBe("zenmux/openai/gpt-5.2");
  });

  it("applyZenmuxProviderConfig wires the provider entry and catalog", () => {
    const out = applyZenmuxProviderConfig({});
    // Provider transport metadata should land under models.providers.zenmux
    const providers = (out.models as Record<string, unknown> | undefined)?.providers as
      | Record<string, { api?: string; baseUrl?: string }>
      | undefined;
    const zenmux = providers?.["zenmux"];
    expect(zenmux).toBeDefined();
    expect(zenmux?.api).toBe("openai-completions");
    expect(zenmux?.baseUrl).toBe(ZENMUX_BASE_URL);
  });

  it("applyZenmuxProviderConfig registers the default agent model with an alias", () => {
    const out = applyZenmuxProviderConfig({});
    const agentModels = out.agents?.defaults?.models as
      | Record<string, { alias?: string } | undefined>
      | undefined;
    expect(agentModels).toBeDefined();
    const entry = agentModels?.[ZENMUX_DEFAULT_MODEL_REF];
    expect(entry).toBeDefined();
    expect(entry?.alias).toBe("ZenMux");
  });

  it("applyZenmuxProviderConfig preserves a user-provided alias", () => {
    const out = applyZenmuxProviderConfig({
      agents: {
        defaults: {
          models: {
            [ZENMUX_DEFAULT_MODEL_REF]: { alias: "MyZenMux" },
          },
        },
      },
    } as never);
    const agentModels = out.agents?.defaults?.models as
      | Record<string, { alias?: string } | undefined>
      | undefined;
    expect(agentModels?.[ZENMUX_DEFAULT_MODEL_REF]?.alias).toBe("MyZenMux");
  });

  it("applyZenmuxConfig is idempotent for repeat calls", () => {
    const once = applyZenmuxConfig({});
    const twice = applyZenmuxConfig(once);
    expect(twice).toBeDefined();
    // Provider transport should still be set after a second pass.
    const providers = (twice.models as Record<string, unknown> | undefined)?.providers as
      | Record<string, { api?: string; baseUrl?: string }>
      | undefined;
    expect(providers?.["zenmux"]?.api).toBe("openai-completions");
    expect(providers?.["zenmux"]?.baseUrl).toBe(ZENMUX_BASE_URL);
  });
});
