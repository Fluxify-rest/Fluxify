import { eq, inArray, isNull, or } from "drizzle-orm";
import { type DbTransactionType, db } from "../../../db";
import { deleteArtifact, putArtifact } from "../../../db/natsKv";
import { sandboxesEntity, triggersEntity } from "../../../db/schema";
import { BadRequestError } from "../../../errors/badRequestError";
import { ConflictError } from "../../../errors/conflictError";
import { NotFoundError } from "../../../errors/notFoundError";
import type { TriggerArtifact } from "../../../modules/compiler/artifacts";
import { findSandbox } from "../sandboxes/repository";

/**
 * Triggers on a sandbox (#735). A sandbox is its owner's alone, so is a trigger
 * that runs one: anyone else gets a 404 for it, as for the sandbox. It runs on
 * development workers only, with development values.
 */

/** The owner's sandbox in this project, or a 404, as the sandbox routes answer. */
export async function assertOwnSandbox(
	projectId: string,
	sandboxId: string,
	userId: string,
	tx?: DbTransactionType,
) {
	const sandbox = await findSandbox(sandboxId, tx);
	if (!sandbox || sandbox.projectId !== projectId || sandbox.userId !== userId)
		throw new NotFoundError("Sandbox not found");
	return sandbox;
}

/** A trigger attached to someone else's sandbox does not exist, as far as the caller knows. */
export async function assertCanSeeTrigger(
	trigger: { projectId: string; sandboxId: string | null },
	userId: string,
	tx?: DbTransactionType,
) {
	if (!trigger.sandboxId) return;
	await assertOwnSandbox(trigger.projectId, trigger.sandboxId, userId, tx).catch(() => {
		throw new NotFoundError("Trigger not found");
	});
}

/**
 * Schedules fire through production's broker, which never holds a sandbox.
 * Refused rather than saved as a trigger that silently never fires.
 */
export function assertSandboxCanRun(type: string) {
	if (type === "schedule")
		throw new BadRequestError("A schedule cannot start a sandbox. Use Run, or a queue trigger");
}

export const ONE_TARGET =
	"A trigger starts one workflow or one sandbox. Detach it there first, or create a new trigger";

/**
 * A patch may move a trigger onto the caller's own sandbox, never onto two
 * targets at once: the row's check would refuse it as a 500 otherwise.
 */
export async function assertPatchTarget(
	existing: {
		type: string;
		projectId: string;
		workflowId: string | null;
		sandboxId: string | null;
	},
	data: { workflowId?: string | null; sandboxId?: string | null },
	userId: string,
	tx?: DbTransactionType,
) {
	const workflowId = data.workflowId === undefined ? existing.workflowId : data.workflowId;
	const sandboxId = data.sandboxId === undefined ? existing.sandboxId : data.sandboxId;
	if (workflowId && sandboxId) throw new ConflictError(ONE_TARGET);
	if (!data.sandboxId) return;
	assertSandboxCanRun(existing.type);
	await assertOwnSandbox(existing.projectId, data.sandboxId, userId, tx);
}

/** Triggers on nobody's sandbox, or on the caller's own. */
export function visibleTo(userId: string) {
	return or(
		isNull(triggersEntity.sandboxId),
		inArray(
			triggersEntity.sandboxId,
			db
				.select({ id: sandboxesEntity.id })
				.from(sandboxesEntity)
				.where(eq(sandboxesEntity.userId, userId)),
		),
	);
}

/**
 * Development only: a production worker never holds the sandbox, so it must
 * never hold its trigger either. Production's copy is dropped in case the
 * trigger used to start a workflow.
 */
export async function publishSandboxTrigger(key: string, artifact: TriggerArtifact) {
	await deleteArtifact(key, "production");
	await putArtifact(key, artifact, "development");
}
