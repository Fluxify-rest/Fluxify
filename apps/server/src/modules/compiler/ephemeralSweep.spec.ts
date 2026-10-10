import { afterEach, describe, expect, it, spyOn } from "bun:test";
import * as natsKv from "../../db/natsKv";
import { sweepEphemeralArtifacts } from "./ephemeralSweep";

const NOW = Date.parse("2026-10-11T12:00:00Z");
const ago = (ms: number) => ({ compiledAt: new Date(NOW - ms).toISOString() });

function bucket(entries: Record<string, unknown>) {
	const deleted: string[] = [];
	spyOn(natsKv, "artifactStore").mockResolvedValue({
		keys: async () => Object.keys(entries),
		get: async (key: string) => entries[key] ?? null,
		delete: async (key: string) => void deleted.push(key),
	} as never);
	return deleted;
}

afterEach(() => spyOn(natsKv, "artifactStore").mockRestore());

describe("sweeping leftover ephemeral artifacts", () => {
	it("deletes an ephemeral key over an hour old, and only that", async () => {
		const deleted = bucket({
			"sandbox.p.eph_old": ago(2 * 60 * 60_000),
			"sandbox.p.eph_live": ago(5_000),
			"sandbox.p.real_sandbox_id": ago(30 * 24 * 60 * 60_000),
		});

		expect(await sweepEphemeralArtifacts(NOW)).toBe(1);
		expect(deleted).toEqual(["sandbox.p.eph_old"]);
	});

	it("deletes an ephemeral key with no readable time", async () => {
		const deleted = bucket({ "sandbox.p.eph_odd": {} });
		await sweepEphemeralArtifacts(NOW);
		expect(deleted).toEqual(["sandbox.p.eph_odd"]);
	});
});
