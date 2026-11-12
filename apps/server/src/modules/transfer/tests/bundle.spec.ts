import { describe, expect, it } from "bun:test";
import { BadRequestError } from "../../../errors/badRequestError";
import { parseEnvelope } from "../envelope";
import { ROUTE_BUNDLE_KIND, ROUTE_BUNDLE_VERSION, routeHandler } from "../handlers/route";

const parseBundle = (raw: unknown) => parseEnvelope(raw, routeHandler.spec);

const valid = () => ({
	kind: ROUTE_BUNDLE_KIND,
	version: ROUTE_BUNDLE_VERSION,
	exportedAt: new Date().toISOString(),
	route: { name: "list users", path: "/users", method: "GET" },
	canvas: { blocks: [], edges: [] },
	middlewares: {},
});

describe("parseBundle", () => {
	it("accepts a valid bundle and fills defaults", () => {
		const bundle = parseBundle(valid());
		expect(bundle.route.timeoutSeconds).toBe(30);
		expect(bundle.responseSchemas).toEqual([]);
		expect(bundle.middlewares).toEqual({ before: [], after: [] });
		expect(bundle.suites).toBeUndefined();
	});

	it("rejects a payload that is not a route export", () => {
		expect(() => parseBundle({ kind: "fluxify.canvas" })).toThrow(BadRequestError);
		expect(() => parseBundle(null)).toThrow("isn't a Fluxify route export");
	});

	it("refuses a newer version instead of guessing", () => {
		const doc = { ...valid(), version: ROUTE_BUNDLE_VERSION + 1 };
		expect(() => parseBundle(doc)).toThrow("newer version");
	});

	it("names the field of an invalid bundle", () => {
		const doc = { ...valid(), route: { name: "x", path: "/users", method: "PATCH" } };
		expect(() => parseBundle(doc)).toThrow("route.");
	});

	it("rejects a suite assertion the test runner would refuse", () => {
		const doc = {
			...valid(),
			suites: [{ name: "s", assertions: [{ target: "status", operator: "contains", expectedValue: "1" }] }],
		};
		expect(() => parseBundle(doc)).toThrow(BadRequestError);
	});

	it("keeps a disabled suite disabled", () => {
		const doc = { ...valid(), suites: [{ name: "s", enabled: false }] };
		expect(parseBundle(doc).suites?.[0]?.enabled).toBe(false);
	});

	it("reads a v1 route file without enabled as enabled", () => {
		const doc = { ...valid(), suites: [{ name: "s" }] };
		expect(parseBundle(doc).suites?.[0]?.enabled).toBe(true);
	});
});
