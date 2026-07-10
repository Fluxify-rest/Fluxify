import { eq } from "drizzle-orm";
import { db, DbTransactionType } from "../../../../db";
import { customBlockGraphsEntity, customBlocksListEntity } from "../../../../db/schema";

export async function getCustomBlockGraphs(customBlockId: string, tx?: DbTransactionType) {
  const blocks = await (tx ?? db)
    .select({
      id: customBlockGraphsEntity.id,
      type: customBlockGraphsEntity.type,
      data: customBlockGraphsEntity.data,
    })
    .from(customBlockGraphsEntity)
    .where(eq(customBlockGraphsEntity.customBlockId, customBlockId));
  return blocks;
}

export async function getCustomBlockById(id: string, tx?: DbTransactionType) {
  const block = await (tx ?? db)
    .select({
      projectId: customBlocksListEntity.projectId,
    })
    .from(customBlocksListEntity)
    .where(eq(customBlocksListEntity.id, id))
    .limit(1);
  return block.length > 0 ? block[0] : null;
}
