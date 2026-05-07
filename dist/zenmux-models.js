// Static helpers for the ZenMux provider.
//
// Network-driven catalog discovery now lives in zenmux-capabilities-cache.ts,
// which mirrors the canonical openclaw bundled-provider pattern (see
// extensions/openrouter in the openclaw npm package). This file holds only
// the small, sync, dependency-free static fallback used by provider-catalog.ts
// (the catalog hook) and the constants shared across the plugin.
export const ZENMUX_BASE_URL = "https://zenmux.ai/api/v1";
const ZENMUX_DEFAULT_CONTEXT_WINDOW = 200_000;
const ZENMUX_DEFAULT_MAX_TOKENS = 8192;
const ZENMUX_DEFAULT_COST = {
    input: 0,
    output: 0,
    cacheRead: 0,
    cacheWrite: 0,
};
// Small static catalog returned by `buildZenmuxProvider`. Contains only the
// onboarding default model so the picker has something to show before the
// dynamic capabilities cache is warm. Any other zenmux/<id> still works on
// demand via `resolveDynamicModel` + `prepareDynamicModel`.
export function staticZenmuxModelDefinitions() {
    return [
        {
            id: "openai/gpt-5.4",
            name: "GPT-5.4",
            reasoning: false,
            input: ["text", "image"],
            cost: { ...ZENMUX_DEFAULT_COST },
            contextWindow: ZENMUX_DEFAULT_CONTEXT_WINDOW,
            maxTokens: ZENMUX_DEFAULT_MAX_TOKENS,
        },
    ];
}
//# sourceMappingURL=zenmux-models.js.map