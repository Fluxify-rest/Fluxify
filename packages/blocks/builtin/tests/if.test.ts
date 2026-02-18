import { describe, it, expect, beforeEach, vi } from "vitest";
import { IfBlock, OperatorResult } from "../if";
import { JsVM } from "@fluxify/lib";

describe("Testing IfBlock", () => {
  describe("Testing executeAsync()", () => {
    let sut: IfBlock = null!;
    const context = {
      http: {
        method: "GET",
        pathParams: {
          userId: "123",
        },
      },
      user: {
        roles: ["admin"],
        id: "123",
      },
      vm: new JsVM({}),
    } as any;

    beforeEach(() => {
      // We need to setup a context with a VM
      context.vm = new JsVM(context);
    });

    it("should return success path when condition is met", async () => {
      const conditions = [
        { lhs: 1, rhs: 1, operator: "eq" as const, chain: "and" as const },
      ];
      // @ts-ignore
      sut = new IfBlock("success-path", "failure-path", context, {
        conditions,
      });

      const result = await sut.executeAsync();

      expect(result.successful).toBe(true);
      expect(result.next).toBe("success-path");
    });

    it("should return failure path when condition is not met", async () => {
      const conditions = [
        { lhs: 1, rhs: 2, operator: "eq" as const, chain: "and" as const },
      ];
      // @ts-ignore
      sut = new IfBlock("success-path", "failure-path", context, {
        conditions,
      });

      const result = await sut.executeAsync();

      expect(result.successful).toBe(false);
      expect(result.next).toBe("failure-path");
    });

    it("should evaluate complex conditions correctly", async () => {
      const conditions = [
        { lhs: 1, rhs: 2, operator: "eq" as const, chain: "or" as const },
        { lhs: 5, rhs: 5, operator: "eq" as const, chain: "and" as const },
      ];
      // 1==2 (false) OR 5==5 (true) -> true
      // @ts-ignore
      sut = new IfBlock("success-path", "failure-path", context, {
        conditions,
      });

      const result = await sut.executeAsync();

      expect(result.successful).toBe(true);
      expect(result.next).toBe("success-path");
    });
  });
});
