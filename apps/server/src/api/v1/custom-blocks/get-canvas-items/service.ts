import z from "zod";
import { responseSchema } from "./dto";
import { getCustomBlockGraphs, getCustomBlockById } from "./repository";
import { NotFoundError } from "../../../../errors/notFoundError";
import { ForbiddenError } from "../../../../errors/forbidError";
import { AuthACL } from "../../../../db/schema";
import { hasProjectAccess } from "../../../auth/common";
import { User } from "better-auth";

export default async function handleRequest(
  id: string,
  user: User & { isSystemAdmin: boolean },
  acl: AuthACL[]
): Promise<z.infer<typeof responseSchema>> {
  const block = await getCustomBlockById(id);
  if (!block) {
    throw new NotFoundError("Custom block not found");
  }
  if (!hasProjectAccess(user, acl, block.projectId!, "viewer")) {
    throw new ForbiddenError();
  }

  const rawBlocks = await getCustomBlockGraphs(id);

  const blocks: any[] = [];
  const edges: any[] = [];

  rawBlocks.forEach((b) => {
    const { connections, ...dataRest } = (b.data as any) || {};

    blocks.push({
      id: b.id,
      type: b.type,
      data: dataRest,
      position: dataRest.position || { x: 0, y: 0 },
    });

    if (Array.isArray(connections)) {
      connections.forEach((conn: any) => {
        edges.push({
          id: conn.id,
          from: b.id,
          to: conn.to,
          fromHandle: conn.fromHandle,
          toHandle: conn.toHandle,
        });
      });
    }
  });

  return { blocks, edges };
}
