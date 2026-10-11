import { describe, expect, it } from "bun:test";
import { type RouteTraceFactory, startRouteTrace, wantsSpans } from "./traceLifecycle";

describe("spans for an ephemeral run (#741)", () => {
	it("an ephemeral run wants spans though it exports and records nothing", () => {
		expect(wantsSpans({})).toBe(false);
		expect(wantsSpans({ tracingEnabled: false, recordExecution: false })).toBe(false);
		expect(wantsSpans({ debugSpans: true })).toBe(true);
	});

	it("starts a trace with both sinks off, so the run is built and never stored", () => {
		const started: unknown[] = [];
		const factory: RouteTraceFactory = {
			start: (route) => {
				started.push(route);
				return { complete() {} } as never;
			},
		};
		const payload = { method: "GET", path: "/" };

		startRouteTrace({ id: "eph_1", projectId: "p", sandbox: true, debugSpans: true }, payload, factory);
		expect(started).toEqual([
			expect.objectContaining({
				routeId: "eph_1",
				tracingEnabled: false,
				recordExecution: false,
				sandbox: true,
			}),
		]);

		// nothing wants spans: no trace at all
		expect(startRouteTrace({ id: "r", projectId: "p" }, payload, factory)).toBeUndefined();
		expect(started).toHaveLength(1);
	});
});
