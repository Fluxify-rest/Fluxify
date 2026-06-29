import { describe, it, expect, spyOn, mock, afterEach } from "bun:test";
import { verifyAccessAndProject } from "../middleware";
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
			valid: mock().mockImplementation((key) => {
				if (key === "param") return param;
			}),
		},
	});

	it("throws ForbiddenError if user lacks viewer access", async () => {
		spyOn(serverModule, "hasProjectAccess").mockReturnValue(false);

		const ctx = getMockContext({ projectId: "p_1" }) as any;
		expect(verifyAccessAndProject(ctx, mock())).rejects.toThrow(serverModule.ForbiddenError);
	});

	it("calls next on success", async () => {
		spyOn(serverModule, "hasProjectAccess").mockReturnValue(true);

		const ctx = getMockContext({ projectId: "p_1" }) as any;
		const next = mock();

		await verifyAccessAndProject(ctx, next);
		expect(next).toHaveBeenCalled();
	});
});
