import { describe, expect, it } from "vitest";
import entry from "./index.js";

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
});
