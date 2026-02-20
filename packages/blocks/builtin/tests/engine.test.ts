import { describe, it, expect, vi } from "bun:test";
import { Engine, EngineOptions } from "../../engine";
import { BaseBlock, BlockOutput, Context } from "../../baseBlock";
import { ErrorHandlerBlock } from "../errorHandler";
import { JsVM } from "@fluxify/lib";

function createContext(): Context {
  const vars: Record<string, any> = {};
  return {
    vm: new JsVM(vars),
    route: "/test",
    apiId: "api-1",
    projectId: "proj-1",
    vars: vars as any,
    stopper: { timeoutEnd: 0, duration: 10000 },
  };
}

class MockBlock extends BaseBlock {
  constructor(
    context: Context,
    private output: any,
    private nextId?: string,
    private shouldSucceed: boolean = true,
    private shouldContinue: boolean = true,
  ) {
    super(context, undefined, nextId);
  }
  async executeAsync(params?: any): Promise<BlockOutput> {
    return {
      continueIfFail: this.shouldContinue,
      successful: this.shouldSucceed,
      output: this.output,
      next: this.nextId,
    };
  }
}

class ThrowingBlock extends BaseBlock {
  async executeAsync(): Promise<BlockOutput> {
    throw new Error("Block exploded");
  }
}

describe("Engine", () => {
  it("should execute a single block successfully", async () => {
    const ctx = createContext();
    const errorHandler = new ErrorHandlerBlock("", ctx, {
      next: "",
      blockName: "",
      blockDescription: "",
    });
    const blocks = {
      entry: new MockBlock(ctx, { result: "ok" }, undefined, true, true),
      error: errorHandler,
    };
    const options: EngineOptions = {
      errorHandlerId: "error",
      context: ctx,
    };
    const engine = new Engine(blocks, options);
    const result = await engine.start("entry");
    expect(result).not.toBeNull();
    expect(result!.successful).toBe(true);
    expect(result!.output).toEqual({ result: "ok" });
  });

  it("should chain blocks via next", async () => {
    const ctx = createContext();
    const errorHandler = new ErrorHandlerBlock("", ctx, {
      next: "",
      blockName: "",
      blockDescription: "",
    });
    const blocks = {
      block1: new MockBlock(ctx, "step1", "block2", true, true),
      block2: new MockBlock(ctx, "step2", undefined, true, true),
      error: errorHandler,
    };
    const options: EngineOptions = {
      errorHandlerId: "error",
      context: ctx,
    };
    const engine = new Engine(blocks, options);
    const result = await engine.start("block1");
    expect(result!.successful).toBe(true);
    expect(result!.output).toBe("step2");
  });

  it("should throw when block ID not found", async () => {
    const ctx = createContext();
    const options: EngineOptions = {
      errorHandlerId: "error",
      context: ctx,
    };
    const engine = new Engine({}, options);
    await expect(engine.start("nonexistent")).rejects.toThrow(
      "Block not found",
    );
  });

  it("should route to error handler on exception and stop if no next", async () => {
    const ctx = createContext();
    const errorHandler = new ErrorHandlerBlock("", ctx, {
      next: "",
      blockName: "",
      blockDescription: "",
    });
    const blocks = {
      entry: new ThrowingBlock(ctx),
      error: errorHandler,
    };
    const options: EngineOptions = {
      errorHandlerId: "error",
      context: ctx,
    };
    const engine = new Engine(blocks, options);
    const result = await engine.start("entry");
    expect(result).not.toBeNull();
    expect(result!.successful).toBe(false);
  });

  it("should route to error handler on failed block result", async () => {
    const ctx = createContext();
    const errorHandler = new ErrorHandlerBlock("", ctx, {
      next: "",
      blockName: "",
      blockDescription: "",
    });
    const failBlock = new MockBlock(ctx, null, undefined, false, false);
    // Override error property
    (failBlock as any).error = "block failed";
    const blocks = {
      entry: failBlock,
      error: errorHandler,
    };
    const options: EngineOptions = {
      errorHandlerId: "error",
      context: ctx,
    };
    const engine = new Engine(blocks, options);
    const result = await engine.start("entry");
    // Error handler with no next -> stops
    expect(result).toBeDefined();
  });
});
