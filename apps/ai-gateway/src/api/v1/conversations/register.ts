import type { Hono } from "hono";
import listConversations from "./list/route";
import createConversation from "./create/route";
import listMessages from "./list_messages/route";

export function registerConversationRoutes(app: Hono) {
	const subRoute = app.basePath("/conversations");
	listConversations(subRoute);
	createConversation(subRoute);
	listMessages(subRoute);
}
