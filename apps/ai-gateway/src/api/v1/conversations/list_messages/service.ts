import { getMessages, countMessages } from "./repository";
import { getCache, setCacheEx } from "@fluxify/server";

type ConversationParams = {
	id: string;
	title: string | null;
	createdAt: Date;
	updatedAt: Date;
};

export default async function handleRequest(
	conversation: ConversationParams,
	page: number,
	perPage: number,
) {
	const cacheKey = `conversations:list_messages:${conversation.id}:${page}:${perPage}`;
	const cached = await getCache(cacheKey);
	if (cached) return JSON.parse(cached);

	const offset = (page - 1) * perPage;
	const [messages, totalCount] = await Promise.all([
		getMessages(conversation.id, perPage, offset),
		countMessages(conversation.id),
	]);

	const totalPages = Math.ceil(totalCount / perPage);
	messages.reverse();
	const result = {
		conversation: {
			title: conversation.title,
			createdAt: conversation.createdAt,
			updatedAt: conversation.updatedAt,
		},
		messages: messages,
		pagination: {
			page,
			totalPages,
			hasNext: page < totalPages,
		},
	};

	await setCacheEx(cacheKey, JSON.stringify(result), 120);
	return result;
}
