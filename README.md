# openclaw-zenmux-provider

External [OpenClaw](https://docs.openclaw.ai) plugin that adds the
[ZenMux](https://zenmux.ai) LLM provider — an OpenAI-compatible aggregator that
routes requests to 200+ models from OpenAI, Anthropic, Google, DeepSeek, xAI,
Moonshot, and others through a single API key.

This is a standalone port of the in-tree provider proposed in
[openclaw/openclaw#43994](https://github.com/openclaw/openclaw/pull/43994), so
it works on stock OpenClaw without waiting for that PR to merge.

## Install

The standard ClawHub flow:

```bash
openclaw plugins install clawhub:openclaw-zenmux-provider
openclaw gateway restart
```

A bare npm-safe spec also works — OpenClaw tries ClawHub first, then npm:

```bash
openclaw plugins install openclaw-zenmux-provider
```

For local development:

```bash
openclaw plugins install -l /path/to/openclaw-zenmux   # symlink for fast iteration
# or
openclaw plugins install /path/to/openclaw-zenmux      # copy into managed install dir
```

## Configure

Get an API key from the
[ZenMux console](https://zenmux.ai), then run:

```bash
openclaw onboard --zenmux-api-key $ZENMUX_API_KEY
```

Or set `ZENMUX_API_KEY` in your environment and OpenClaw will pick it up
automatically. The default agent model is set to `zenmux/openai/gpt-5.2`; pick
a different one with `-m`:

```bash
openclaw chat -m zenmux/anthropic/claude-sonnet-4.5 "hello"
openclaw chat -m zenmux/google/gemini-3.1-pro-preview "hello"
```

Available models are discovered dynamically from
`https://zenmux.ai/api/v1/models` on each catalog refresh; if discovery is
unreachable, a small static catalog is used as a fallback.

## How it works

- **Transport:** OpenAI-compatible (`api: "openai-completions"`) against
  `https://zenmux.ai/api/v1`.
- **Model namespacing:** every ZenMux model is referenced as
  `zenmux/<provider>/<model-name>` — the prefix routes the request through this
  plugin; the suffix is forwarded to ZenMux as the upstream `model` field.
- **Auth:** single `ZENMUX_API_KEY` env var (or `--zenmux-api-key` flag during
  onboarding); the manifest declares this so OpenClaw can detect credentials
  before the plugin runtime loads.
- **Catalog discovery:** uses `fetchWithSsrFGuard` from the plugin SDK so model
  discovery is gated by OpenClaw's standard SSRF policy.

## Compatibility

- Requires OpenClaw `>= 2026.4.14`. Older hosts will fail closed at install
  time per the manifest's `compat.minGatewayVersion`.

## Note on running alongside the in-tree extension

If you are running a build of OpenClaw that ships the in-tree
`extensions/zenmux/` extension (PR #43994), you don't need this plugin — pick
one or the other. Both register the provider id `zenmux`, so OpenClaw will
report a duplicate-id error in `openclaw plugins doctor` if both are loaded.

## Development

```bash
pnpm install
pnpm typecheck         # tsc --noEmit
pnpm test              # vitest unit tests
ZENMUX_API_KEY=zm-... OPENCLAW_LIVE_TEST=1 pnpm test:live
```

## License

MIT — see [LICENSE](./LICENSE).
