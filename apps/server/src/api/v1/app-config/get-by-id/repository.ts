import { and, eq } from "drizzle-orm";
import { db, DbTransactionType } from "../../../../db";
import { appConfigEntity } from "../../../../db/schema";

export async function getAppConfigById(
  id: number,
  projectId: string,
  tx?: DbTransactionType
) {
  const result = await (tx ?? db)
    .select()
    .from(appConfigEntity)
    .where(
      and(
        eq(appConfigEntity.id, id),
        eq(appConfigEntity.projectId, projectId)
      )
    )
    .limit(1);

  if (!result[0]) {
    return null;
  }

  return result[0];
}
