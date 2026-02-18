import { describe, it, expect } from "vitest";
import { ResponseBlock } from "../response";

describe("ResponseBlock", () => {
  it("should return http code and body from params", async () => {
    const block = new ResponseBlock({} as any, {
      httpCode: "200",
      blockName: "",
      blockDescription: "",
    });
    const result = await block.executeAsync({ message: "success" });
    expect(result.successful).toBe(true);
    expect(result.continueIfFail).toBe(true);
    expect(result.output).toEqual({
      httpCode: "200",
      body: { message: "success" },
    });
    // Terminal block — no next
    expect(result.next).toBeUndefined();
  });

  it("should return null body when no params are provided", async () => {
    const block = new ResponseBlock({} as any, {
      httpCode: "404",
      blockName: "",
      blockDescription: "",
    });
    const result = await block.executeAsync();
    expect(result.successful).toBe(true);
    expect(result.output).toEqual({
      httpCode: "404",
      body: null,
    });
  });

  it("should pass through different HTTP codes", async () => {
    const block = new ResponseBlock({} as any, {
      httpCode: "500",
      blockName: "",
      blockDescription: "",
    });
    const result = await block.executeAsync("error occurred");
    expect(result.output!.httpCode).toBe("500");
    expect(result.output!.body).toBe("error occurred");
  });
});
