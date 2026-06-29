import { describe, it, expect, spyOn, mock, afterEach } from "bun:test";
import { verifyAccessAndProject } from "../middleware";
import * as repository from "../repository";
import * as serverModule from "@fluxify/server";

describe("Create Conversation Middleware", () => {
	afterEach(() => {
		mock.restore();
	});

	const getMockContext = (query: any = {}, body: any = {}, user: any = {}, acl: any = []) => ({
		get: mock().mockImplementation((key) => {
			if (key === "user") return user;
			if (key === "acl") return acl;
		}),
		set: mock(),
		req: {
			valid: mock().mockImplementation((key) => {
				if (key === "query") return query;
				if (key === "json") return body;
			}),
		},
	});

	it("throws BadRequestError if location is canvas and routeId is missing", async () => {
		const ctx = getMockContext({ location: "canvas" }) as any;
		expect(verifyAccessAndProject(ctx, mock())).rejects.toThrow(serverModule.BadRequestError);
	});

	it("throws NotFoundError if routeId is provided but route does not exist", async () => {
		spyOn(repository, "getRouteById").mockResolvedValue(undefined as any);
		const ctx = getMockContext({ routeId: "r_1" }) as any;
		expect(verifyAccessAndProject(ctx, mock())).rejects.toThrow(serverModule.NotFoundError);
	});

	it("throws BadRequestError if no projectId is available", async () => {
		spyOn(repository, "getRouteById").mockResolvedValue({ projectId: null } as any);
		const ctx = getMockContext({ routeId: "r_1" }) as any;
		expect(verifyAccessAndProject(ctx, mock())).rejects.toThrow(serverModule.BadRequestError);
	});

	it("throws ForbiddenError if user lacks creator access", async () => {
		spyOn(repository, "getRouteById").mockResolvedValue({ projectId: "p_1" } as any);
		spyOn(serverModule, "hasProjectAccess").mockReturnValue(false);

		const ctx = getMockContext({ routeId: "r_1" }) as any;
		expect(verifyAccessAndProject(ctx, mock())).rejects.toThrow(serverModule.ForbiddenError);
	});

	it("calls next and sets projectId on success", async () => {
		spyOn(repository, "getRouteById").mockResolvedValue({ projectId: "p_1" } as any);
		spyOn(serverModule, "hasProjectAccess").mockReturnValue(true);

		const ctx = getMockContext({ routeId: "r_1" }) as any;
		const next = mock();

		await verifyAccessAndProject(ctx, next);
		expect(ctx.set).toHaveBeenCalledWith("projectId", "p_1");
		expect(next).toHaveBeenCalled();
	});
});
