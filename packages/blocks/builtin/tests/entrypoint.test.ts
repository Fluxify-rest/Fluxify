import { describe, it, expect } from "vitest";
import { EntrypointBlock } from "../entrypoint";

describe("EntrypointBlock", () => {
  it("should pass through params as output", async () => {
    const block = new EntrypointBlock({} as any, {}, "next-block");
    const result = await block.executeAsync({ foo: "bar" });
    expect(result.successful).toBe(true);
    expect(result.continueIfFail).toBe(true);
    expect(result.output).toEqual({ foo: "bar" });
    expect(result.next).toBe("next-block");
  });

  it("should return undefined output when no params are provided", async () => {
    const block = new EntrypointBlock({} as any, {}, "next-block");
    const result = await block.executeAsync();
    expect(result.successful).toBe(true);
    expect(result.output).toBeUndefined();
    expect(result.next).toBe("next-block");
  });

  it("should return empty next when no next block is specified", async () => {
    const block = new EntrypointBlock({} as any, {});
    const result = await block.executeAsync("hello");
    expect(result.successful).toBe(true);
    expect(result.output).toBe("hello");
    expect(result.next).toBeUndefined();
  });
});
