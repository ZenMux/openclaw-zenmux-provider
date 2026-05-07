// External plugin port of the in-tree zenmux extension.
// Source of truth: openclaw/openclaw extensions/zenmux/onboard.ts (PR #43994).
import { applyAgentDefaultModelPrimary, applyProviderConfigWithModelCatalog, } from "openclaw/plugin-sdk/provider-onboard";
import { ZENMUX_BASE_URL } from "./zenmux-models.js";
export const ZENMUX_DEFAULT_MODEL_REF = "zenmux/openai/gpt-5.4";
export function applyZenmuxProviderConfig(cfg) {
    // Pass through the user's existing agent-models map without seeding our own
    // entry. `agents.defaults.models` doubles as the agent's allowlist: any key
    // there is the *only* model the agent is permitted to switch to via /model.
    // Seeding even a single entry (e.g. {"zenmux/openai/gpt-5.4": {alias:"ZenMux"}})
    // collapses the allowlist to that one model and trips "model not allowed"
    // for the other 134 zenmux models. Leaving the map alone (empty by default)
    // means no allowlist enforcement — every model in the runtime catalog is
    // freely selectable. The default model is still set via
    // applyAgentDefaultModelPrimary in applyZenmuxConfig.
    //
    // Pass an EMPTY catalog so the runtime `buildProvider` (which fetches
    // /api/v1/models) becomes the sole source of truth for the model list.
    // Writing a non-empty static catalog shadows runtime discovery; the runtime
    // path already returns a 1-model fallback (`zenmux/openai/gpt-5.4`) when
    // discovery is unreachable, so offline behavior is unchanged.
    return applyProviderConfigWithModelCatalog(cfg, {
        agentModels: cfg.agents?.defaults?.models ?? {},
        providerId: "zenmux",
        api: "openai-completions",
        baseUrl: ZENMUX_BASE_URL,
        catalogModels: [],
    });
}
export function applyZenmuxConfig(cfg) {
    return applyAgentDefaultModelPrimary(applyZenmuxProviderConfig(cfg), ZENMUX_DEFAULT_MODEL_REF);
}
//# sourceMappingURL=onboard.js.map