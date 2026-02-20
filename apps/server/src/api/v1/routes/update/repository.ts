import { createUpdateSchema } from "drizzle-zod";
import { HttpMethod, routesEntity } from "../../../../db/schema";
import z from "zod";
import { db, DbTransactionType } from "../../../../db";
import { and, eq, or } from "drizzle-orm";

const updateRouteSchema = createUpdateSchema(routesEntity);

export async function updateRoute(
  data: z.infer<typeof updateRouteSchema>,
  tx?: DbTransactionType,
) {
  const id = data.id!;
  delete data.id;
  const result = await (tx ?? db)
    .update(routesEntity)
    .set(data)
    .where(eq(routesEntity.id, id))
    .returning();
  return result.length > 0 ? result[0] : null;
}

export async function getRouteByNameOrPath(
  id: string,
  name: string,
  path: string,
  method: HttpMethod,
  tx?: DbTransactionType,
) {
  const result = await (tx ?? db)
    .select()
    .from(routesEntity)
    .where(
      or(
        eq(routesEntity.id, id),
        eq(routesEntity.name, name),
        and(eq(routesEntity.path, path), eq(routesEntity.method, method)),
      ),
    )
    .limit(1);
  return result.length > 0 ? result[0] : null;
}
