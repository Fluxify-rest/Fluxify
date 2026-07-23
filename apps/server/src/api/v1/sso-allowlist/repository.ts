import { eq } from "drizzle-orm";
import { db } from "../../../db";
import { ssoAllowlistEntity } from "../../../db/schema";

export async function addAllowlistEmail(email: string) {
	const normalized = email.toLowerCase();
	await db
		.insert(ssoAllowlistEntity)
		.values({ email: normalized })
		.onConflictDoNothing({ target: ssoAllowlistEntity.email });
	const [row] = await db
		.select()
		.from(ssoAllowlistEntity)
		.where(eq(ssoAllowlistEntity.email, normalized));
	return row;
}

export async function listAllowlist() {
	return db.select().from(ssoAllowlistEntity);
}

export async function deleteAllowlistById(id: string) {
	const [row] = await db
		.delete(ssoAllowlistEntity)
		.where(eq(ssoAllowlistEntity.id, id))
		.returning();
	return row ?? null;
}
