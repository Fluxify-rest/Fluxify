import { describe, test, expect, mock, jest, spyOn } from "bun:test";
import * as service from "../service";
import * as repo from "../repository";

mock.module("../repository", () => ({
	getMessages: jest.fn(),
}));

describe("get-all unit tests", () => {
	test("should call repo and return messages", async () => {
		const mockMessages = [{ id: "1" }, { id: "2" }];
		(repo.getMessages as any).mockResolvedValue(mockMessages);

		const result = await service.getMessages("route1", "user1", 0, 10);
		expect(repo.getMessages).toHaveBeenCalledWith("route1", "user1", 0, 10);
		expect(result).toEqual(mockMessages as any);
	});
});
