import { describe, it, expect, beforeEach } from "bun:test";
import { TransformerBlock } from "../transformer";
import { Context } from "../../baseBlock";
import { JsVM } from "@fluxify/lib";

describe("TransformerBlock", () => {
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

  it("should map fields from input params to output object", async () => {
    const block = new TransformerBlock(
      context,
      {
        fieldMap: { firstName: "name", age: "userAge" },
        useJs: false,
        blockName: "",
        blockDescription: "",
      },
      "next-block",
    );
    const result = await block.executeAsync({ firstName: "Alice", age: 30 });
    expect(result.successful).toBe(true);
    expect(result.output).toEqual({ name: "Alice", userAge: 30 });
    expect(result.next).toBe("next-block");
  });

  it("should fail when a required key is missing from params", async () => {
    const block = new TransformerBlock(
      context,
      {
        fieldMap: { firstName: "name", missingKey: "value" },
        useJs: false,
        blockName: "",
        blockDescription: "",
      },
      "next",
    );
    const result = await block.executeAsync({ firstName: "Alice" });
    expect(result.successful).toBe(false);
    expect(result.continueIfFail).toBe(false);
    expect(result.error).toContain("Missing Key: missingKey");
  });

  it("should execute JS code when useJs is true", async () => {
    const block = new TransformerBlock(
      context,
      {
        fieldMap: {},
        useJs: true,
        js: "return { result: input.x * 2 }",
        blockName: "",
        blockDescription: "",
      },
      "next",
    );
    const result = await block.executeAsync({ x: 5 });
    expect(result.successful).toBe(true);
    expect(result.output).toEqual({ result: 10 });
  });

  it("should fail with invalid transformer input (no fieldMap)", async () => {
    const block = new TransformerBlock(
      context,
      { invalid: true } as any,
      "next",
    );
    const result = await block.executeAsync({ data: "test" });
    expect(result.successful).toBe(false);
    expect(result.continueIfFail).toBe(false);
  });

  it("should handle empty fieldMap with no JS", async () => {
    const block = new TransformerBlock(
      context,
      {
        fieldMap: {},
        useJs: false,
        blockName: "",
        blockDescription: "",
      },
      "next",
    );
    const result = await block.executeAsync({ anything: "here" });
    expect(result.successful).toBe(true);
    expect(result.output).toEqual({});
  });
});
