// External plugin port of the in-tree zenmux extension.
// Source of truth: openclaw/openclaw extensions/zenmux/onboard.ts (PR #43994).

import {
  applyAgentDefaultModelPrimary,
  applyProviderConfigWithModelCatalog,
  type OpenClawConfig,
} from "openclaw/plugin-sdk/provider-onboard";
import { ZENMUX_BASE_URL } from "./zenmux-models.js";

export const ZENMUX_DEFAULT_MODEL_REF = "zenmux/openai/gpt-5.2";

export function applyZenmuxProviderConfig(cfg: OpenClawConfig): OpenClawConfig {
  const models = { ...cfg.agents?.defaults?.models };
  models[ZENMUX_DEFAULT_MODEL_REF] = {
    ...models[ZENMUX_DEFAULT_MODEL_REF],
    alias: models[ZENMUX_DEFAULT_MODEL_REF]?.alias ?? "ZenMux",
  };

  // Pass an EMPTY catalog so the runtime `buildProvider` (which fetches
  // /api/v1/models) becomes the sole source of truth for the model list.
  // Writing a non-empty static catalog to user config shadows runtime
  // discovery — the user only sees the seeded models. The runtime path
  // already falls back to a 1-model static catalog (`zenmux/openai/gpt-5.2`)
  // when discovery is unreachable, so offline behavior is unchanged.
  return applyProviderConfigWithModelCatalog(cfg, {
    agentModels: models,
    providerId: "zenmux",
    api: "openai-completions",
    baseUrl: ZENMUX_BASE_URL,
    catalogModels: [],
  });
}

export function applyZenmuxConfig(cfg: OpenClawConfig): OpenClawConfig {
  return applyAgentDefaultModelPrimary(applyZenmuxProviderConfig(cfg), ZENMUX_DEFAULT_MODEL_REF);
}
