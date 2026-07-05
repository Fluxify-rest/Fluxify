import {
  CHAN_ON_INTEGRATION_CHANGE,
  publishMessage,
} from "../../../../db/redis";
import { NotFoundError } from "../../../../errors/notFoundError";
import { deleteIntegration } from "./repository";

export default async function handleRequest(projectId: string, id: string) {
  const deletedCount = await deleteIntegration(projectId, id);
  if (deletedCount === 0) {
    throw new NotFoundError("Integration not found");
  }
  await publishMessage(CHAN_ON_INTEGRATION_CHANGE, "");
}
