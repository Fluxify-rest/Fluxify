import { describe, expect, it, mock, beforeEach } from "bun:test";
import handleRequest from "../service";
import { verifyConversationAccess } from "../middleware";
import * as repository from "../repository";
import * as serverUtils from "@fluxify/server";

mock.module("../repository", () => ({
	getMessages: mock(),
	countMessages: mock(),
	getConversation: mock(),
}));

mock.module("@fluxify/server", () => ({
	hasProjectAccess: mock(),
	ForbiddenError: class ForbiddenError extends Error {},
	NotFoundError: class NotFoundError extends Error {},
}));

describe("list_messages unit tests", () => {
	beforeEach(() => {
		mock.restore();
	});

	describe("service (handleRequest)", () => {
		const dummyConversation = {
			id: "conv-1",
			title: "Test Chat",
			createdAt: new Date(),
			updatedAt: new Date(),
		};

		it("should return empty list and correct pagination when there are no messages", async () => {
			(repository.getMessages as ReturnType<typeof mock>).mockResolvedValue([]);
			(repository.countMessages as ReturnType<typeof mock>).mockResolvedValue(0);

			const result = await handleRequest(dummyConversation, 1, 20);

			expect(result.messages).toEqual([]);
			expect(result.pagination).toEqual({
				page: 1,
				totalPages: 0,
				hasNext: false,
			});
			expect(repository.getMessages).toHaveBeenCalledWith("conv-1", 20, 0);
		});

		it("should calculate correct offset and hasNext for a middle page", async () => {
			(repository.getMessages as ReturnType<typeof mock>).mockResolvedValue([{ id: "msg-1" }]);
			(repository.countMessages as ReturnType<typeof mock>).mockResolvedValue(45);

			const result = await handleRequest(dummyConversation, 2, 20);

			expect(result.pagination).toEqual({
				page: 2,
				totalPages: 3,
				hasNext: true,
			});
			expect(repository.getMessages).toHaveBeenCalledWith("conv-1", 20, 20);
		});

		it("should calculate correct hasNext for the last page", async () => {
			(repository.getMessages as ReturnType<typeof mock>).mockResolvedValue([{ id: "msg-2" }]);
			(repository.countMessages as ReturnType<typeof mock>).mockResolvedValue(45);

			const result = await handleRequest(dummyConversation, 3, 20);

			expect(result.pagination).toEqual({
				page: 3,
				totalPages: 3,
				hasNext: false,
			});
			expect(repository.getMessages).toHaveBeenCalledWith("conv-1", 20, 40);
		});
	});

	describe("middleware (verifyConversationAccess)", () => {
		const next = mock();
		const getMockContext = (conversationId: string) => {
			const store = new Map();
			return {
				get: (key: string) => {
					if (key === "user") return { id: "user-1", isSystemAdmin: false };
					if (key === "acl") return [];
					return store.get(key);
				},
				set: (key: string, value: any) => store.set(key, value),
				req: {
					valid: () => ({ conversationId }),
				},
				_store: store,
			} as any;
		};

		it("should throw NotFoundError if conversation does not exist", async () => {
			(repository.getConversation as ReturnType<typeof mock>).mockResolvedValue(undefined);
			const c = getMockContext("conv-1");

			expect(verifyConversationAccess(c, next)).rejects.toThrow(serverUtils.NotFoundError);
			expect(next).not.toHaveBeenCalled();
		});

		it("should throw ForbiddenError if user lacks viewer access to the project", async () => {
			(repository.getConversation as ReturnType<typeof mock>).mockResolvedValue({
				id: "conv-1",
				projectId: "proj-1",
			});
			(serverUtils.hasProjectAccess as ReturnType<typeof mock>).mockReturnValue(false);
			
			const c = getMockContext("conv-1");

			expect(verifyConversationAccess(c, next)).rejects.toThrow(serverUtils.ForbiddenError);
			expect(serverUtils.hasProjectAccess).toHaveBeenCalled();
			expect(next).not.toHaveBeenCalled();
		});

		it("should set conversation in context and call next if authorized", async () => {
			const conv = { id: "conv-1", projectId: "proj-1" };
			(repository.getConversation as ReturnType<typeof mock>).mockResolvedValue(conv);
			(serverUtils.hasProjectAccess as ReturnType<typeof mock>).mockReturnValue(true);
			
			const c = getMockContext("conv-1");
			await verifyConversationAccess(c, next);

			expect(c._store.get("conversation")).toEqual(conv);
			expect(next).toHaveBeenCalled();
		});
	});
});
