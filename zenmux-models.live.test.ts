import { describe, expect, it } from "vitest";
import {
  getZenmuxModelCapabilities,
  loadZenmuxModelCapabilities,
} from "./zenmux-capabilities-cache.js";

const liveEnabled =
  process.env.OPENCLAW_LIVE_TEST === "1" && Boolean(process.env.ZENMUX_API_KEY);
const describeLive = liveEnabled ? describe : describe.skip;

describeLive("zenmux-capabilities-cache live (real /models endpoint)", () => {
  it(
    "fetches the live catalog and exposes well-formed capabilities for a known model",
    async () => {
      // openai/gpt-5.4 is the onboarding default and should always be present
      // in the live ZenMux catalog. If this test ever starts failing, that's
      // either a real upstream regression or a sign the default needs bumping.
      await loadZenmuxModelCapabilities("openai/gpt-5.4");
      const caps = getZenmuxModelCapabilities("openai/gpt-5.4");
      expect(caps).toBeDefined();
      expect(typeof caps?.name).toBe("string");
      expect(Array.isArray(caps?.input)).toBe(true);
      expect(typeof caps?.contextWindow).toBe("number");
      expect(typeof caps?.cost.input).toBe("number");
      expect(typeof caps?.cost.output).toBe("number");
    },
    30_000,
  );
});
