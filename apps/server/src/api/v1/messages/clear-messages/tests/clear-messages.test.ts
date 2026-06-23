import { describe, test, expect, mock, jest } from "bun:test";
import * as service from "../service";
import * as repo from "../repository";

mock.module("../repository", () => ({
	deleteMessages: jest.fn(),
}));

describe("delete unit test", () => {
	test("should call repo delete tool", async () => {
		(repo.deleteMessages as any).mockResolvedValue(true);
		const result = await service.deleteMessages("route1", "user1");

		expect(repo.deleteMessages).toHaveBeenCalledWith("route1", "user1");
		expect(result).toEqual({ success: true });
	});
});
