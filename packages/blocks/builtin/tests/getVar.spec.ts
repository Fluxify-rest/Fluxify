import { describe, it, expect, beforeEach } from "bun:test";
import { GetVarBlock } from "../getVar";
import { Context } from "../../baseBlock";
import { JsVM } from "@fluxify/lib";

describe("GetVarBlock", () => {
  let context: Context;

  beforeEach(() => {
    const vars: Record<string, any> = { username: "alice", count: 10 };
    context = {
      vm: new JsVM(vars),
      route: "/test",
      apiId: "api-1",
      projectId: "proj-1",
      vars: vars as any,
      stopper: { timeoutEnd: 0, duration: 5000 },
    };
  });

  it("should retrieve an existing variable from context", async () => {
    const block = new GetVarBlock(
      context,
      { key: "username", blockName: "", blockDescription: "" },
      "next-block",
    );
    const result = await block.executeAsync();
    expect(result.successful).toBe(true);
    expect(result.continueIfFail).toBe(true);
    expect(result.output).toBe("alice");
    expect(result.next).toBe("next-block");
  });

  it("should return undefined for a non-existing variable", async () => {
    const block = new GetVarBlock(
      context,
      { key: "nonExistent", blockName: "", blockDescription: "" },
      "next",
    );
    const result = await block.executeAsync();
    expect(result.successful).toBe(true);
    expect(result.output).toBeUndefined();
  });

  it("should return numeric values correctly", async () => {
    const block = new GetVarBlock(
      context,
      { key: "count", blockName: "", blockDescription: "" },
      "next",
    );
    const result = await block.executeAsync();
    expect(result.successful).toBe(true);
    expect(result.output).toBe(10);
  });

  it("should fail gracefully with invalid input (no key field)", async () => {
    const block = new GetVarBlock(context, { invalid: true } as any, "next");
    const result = await block.executeAsync();
    expect(result.successful).toBe(false);
    expect(result.continueIfFail).toBe(true);
    expect(result.output).toBeNull();
  });
});
