// External plugin port of the in-tree zenmux extension.
// Source of truth: openclaw/openclaw extensions/zenmux/zenmux-models.ts (PR #43994).
import { fetchWithSsrFGuard } from "openclaw/plugin-sdk/ssrf-runtime";
export const ZENMUX_BASE_URL = "https://zenmux.ai/api/v1";
const ZENMUX_MODELS_URL = "https://zenmux.ai/api/v1/models";
const ZENMUX_DEFAULT_CONTEXT_WINDOW = 200000;
const ZENMUX_DEFAULT_MAX_TOKENS = 8192;
const ZENMUX_DEFAULT_COST = {
    input: 0,
    output: 0,
    cacheRead: 0,
    cacheWrite: 0,
};
// Static fallback when discovery is unavailable (matches onboarding default model ref).
function staticZenmuxModelDefinitions() {
    return [
        {
            id: "openai/gpt-5.2",
            name: "GPT-5.2",
            reasoning: false,
            input: ["text", "image"],
            cost: ZENMUX_DEFAULT_COST,
            contextWindow: ZENMUX_DEFAULT_CONTEXT_WINDOW,
            maxTokens: ZENMUX_DEFAULT_MAX_TOKENS,
        },
    ];
}
function extractZenmuxCost(pricings) {
    const getPrice = (arr) => arr?.[0]?.value ?? 0;
    return {
        input: getPrice(pricings.prompt),
        output: getPrice(pricings.completion),
        cacheRead: getPrice(pricings.input_cache_read),
        cacheWrite: getPrice([
            pricings.input_cache_write,
            pricings.input_cache_write_5_min,
            pricings.input_cache_write_1_h,
        ].find((t) => t != null && t.length > 0)),
    };
}
export async function discoverZenmuxModels() {
    if (process.env.VITEST || process.env.NODE_ENV === "test") {
        return staticZenmuxModelDefinitions();
    }
    try {
        const { response, release } = await fetchWithSsrFGuard({
            url: ZENMUX_MODELS_URL,
            signal: AbortSignal.timeout(10000),
            init: {
                headers: { Accept: "application/json" },
            },
            policy: { allowedHostnames: ["zenmux.ai"] },
            auditContext: "zenmux-model-discovery",
        });
        try {
            if (!response.ok) {
                console.warn(`Failed to discover ZenMux models: HTTP ${response.status}, using static catalog`);
                return staticZenmuxModelDefinitions();
            }
            const data = (await response.json());
            if (!data.data || data.data.length === 0) {
                console.warn("No ZenMux models found, using static catalog");
                return staticZenmuxModelDefinitions();
            }
            return data.data.map((model) => {
                const inputModalities = model.input_modalities ?? ["text"];
                const hasImage = inputModalities.includes("image");
                const input = hasImage ? ["text", "image"] : ["text"];
                const cost = model.pricings ? extractZenmuxCost(model.pricings) : ZENMUX_DEFAULT_COST;
                return {
                    id: model.id,
                    name: model.display_name || model.id,
                    reasoning: model.capabilities?.reasoning ?? false,
                    input,
                    cost,
                    contextWindow: model.context_length ?? ZENMUX_DEFAULT_CONTEXT_WINDOW,
                    maxTokens: ZENMUX_DEFAULT_MAX_TOKENS,
                };
            });
        }
        finally {
            await release();
        }
    }
    catch (error) {
        console.warn(`Discovery failed: ${String(error)}, using static catalog`);
        return staticZenmuxModelDefinitions();
    }
}
// Exported so tests can exercise the cost-extraction edge cases (e.g. the
// regression for "pick first non-empty cache-write tier" — moltbot e70cae5173).
export { extractZenmuxCost as _extractZenmuxCostForTesting };
//# sourceMappingURL=zenmux-models.js.map