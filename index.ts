// External plugin port of the in-tree zenmux extension.
// Source of truth: openclaw/openclaw extensions/zenmux/index.ts (PR #43994).

import { defineSingleProviderPluginEntry } from "openclaw/plugin-sdk/provider-entry";
import { applyZenmuxConfig } from "./onboard.js";
import { buildZenmuxProvider } from "./provider-catalog.js";

const PROVIDER_ID = "zenmux";

export default defineSingleProviderPluginEntry({
  id: PROVIDER_ID,
  name: "ZenMux Provider",
  description: "External ZenMux provider plugin",
  provider: {
    label: "ZenMux",
    docsPath: "/providers/zenmux",
    auth: [
      {
        methodId: "api-key",
        label: "ZenMux API key",
        hint: "API key",
        optionKey: "zenmuxApiKey",
        flagName: "--zenmux-api-key",
        envVar: "ZENMUX_API_KEY",
        promptMessage: "Enter ZenMux API key",
        // Intentionally NOT setting `defaultModel` here. When `defaultModel`
        // is present in the auth config, openclaw's `applyApiKeyConfig`
        // calls `applyPrimaryModel` after our `applyConfig` hook, which in
        // turn invokes `ensureModelAllowlistEntry` — that seeds
        // `agents.defaults.models[<defaultModel>] = {}` and collapses the
        // agent allowlist to that one model, blocking any of the other 134
        // discovered zenmux models with "model not allowed". The primary
        // default model is still set: `applyZenmuxConfig` calls
        // `applyAgentDefaultModelPrimary` itself, so onboarding ends with
        // `agents.defaults.model.primary = "zenmux/openai/gpt-5.2"` and an
        // empty `agents.defaults.models` map (no allowlist enforcement).
        applyConfig: (cfg) => applyZenmuxConfig(cfg),
        wizard: {
          choiceId: "zenmux-api-key",
          choiceLabel: "ZenMux API key",
          groupId: "zenmux",
          groupLabel: "ZenMux",
          groupHint: "API key",
        },
      },
    ],
    catalog: {
      buildProvider: buildZenmuxProvider,
    },
  },
});
