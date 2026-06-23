import { describe, test, expect, mock, jest } from "bun:test";
import * as service from "../service";
import * as repo from "../repository";

mock.module("../repository", () => ({
	getLatestAiMessage: jest.fn(),
}));

describe("get-status unit tests", () => {
	test("should return null if no latest message", async () => {
		(repo.getLatestAiMessage as any).mockResolvedValue(undefined);
		const result = await service.getLatestMessageStatus("route1", "user1");
		expect(result).toBeNull();
	});

	test("should return latest status correctly formatted", async () => {
		(repo.getLatestAiMessage as any).mockResolvedValue({
			id: "msg1",
			messageStage: 2,
			aiResponse: { plannerOutput: "ok" },
		});
		const result = await service.getLatestMessageStatus("route1", "user1");
		expect(result).toEqual({
			id: "msg1",
			messageStage: 2,
			stageData: { plannerOutput: "ok" } as any,
		});
	});
});
