import { db } from "../../../../db";
import { aiChatEntity } from "../../../../db/schema";
import type { InferInsertModel } from "drizzle-orm";

type InsertAiChat = InferInsertModel<typeof aiChatEntity>;

export async function createMessage(data: InsertAiChat) {
	return (await db.insert(aiChatEntity).values(data).returning())[0];
}
