import { db, DbTransactionType } from "../../../../db";
import { customBlocksListEntity } from "../../../../db/schema";
import { eq, and } from "drizzle-orm";
import { createUpdateSchema } from "drizzle-zod";
import z from "zod";

const updateSchema = createUpdateSchema(customBlocksListEntity).omit({ id: true, projectId: true });

export async function getCustomBlockById(id: string, tx?: DbTransactionType) {
  const block = await (tx ?? db)
    .select()
    .from(customBlocksListEntity)
    .where(eq(customBlocksListEntity.id, id))
    .limit(1);
  return block[0];
}

export async function checkCustomBlockNameExist(
  projectId: string,
  name: string,
  excludeId: string,
  tx?: DbTransactionType
) {
  const exist = await (tx ?? db)
    .select({ id: customBlocksListEntity.id })
    .from(customBlocksListEntity)
    .where(
      and(
        eq(customBlocksListEntity.projectId, projectId),
        eq(customBlocksListEntity.name, name)
      )
    );
  return exist.filter(e => e.id !== excludeId).length > 0;
}

export async function updateCustomBlock(
  id: string,
  data: z.infer<typeof updateSchema>,
  tx?: DbTransactionType
) {
  const updated = await (tx ?? db)
    .update(customBlocksListEntity)
    .set(data)
    .where(eq(customBlocksListEntity.id, id))
    .returning();
  return updated[0];
}
