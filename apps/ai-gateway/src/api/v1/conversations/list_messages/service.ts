import { getMessages, countMessages } from "./repository";

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
	const offset = (page - 1) * perPage;
	const [messages, totalCount] = await Promise.all([
		getMessages(conversation.id, perPage, offset),
		countMessages(conversation.id),
	]);

	const totalPages = Math.ceil(totalCount / perPage);

	return {
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
}
