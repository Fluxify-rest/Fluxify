import { describeRoute, resolver, validator } from "hono-openapi";
import { HonoServer } from "../../../types";
import { requireSystemAdmin } from "../../auth/middleware";
import zodErrorCallbackParser from "../../../middlewares/zodErrorCallbackParser";
import { addBodySchema, allowlistItemSchema } from "./dto";
import {
	addAllowlistEmail,
	deleteAllowlistById,
	listAllowlist,
} from "./repository";
import { NotFoundError } from "../../../errors/notFoundError";
import z from "zod";

export default {
	name: "sso-allowlist",
	registerHandler(app: HonoServer) {
		const router = app.basePath("/sso-allowlist");

		router.get(
			"/",
			describeRoute({
				operationId: "list-sso-allowlist",
				description: "List SSO allowlist entries",
				tags: ["SSO Allowlist"],
				responses: {
					200: {
						description: "Successful",
						content: {
							"application/json": {
								schema: resolver(z.array(allowlistItemSchema)),
							},
						},
					},
				},
			}),
			requireSystemAdmin,
			async (c) => c.json(await listAllowlist()),
		);

		router.post(
			"/",
			describeRoute({
				operationId: "add-sso-allowlist",
				description: "Add an email to the SSO allowlist",
				tags: ["SSO Allowlist"],
				responses: {
					200: {
						description: "Successful",
						content: {
							"application/json": {
								schema: resolver(allowlistItemSchema),
							},
						},
					},
				},
			}),
			requireSystemAdmin,
			validator("json", addBodySchema, zodErrorCallbackParser),
			async (c) => {
				const { email } = c.req.valid("json");
				return c.json(await addAllowlistEmail(email));
			},
		);

		router.delete(
			"/:id",
			describeRoute({
				operationId: "delete-sso-allowlist",
				description: "Remove an email from the SSO allowlist",
				tags: ["SSO Allowlist"],
				responses: {
					200: {
						description: "Successful",
						content: {
							"application/json": {
								schema: resolver(z.object({ id: z.string() })),
							},
						},
					},
				},
			}),
			requireSystemAdmin,
			async (c) => {
				const row = await deleteAllowlistById(c.req.param("id"));
				if (!row) throw new NotFoundError("Allowlist entry not found");
				return c.json({ id: row.id });
			},
		);
	},
};
