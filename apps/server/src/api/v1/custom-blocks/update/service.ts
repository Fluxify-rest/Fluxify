import z from "zod";
import { requestBodySchema, responseSchema } from "./dto";
import { db } from "../../../../db";
import { getCustomBlockById, updateCustomBlock, checkCustomBlockNameExist } from "./repository";
import { NotFoundError } from "../../../../errors/notFoundError";
import { ConflictError } from "../../../../errors/conflictError";
import { ForbiddenError } from "../../../../errors/forbidError";
import { ServerError } from "../../../../errors/serverError";
import { hasProjectAccess } from "../../../auth/common";
import { AuthACL } from "../../../../db/schema";
import { User } from "better-auth";

export default async function handleRequest(
  id: string,
  data: z.infer<typeof requestBodySchema>,
  user: (User & { isSystemAdmin: boolean }),
  acl: AuthACL[]
): Promise<z.infer<typeof responseSchema>> {
  const result = await db.transaction(async (tx) => {
    const existingBlock = await getCustomBlockById(id, tx);
    if (!existingBlock) {
      throw new NotFoundError("Custom block not found");
    }

    if (!hasProjectAccess(user, acl, existingBlock.projectId!, "creator")) {
      throw new ForbiddenError();
    }

    if (data.name) {
      const nameConflict = await checkCustomBlockNameExist(
        existingBlock.projectId!,
        data.name,
        id,
        tx
      );
      if (nameConflict) {
        throw new ConflictError("Custom block with this name already exists in project");
      }
    }

    const updated = await updateCustomBlock(id, data, tx);
    if (!updated) {
      throw new ServerError("Failed to update custom block");
    }
    return updated;
  });

  return {
    id: result.id,
  };
}
