import { describe, expect, it } from "vitest";
import entry from "./index.js";

function createApiStub() {
  const calls = {
    providers: [] as unknown[],
    hooks: [] as Array<{ name: string; handler: unknown }>,
  };
  return {
    api: {
      logger: { warn: () => undefined },
      on: (name: string, handler: unknown) => {
        calls.hooks.push({ name, handler });
      },
      registerProvider: (provider: unknown) => {
        calls.providers.push(provider);
      },
    },
    calls,
  };
}

describe("zenmux plugin entry", () => {
  it("exports a plugin entry with the expected identity", () => {
    expect(entry).toBeDefined();
    expect(entry).toMatchObject({
      id: "zenmux",
      name: "ZenMux Provider",
    });
  });

  it("exposes a register function", () => {
    expect(typeof (entry as { register?: unknown }).register).toBe("function");
  });

  it("registers the provider and a gateway_start prewarm hook", () => {
    const { api, calls } = createApiStub();
    (entry as { register: (api: unknown) => void }).register(api);

    expect(calls.providers).toHaveLength(1);
    expect(calls.hooks.some((hook) => hook.name === "gateway_start")).toBe(true);
  });
});
