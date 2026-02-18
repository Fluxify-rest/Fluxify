import { describe, it, expect, beforeEach } from "vitest";
import { JsRunnerBlock } from "../jsRunner";
import { Context } from "../../baseBlock";
import { JsVM } from "@fluxify/lib";

describe("JsRunnerBlock", () => {
  let context: Context;

  beforeEach(() => {
    const vars: Record<string, any> = { multiplier: 3 };
    context = {
      vm: new JsVM(vars),
      route: "/test",
      apiId: "api-1",
      projectId: "proj-1",
      vars: vars as any,
      abortController: new AbortController(),
      stopper: { timeoutEnd: 0, duration: 5000 },
    };
  });

  it("should execute JS code and return result", async () => {
    const block = new JsRunnerBlock(
      context,
      { value: "return 1 + 2;", blockName: "", blockDescription: "" },
      "next",
    );
    const result = await block.executeAsync();
    expect(result.successful).toBe(true);
    expect(result.continueIfFail).toBe(true);
    expect(result.output).toBe(3);
    expect(result.next).toBe("next");
  });

  it("should access context variables from JS code", async () => {
    const block = new JsRunnerBlock(
      context,
      { value: "return multiplier * 10;", blockName: "", blockDescription: "" },
      "next",
    );
    const result = await block.executeAsync();
    expect(result.successful).toBe(true);
    expect(result.output).toBe(30);
  });

  it("should access params via input variable", async () => {
    const block = new JsRunnerBlock(
      context,
      { value: "return input.value + 1;", blockName: "", blockDescription: "" },
      "next",
    );
    const result = await block.executeAsync({ value: 99 });
    expect(result.successful).toBe(true);
    expect(result.output).toBe(100);
  });

  it("should return failure on JS runtime error", async () => {
    const block = new JsRunnerBlock(
      context,
      {
        value: "throw new Error('oops');",
        blockName: "",
        blockDescription: "",
      },
      "next",
    );
    const result = await block.executeAsync();
    expect(result.successful).toBe(false);
    expect(result.continueIfFail).toBe(false);
    expect(result.error).toContain("oops");
  });

  it("should return objects from JS code", async () => {
    const block = new JsRunnerBlock(
      context,
      {
        value: "return { a: 1, b: 'two' };",
        blockName: "",
        blockDescription: "",
      },
      "next",
    );
    const result = await block.executeAsync();
    expect(result.successful).toBe(true);
    expect(result.output).toEqual({ a: 1, b: "two" });
  });
});
