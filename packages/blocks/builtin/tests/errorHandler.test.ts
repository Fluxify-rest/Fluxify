import { describe, it, expect } from "vitest";
import { ErrorHandlerBlock } from "../errorHandler";

describe("ErrorHandlerBlock", () => {
  it("should route to next block on first error when next is set", async () => {
    const block = new ErrorHandlerBlock("recovery-block", {} as any, {
      next: "",
      blockName: "",
      blockDescription: "",
    });
    const result = await block.executeAsync("Something went wrong");
    expect(result.successful).toBe(false);
    expect(result.continueIfFail).toBe(true);
    expect(result.error).toBe("Something went wrong");
    expect(result.next).toBe("recovery-block");
  });

  it("should not route on a second invocation (one-shot only)", async () => {
    const block = new ErrorHandlerBlock("recovery-block", {} as any, {
      next: "",
      blockName: "",
      blockDescription: "",
    });

    // First call — routes to recovery-block
    await block.executeAsync("Error 1");

    // Second call — should stop (processed = true)
    const result = await block.executeAsync("Error 2");
    expect(result.successful).toBe(false);
    expect(result.continueIfFail).toBe(false);
    expect(result.error).toBe("Error 2");
    expect(result.next).toBeUndefined();
  });

  it("should terminate immediately when no next block is specified", async () => {
    const block = new ErrorHandlerBlock("", {} as any, {
      next: "",
      blockName: "",
      blockDescription: "",
    });
    const result = await block.executeAsync(new Error("Fatal"));
    expect(result.successful).toBe(false);
    expect(result.continueIfFail).toBe(false);
    expect(result.error).toBe("Error: Fatal");
  });

  it("should handle string error messages", async () => {
    const block = new ErrorHandlerBlock("next", {} as any, {
      next: "",
      blockName: "",
      blockDescription: "",
    });
    const result = await block.executeAsync("plain text error");
    expect(result.error).toBe("plain text error");
  });
});
