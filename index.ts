// External plugin port of the in-tree zenmux extension.
// Source of truth: openclaw/openclaw extensions/zenmux/ (PR #43994), with
// catalog discovery refactored to mirror the canonical openclaw bundled-
// provider pattern (extensions/openrouter): a small static `catalog` plus
// `resolveDynamicModel` + `prepareDynamicModel` backed by a singleton
// in-memory and disk capabilities cache.

import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { createProviderApiKeyAuthMethod } from "openclaw/plugin-sdk/provider-auth";
import { applyZenmuxConfig } from "./onboard.js";
import { buildZenmuxProvider } from "./provider-catalog.js";
import {
  getZenmuxModelCapabilities,
  loadZenmuxModelCapabilities,
} from "./zenmux-capabilities-cache.js";
import { ZENMUX_BASE_URL } from "./zenmux-models.js";

const PROVIDER_ID = "zenmux";
const ZENMUX_DEFAULT_CONTEXT_WINDOW = 200_000;
const ZENMUX_DEFAULT_MAX_TOKENS = 8192;

function buildDynamicZenmuxModel(ctx: { modelId: string }) {
  const caps = getZenmuxModelCapabilities(ctx.modelId);
  return {
    id: ctx.modelId,
    name: caps?.name ?? ctx.modelId,
    api: "openai-completions" as const,
    provider: PROVIDER_ID,
    baseUrl: ZENMUX_BASE_URL,
    reasoning: caps?.reasoning ?? false,
    input: caps?.input ?? (["text"] as Array<"text" | "image">),
    cost: caps?.cost ?? { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
    contextWindow: caps?.contextWindow ?? ZENMUX_DEFAULT_CONTEXT_WINDOW,
    maxTokens: caps?.maxTokens ?? ZENMUX_DEFAULT_MAX_TOKENS,
  };
}

export default definePluginEntry({
  id: PROVIDER_ID,
  name: "ZenMux Provider",
  description: "External ZenMux provider plugin",
  register(api) {
    api.registerProvider({
      id: PROVIDER_ID,
      label: "ZenMux",
      docsPath: "/providers/zenmux",
      envVars: ["ZENMUX_API_KEY"],
      auth: [
        createProviderApiKeyAuthMethod({
          providerId: PROVIDER_ID,
          methodId: "api-key",
          label: "ZenMux API key",
          hint: "API key",
          optionKey: "zenmuxApiKey",
          flagName: "--zenmux-api-key",
          envVar: "ZENMUX_API_KEY",
          promptMessage: "Enter ZenMux API key",
          // Intentionally NOT setting `defaultModel` here — see v0.1.3
          // release notes. Without it openclaw skips the auto-allowlist
          // seeding pass; the primary default is still set by
          // applyAgentDefaultModelPrimary inside applyZenmuxConfig.
          expectedProviders: [PROVIDER_ID],
          applyConfig: (cfg) => applyZenmuxConfig(cfg),
          wizard: {
            choiceId: "zenmux-api-key",
            choiceLabel: "ZenMux API key",
            groupId: "zenmux",
            groupLabel: "ZenMux",
            groupHint: "API key",
          },
        }),
      ],
      catalog: {
        order: "simple",
        run: async (ctx) => {
          const apiKey = ctx.resolveProviderApiKey(PROVIDER_ID).apiKey;
          if (!apiKey) return null;
          return { provider: { ...buildZenmuxProvider(), apiKey } };
        },
      },
      staticCatalog: {
        order: "simple",
        run: async () => ({ provider: buildZenmuxProvider() }),
      },
      resolveDynamicModel: (ctx) => buildDynamicZenmuxModel(ctx),
      prepareDynamicModel: async (ctx) => {
        await loadZenmuxModelCapabilities(ctx.modelId);
      },
    });
  },
});
