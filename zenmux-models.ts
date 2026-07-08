// Static helpers for the ZenMux provider.
//
// Network-driven catalog discovery now lives in zenmux-capabilities-cache.ts,
// which mirrors the canonical openclaw bundled-provider pattern (see
// extensions/openrouter in the openclaw npm package). This file holds only
// the small, sync, dependency-free static fallback used by provider-catalog.ts
// (the catalog hook) and the constants shared across the plugin.

import type { ModelDefinitionConfig } from "openclaw/plugin-sdk/provider-model-shared";

export const ZENMUX_BASE_URL = "https://zenmux.ai/api/v1";

const ZENMUX_DEFAULT_CONTEXT_WINDOW = 200_000;
const ZENMUX_DEFAULT_MAX_TOKENS = 8192;
const ZENMUX_DEFAULT_COST = {
  input: 0,
  output: 0,
  cacheRead: 0,
  cacheWrite: 0,
} as const;

// Small static catalog returned by `buildZenmuxProvider`. It includes a
// handful of current headline models so picker/search UX is useful even
// before the dynamic capabilities cache is warm. Any other zenmux/<id> still
// works on demand via `resolveDynamicModel` + `prepareDynamicModel`.
export function staticZenmuxModelDefinitions(): ModelDefinitionConfig[] {
  return [
    {
      id: "openai/gpt-5.5",
      name: "GPT-5.5",
      reasoning: true,
      input: ["text", "image"],
      cost: { ...ZENMUX_DEFAULT_COST },
      contextWindow: 1_050_000,
      maxTokens: ZENMUX_DEFAULT_MAX_TOKENS,
    },
    {
      id: "openai/gpt-5.4",
      name: "GPT-5.4",
      reasoning: true,
      input: ["text", "image"],
      cost: { ...ZENMUX_DEFAULT_COST },
      contextWindow: 1_050_000,
      maxTokens: ZENMUX_DEFAULT_MAX_TOKENS,
    },
    {
      id: "anthropic/claude-sonnet-5",
      name: "Claude Sonnet 5",
      reasoning: true,
      input: ["text", "image"],
      cost: { ...ZENMUX_DEFAULT_COST },
      contextWindow: 1_000_000,
      maxTokens: ZENMUX_DEFAULT_MAX_TOKENS,
    },
    {
      id: "google/gemini-3.5-flash",
      name: "Gemini 3.5 Flash",
      reasoning: true,
      input: ["text", "image"],
      cost: { ...ZENMUX_DEFAULT_COST },
      contextWindow: 1_048_576,
      maxTokens: ZENMUX_DEFAULT_MAX_TOKENS,
    },
    {
      id: "x-ai/grok-4.3",
      name: "Grok 4.3",
      reasoning: true,
      input: ["text", "image"],
      cost: { ...ZENMUX_DEFAULT_COST },
      contextWindow: 1_000_000,
      maxTokens: ZENMUX_DEFAULT_MAX_TOKENS,
    },
  ];
}
