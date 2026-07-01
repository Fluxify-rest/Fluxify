import { describe, it, expect, spyOn, mock, afterEach } from "bun:test";
import { verifyProjectConversationsAccess } from "../../middleware";
import * as serverModule from "@fluxify/server";

describe("List Conversations Middleware", () => {
	afterEach(() => {
		mock.restore();
	});

	const getMockContext = (param: any = {}, user: any = {}, acl: any = []) => ({
		get: mock().mockImplementation((key) => {
			if (key === "user") return user;
			if (key === "acl") return acl;
		}),
		req: {
			param: mock().mockImplementation((key) => {
				if (key === "projectId") return param.projectId;
			}),
		},
	});

	it("throws ForbiddenError if user lacks viewer access", async () => {
		spyOn(serverModule, "hasProjectAccess").mockReturnValue(false);

		const ctx = getMockContext({ projectId: "p_1" }) as any;
		expect(verifyProjectConversationsAccess(ctx, mock())).rejects.toThrow(serverModule.ForbiddenError);
	});

	it("calls next on success", async () => {
		spyOn(serverModule, "hasProjectAccess").mockReturnValue(true);

		const ctx = getMockContext({ projectId: "p_1" }) as any;
		const next = mock();

		await verifyProjectConversationsAccess(ctx, next);
		expect(next).toHaveBeenCalled();
	});
});
