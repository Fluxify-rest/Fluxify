import { getConversationsByProjectId } from "./repository";
import z from "zod";
import { aiConversationLocationEnum } from "@fluxify/server";

export default async function handleRequest(
	projectId: string,
	userId: string,
	location?: z.infer<typeof aiConversationLocationEnum>,
) {
	const conversations = await getConversationsByProjectId(
		projectId,
		userId,
		location,
	);

	return conversations;
}
