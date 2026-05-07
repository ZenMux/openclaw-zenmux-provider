// Returns a small, static provider catalog. The full ZenMux model list (135+)
// is reachable via `resolveDynamicModel` + `prepareDynamicModel` in index.ts,
// backed by the singleton in zenmux-capabilities-cache.ts.
//
// Keeping the catalog small here matches the canonical openclaw bundled-
// provider pattern (e.g. extensions/openrouter ships only ~2 entries here)
// and avoids the cold-cache UX bug where pickers showed an empty/short list
// until the first inference call warmed a per-call fetch.

import type { ModelProviderConfig } from "openclaw/plugin-sdk/provider-model-shared";
import { staticZenmuxModelDefinitions, ZENMUX_BASE_URL } from "./zenmux-models.js";

export function buildZenmuxProvider(): ModelProviderConfig {
  return {
    baseUrl: ZENMUX_BASE_URL,
    api: "openai-completions",
    models: staticZenmuxModelDefinitions(),
  };
}
