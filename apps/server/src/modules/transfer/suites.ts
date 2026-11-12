import { generateID } from "@fluxify/lib";
import { eq, inArray } from "drizzle-orm";
import { z } from "zod";
import { createTestSuite } from "../../api/v1/test-suites/create/repository";
import {
	assertionSchema,
	blockHookSchema,
	suiteInputSchema,
} from "../../api/v1/test-suites/schema";
import { type DbTransactionType, db } from "../../db";
import {
	customBlocksListEntity,
	integrationsEntity,
	testSuiteBlockHooksEntity,
	testSuitesEntity,
} from "../../db/schema";
import { BadRequestError } from "../../errors/badRequestError";
import { CONTENT_TYPES } from "../../lib/routeConfig";
import { replaceSuiteHooks } from "../testRunner/hooks";
import { idsByName, namesOf } from "./names";

export const bundleSuiteSchema = z.object({
	name: z.string().min(1),
	description: z.string().nullish(),
	/** off keeps the suite out of "Run all" and the promote tests gate; files without it are on */
	enabled: z.boolean().default(true),
	headers: z.record(z.string(), z.string()).default({}),
	params: z.record(z.string(), z.string()).default({}),
	queryParams: z.record(z.string(), z.string()).default({}),
	routeParams: z.record(z.string(), z.string()).default({}),
	contentType: z.enum(CONTENT_TYPES).nullish(),
	body: z.unknown().optional(),
	/** workflow suites: what feeds the workflow. The loader is a custom block *name* */
	input: z
		.object({
			source: z.enum(["raw", "script", "loader"]),
			mode: z.enum(["single", "cases"]),
			raw: z.unknown().optional(),
			script: z.string().optional(),
			loaderBlock: z.string().nullish(),
			timeoutMs: z.number().int().optional(),
		})
		.nullish(),
	assertions: z.array(assertionSchema).default([]),
	/** integration names: the one a route uses, and the one the suite swaps in */
	integrationOverrides: z
		.array(z.object({ existing: z.string(), replacement: z.string() }))
		.default([]),
	/** keys only: the values can be secrets and are never exported */
	appConfigOverrideKeys: z.array(z.string()).default([]),
	/** custom block names */
	setupBlock: z.string().nullish(),
	teardownBlock: z.string().nullish(),
	setupTimeoutMs: z.number().int().default(30_000),
	teardownTimeoutMs: z.number().int().default(30_000),
	runAlone: z.boolean().default(false),
	/** `blockId` is a block id of this bundle's canvas */
	hooks: z.array(blockHookSchema).default([]),
});

export type BundleSuite = z.infer<typeof bundleSuiteSchema>;
export type SuiteOwner = { routeId: string } | { workflowId: string };

export async function exportSuites(owner: SuiteOwner): Promise<BundleSuite[]> {
	const suites = await db
		.select()
		.from(testSuitesEntity)
		.where(
			"routeId" in owner
				? eq(testSuitesEntity.routeId, owner.routeId)
				: eq(testSuitesEntity.workflowId, owner.workflowId),
		)
		.orderBy(testSuitesEntity.createdAt);
	if (suites.length === 0) return [];

	const hooks = await db
		.select()
		.from(testSuiteBlockHooksEntity)
		.where(
			inArray(
				testSuiteBlockHooksEntity.suiteId,
				suites.map((s) => s.id),
			),
		);
	const blockNames = await namesOf(
		customBlocksListEntity,
		suites
			.flatMap((s) => [s.setupBlockId, s.teardownBlockId, s.input?.loaderBlockId])
			.filter((id): id is string => !!id),
	);
	const integrationNames = await namesOf(
		integrationsEntity,
		suites.flatMap((s) => (s.integrationOverrides ?? []).flatMap((o) => [o.existingId, o.newId])),
	);

	return suites.map((s) => {
		const { loaderBlockId, ...input } = s.input ?? {};
		return {
			name: s.name,
			description: s.description,
			enabled: s.enabled,
			headers: s.headers ?? {},
			params: s.params ?? {},
			queryParams: s.queryParams ?? {},
			routeParams: s.routeParams ?? {},
			contentType: s.contentType as BundleSuite["contentType"],
			body: s.body ?? undefined,
			input: s.input
				? {
						...(input as Omit<NonNullable<typeof s.input>, "loaderBlockId">),
						loaderBlock: loaderBlockId ? (blockNames.get(loaderBlockId) ?? null) : null,
					}
				: null,
			assertions: s.assertions,
			integrationOverrides: (s.integrationOverrides ?? []).flatMap((o) => {
				const existing = integrationNames.get(o.existingId);
				const replacement = integrationNames.get(o.newId);
				return existing && replacement ? [{ existing, replacement }] : [];
			}),
			appConfigOverrideKeys: (s.appConfigOverrides ?? []).map((o) => o.key),
			setupBlock: s.setupBlockId ? (blockNames.get(s.setupBlockId) ?? null) : null,
			teardownBlock: s.teardownBlockId ? (blockNames.get(s.teardownBlockId) ?? null) : null,
			setupTimeoutMs: s.setupTimeoutMs,
			teardownTimeoutMs: s.teardownTimeoutMs,
			runAlone: s.runAlone,
			hooks: hooks
				.filter((h) => h.suiteId === s.id)
				.map((h) => ({ blockId: h.blockId, onBefore: h.onBefore, onAfter: h.onAfter })),
		};
	});
}

type ImportContext = {
	projectId: string;
	/** old block id → new block id of the imported canvas */
	blockIds: Map<string, string>;
	warnings: string[];
	/** "route" or "workflow", for error messages */
	label: string;
};

/**
 * Creates the suites on `owner`. Custom blocks and integrations are matched to
 * the project's by name; what has no match is dropped and reported in `warnings`.
 */
export async function importSuites(
	owner: SuiteOwner,
	suites: BundleSuite[],
	{ projectId, blockIds, warnings, label }: ImportContext,
	tx: DbTransactionType,
): Promise<void> {
	if (suites.length === 0) return;
	const names = (pick: (s: BundleSuite) => (string | null | undefined)[]) =>
		suites.flatMap(pick).filter((n): n is string => !!n);
	const [customBlocks, integrations] = await Promise.all([
		idsByName(
			customBlocksListEntity,
			projectId,
			names((s) => [s.setupBlock, s.teardownBlock, s.input?.loaderBlock]),
		),
		idsByName(
			integrationsEntity,
			projectId,
			names((s) => s.integrationOverrides.flatMap((o) => [o.existing, o.replacement])),
		),
	]);
	const newId = (id: string) => blockIds.get(id) ?? id;

	for (const [i, suite] of suites.entries()) {
		const {
			hooks,
			integrationOverrides,
			appConfigOverrideKeys,
			setupBlock,
			teardownBlock,
			input,
			...fields
		} = suite;
		const blockOf = (name: string | null | undefined, role: string) => {
			if (!name) return null;
			const found = customBlocks.get(name);
			if (!found)
				warnings.push(
					`Test "${suite.name}": ${role} block "${name}" doesn't exist here and was dropped.`,
				);
			return found ?? null;
		};

		let suiteInput: z.infer<typeof suiteInputSchema> | null = null;
		if (input) {
			const { loaderBlock, ...rest } = input;
			const parsed = suiteInputSchema.safeParse({
				...rest,
				loaderBlockId: blockOf(loaderBlock, "loader"),
			});
			if (!parsed.success) {
				throw new BadRequestError(
					`This ${label} export is invalid: suites.${i}.input ${parsed.error.issues[0]!.message}`,
				);
			}
			suiteInput = parsed.data;
		}

		const suiteId = generateID();
		await createTestSuite(
			{
				...fields,
				...owner,
				id: suiteId,
				input: suiteInput,
				setupBlockId: blockOf(setupBlock, "setup"),
				teardownBlockId: blockOf(teardownBlock, "teardown"),
				integrationOverrides: integrationOverrides.flatMap((o) => {
					const existingId = integrations.get(o.existing);
					const replacementId = integrations.get(o.replacement);
					if (existingId && replacementId) return [{ existingId, newId: replacementId }];
					warnings.push(
						`Test "${suite.name}": integration override ${o.existing} → ${o.replacement} was dropped.`,
					);
					return [];
				}),
				// values are never exported, so there is nothing to restore but the names
				appConfigOverrides: [],
			},
			tx,
		);
		if (appConfigOverrideKeys.length) {
			warnings.push(
				`Test "${suite.name}": set the values of the app config overrides ${appConfigOverrideKeys.join(", ")}.`,
			);
		}
		// ponytail: hooks are not re-run through validateHooks (it reads outside this transaction); the exporting server already validated them
		const remapped = hooks.flatMap((h) =>
			blockIds.has(h.blockId) ? [{ ...h, blockId: newId(h.blockId) }] : [],
		);
		if (remapped.length < hooks.length) {
			warnings.push(
				`Test "${suite.name}": ${hooks.length - remapped.length} block hook(s) had no block and were dropped.`,
			);
		}
		await replaceSuiteHooks(suiteId, remapped, tx);
	}
}
