import { describe, it, expect, vi } from "bun:test";
import { GetHttpHeaderBlock } from "../http/getHttpHeader";
import { SetHttpHeaderBlock } from "../http/setHttpHeader";
import { GetHttpParamBlock } from "../http/getHttpParam";
import { GetHttpCookieBlock } from "../http/getHttpCookie";
import { GetHttpRequestBodyBlock } from "../http/getHttpRequestBody";
import { Context } from "../../baseBlock";
import { JsVM } from "@fluxify/lib";

function createContext(overrides: Partial<Context> = {}): Context {
  const headers: Record<string, string> = {
    "content-type": "application/json",
    authorization: "Bearer token123",
  };
  const queryParams: Record<string, string> = {
    page: "1",
    limit: "10",
  };
  const routeParams: Record<string, string> = {
    userId: "abc-123",
  };
  const cookies: Record<string, string> = {
    session: "sess-value-456",
  };
  const vars: Record<string, any> = {
    getHeader: vi.fn((key: string) => headers[key] || ""),
    setHeader: vi.fn((key: string, value: string) => {
      headers[key] = value;
    }),
    getQueryParam: vi.fn((key: string) => queryParams[key] || ""),
    getRouteParam: vi.fn((key: string) => routeParams[key] || ""),
    getCookie: vi.fn((key: string) => cookies[key] || ""),
    setCookie: vi.fn(),
    httpRequestMethod: "GET",
    httpRequestRoute: "/users/:userId",
    getRequestBody: vi.fn(() => ({ name: "Alice" })),
    getConfig: vi.fn(() => "config-value"),
    logger: {
      info: vi.fn(),
      error: vi.fn(),
      warn: vi.fn(),
      debug: vi.fn(),
    } as any,
  };
  const vm = new JsVM(vars);
  return {
    vm,
    route: "/users/:userId",
    apiId: "api-1",
    projectId: "proj-1",
    vars: vars as any,
    requestBody: { name: "Alice" },
    stopper: { timeoutEnd: 0, duration: 5000 },
    ...overrides,
  };
}

describe("HTTP Blocks", () => {
  describe("GetHttpHeaderBlock", () => {
    it("should retrieve a header by name", async () => {
      const ctx = createContext();
      const block = new GetHttpHeaderBlock(
        ctx,
        { name: "content-type", blockName: "", blockDescription: "" },
        "next",
      );
      const result = await block.executeAsync();
      expect(result.successful).toBe(true);
      expect(result.output).toBe("application/json");
      expect(result.next).toBe("next");
    });

    it("should resolve JS expression for name", async () => {
      const ctx = createContext();
      const block = new GetHttpHeaderBlock(
        ctx,
        {
          name: "js:return 'authorization'",
          blockName: "",
          blockDescription: "",
        },
        "next",
      );
      const result = await block.executeAsync();
      expect(result.successful).toBe(true);
      expect(result.output).toBe("Bearer token123");
    });
  });

  describe("SetHttpHeaderBlock", () => {
    it("should set a header value", async () => {
      const ctx = createContext();
      const block = new SetHttpHeaderBlock(
        ctx,
        {
          name: "x-custom",
          value: "custom-val",
          blockName: "",
          blockDescription: "",
        },
        "next",
      );
      const result = await block.executeAsync({ passthrough: true });
      expect(result.successful).toBe(true);
      expect(ctx.vars.setHeader).toHaveBeenCalledWith("x-custom", "custom-val");
      expect(result.output).toEqual({ passthrough: true });
    });
  });

  describe("GetHttpParamBlock", () => {
    it("should retrieve a query parameter", async () => {
      const ctx = createContext();
      const block = new GetHttpParamBlock(
        ctx,
        { name: "page", source: "query", blockName: "", blockDescription: "" },
        "next",
      );
      const result = await block.executeAsync();
      expect(result.successful).toBe(true);
      expect(result.output).toBe("1");
    });

    it("should retrieve a path parameter", async () => {
      const ctx = createContext();
      const block = new GetHttpParamBlock(
        ctx,
        { name: "userId", source: "path", blockName: "", blockDescription: "" },
        "next",
      );
      const result = await block.executeAsync();
      expect(result.successful).toBe(true);
      expect(result.output).toBe("abc-123");
    });
  });

  describe("GetHttpCookieBlock", () => {
    it("should retrieve a cookie by name", async () => {
      const ctx = createContext();
      const block = new GetHttpCookieBlock(
        ctx,
        { name: "session", blockName: "", blockDescription: "" },
        "next",
      );
      const result = await block.executeAsync();
      expect(result.successful).toBe(true);
      expect(result.output).toBe("sess-value-456");
    });
  });

  describe("GetHttpRequestBodyBlock", () => {
    it("should return the request body from context", async () => {
      const ctx = createContext();
      const block = new GetHttpRequestBodyBlock(ctx, null, "next");
      const result = await block.executeAsync();
      expect(result.successful).toBe(true);
      expect(result.output).toEqual({ name: "Alice" });
      expect(result.next).toBe("next");
    });

    it("should return undefined when no request body is set", async () => {
      const ctx = createContext({ requestBody: undefined });
      const block = new GetHttpRequestBodyBlock(ctx, null, "next");
      const result = await block.executeAsync();
      expect(result.successful).toBe(true);
      expect(result.output).toBeUndefined();
    });
  });
});
