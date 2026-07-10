import { createInsertSchema } from "drizzle-zod";
import { db, DbTransactionType } from "../../../../db";
import { customBlockGraphsEntity, customBlocksListEntity } from "../../../../db/schema";
import z from "zod";
import { and, eq, inArray, sql } from "drizzle-orm";

const insertGraphsSchema = createInsertSchema(customBlockGraphsEntity);

export async function upsertGraphs(
  blocks: z.infer<typeof insertGraphsSchema>[],
  tx?: DbTransactionType,
) {
  if (!blocks.length) return;
  await (tx ?? db)
    .insert(customBlockGraphsEntity)
    .values(blocks)
    .onConflictDoUpdate({
      target: customBlockGraphsEntity.id,
      set: {
        type: sql`excluded.type`,
        data: sql`excluded.data`,
        customBlockId: sql`excluded.custom_block_id`,
      },
    });
}

export async function deleteGraphs(ids: string[], tx?: DbTransactionType) {
  if (!ids.length) return;
  await (tx ?? db)
    .delete(customBlockGraphsEntity)
    .where(inArray(customBlockGraphsEntity.id, ids));
}

export async function setUpdatedAtTimeForCustomBlock(
  id: string,
  tx?: DbTransactionType,
) {
  await (tx ?? db)
    .update(customBlocksListEntity)
    .set({ updatedAt: sql`now()` })
    .where(eq(customBlocksListEntity.id, id));
}

export async function customBlockExist(
  id: string,
  projectIds: string[] = [],
  tx?: DbTransactionType,
) {
  const isSystemAdmin = projectIds.some((id) => id === "*");
  const item = await (tx ?? db)
    .select({
      id: customBlocksListEntity.id,
    })
    .from(customBlocksListEntity)
    .where(
      and(
        eq(customBlocksListEntity.id, id),
        isSystemAdmin ? undefined : inArray(customBlocksListEntity.projectId, projectIds),
      ),
    )
    .limit(1);
  return item.length > 0;
}
