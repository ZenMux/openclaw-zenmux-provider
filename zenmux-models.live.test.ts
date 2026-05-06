import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { discoverZenmuxModels } from "./zenmux-models.js";

const liveEnabled = process.env.OPENCLAW_LIVE_TEST === "1" && Boolean(process.env.ZENMUX_API_KEY);
const describeLive = liveEnabled ? describe : describe.skip;

describeLive("zenmux-models live (real /models endpoint)", () => {
  let savedVitest: string | undefined;
  let savedNodeEnv: string | undefined;

  beforeAll(() => {
    savedVitest = process.env.VITEST;
    savedNodeEnv = process.env.NODE_ENV;
    delete process.env.VITEST;
    delete process.env.NODE_ENV;
  });

  afterAll(() => {
    if (savedVitest !== undefined) process.env.VITEST = savedVitest;
    if (savedNodeEnv !== undefined) process.env.NODE_ENV = savedNodeEnv;
  });

  it(
    "fetches the live ZenMux model catalog and parses into the expected shape",
    async () => {
      const models = await discoverZenmuxModels();
      expect(Array.isArray(models)).toBe(true);
      expect(models.length).toBeGreaterThan(0);
      const first = models[0]!;
      expect(typeof first.id).toBe("string");
      expect(typeof first.name).toBe("string");
      expect(Array.isArray(first.input)).toBe(true);
      expect(typeof first.contextWindow).toBe("number");
      expect(typeof first.cost?.input).toBe("number");
    },
    30_000,
  );
});
