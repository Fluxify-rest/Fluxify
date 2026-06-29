import { describe, it, expect, beforeEach } from "bun:test";
import { SetVarBlock } from "../setVar";
import { Context } from "../../baseBlock";
import { JsVM } from "@fluxify/lib";

describe("SetVarBlock", () => {
  let context: Context;

  beforeEach(() => {
    const vars: Record<string, any> = {};
    context = {
      vm: new JsVM(vars),
      route: "/test",
      apiId: "api-1",
      projectId: "proj-1",
      vars: vars as any,
      stopper: { timeoutEnd: 0, duration: 5000 },
    };
  });

  it("should set a static string value in context vars", async () => {
    const block = new SetVarBlock(
      context,
      { key: "greeting", value: "hello", blockName: "", blockDescription: "" },
      "next-block",
    );
    const result = await block.executeAsync();
    expect(result.successful).toBe(true);
    expect(result.continueIfFail).toBe(true);
    expect(result.output).toBe("hello");
    expect(result.next).toBe("next-block");
    expect(context.vars["greeting"]).toBe("hello");
  });

  it("should set a numeric value in context vars", async () => {
    const block = new SetVarBlock(
      context,
      { key: "count", value: 42, blockName: "", blockDescription: "" },
      "next",
    );
    const result = await block.executeAsync();
    expect(result.successful).toBe(true);
    expect(result.output).toBe(42);
    expect(context.vars["count"]).toBe(42);
  });

  it("should evaluate JS expression value", async () => {
    const block = new SetVarBlock(
      context,
      {
        key: "computed",
        value: "js:return 2 + 3",
        blockName: "",
        blockDescription: "",
      },
      "next",
    );
    const result = await block.executeAsync();
    expect(result.successful).toBe(true);
    expect(result.output).toBe(5);
    expect(context.vars["computed"]).toBe(5);
  });

  it("should use params as value when useParam is true", async () => {
    const block = new SetVarBlock(
      context,
      {
        key: "fromParam",
        value: "ignored",
        blockName: "",
        blockDescription: "",
      },
      "next",
      true,
    );
    const result = await block.executeAsync({ data: "fromPrevBlock" });
    expect(result.successful).toBe(true);
    expect(result.output).toEqual({ data: "fromPrevBlock" });
    expect(context.vars["fromParam"]).toEqual({ data: "fromPrevBlock" });
  });

  it("should set an object value", async () => {
    const objValue = { nested: { deep: true } };
    const block = new SetVarBlock(
      context,
      { key: "obj", value: objValue, blockName: "", blockDescription: "" },
      "next",
    );
    const result = await block.executeAsync();
    expect(result.successful).toBe(true);
    expect(context.vars["obj"]).toEqual(objValue);
  });
});
