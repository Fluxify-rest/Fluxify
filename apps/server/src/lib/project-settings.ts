import { eq, and } from "drizzle-orm";
import { db } from "../db";
import { projectSettingsEntity } from "../db/schema";
import type { ProjectSettingsKeyType } from "../api/v1/projects/settings/keys/keySchemaMap";
import {
	CHAN_ON_PROJECT_SETTING_CHANGE,
	deleteCacheKey,
	getCache,
	publishMessage,
} from "../db/redis";

export function constructProjectSettingCacheKey(projectId: string) {
	return `PROJECT-SETTINGS-${projectId}`;
}

export async function getProjectSetting(
	projectId: string,
	keyName: ProjectSettingsKeyType,
): Promise<string> {
	// 1. Try cache first
	const cacheKey = constructProjectSettingCacheKey(projectId);
	const cached = await getCache(cacheKey);

	if (cached !== null) {
		try {
			const settings = JSON.parse(cached) as Record<string, string>;
			return settings[keyName] || "";
		} catch {
			// ignore parse error and fetch fresh
		}
	}

	const result = await db
		.select({ value: projectSettingsEntity.value })
		.from(projectSettingsEntity)
		.where(
			and(
				eq(projectSettingsEntity.projectId, projectId),
				eq(projectSettingsEntity.key, keyName),
			),
		)
		.limit(1);

	return result.length > 0 ? result[0].value : "";
}

export async function setProjectSetting(
	projectId: string,
	keyName: ProjectSettingsKeyType,
	value: string,
): Promise<void> {
	const existing = await db
		.select({ id: projectSettingsEntity.id })
		.from(projectSettingsEntity)
		.where(
			and(
				eq(projectSettingsEntity.projectId, projectId),
				eq(projectSettingsEntity.key, keyName),
			),
		)
		.limit(1);

	if (existing.length > 0) {
		await db
			.update(projectSettingsEntity)
			.set({ value })
			.where(eq(projectSettingsEntity.id, existing[0].id));
	} else {
		await db.insert(projectSettingsEntity).values({
			projectId,
			key: keyName,
			value,
		});
	}

	// Clear the cache so it gets reloaded on next read
	const cacheKey = constructProjectSettingCacheKey(projectId);
	await Promise.all([
		deleteCacheKey(cacheKey),
		publishMessage(CHAN_ON_PROJECT_SETTING_CHANGE, "{}"),
	]);
}

export async function getAllProjectSettings() {
	const settingsData = await db
		.select({
			projectId: projectSettingsEntity.projectId,
			key: projectSettingsEntity.key,
			value: projectSettingsEntity.value,
		})
		.from(projectSettingsEntity);

	const settings: Record<string, Record<string, string>> = {};
	for (const setting of settingsData) {
		if (!setting.projectId) continue;
		if (!settings[setting.projectId]) {
			settings[setting.projectId] = {};
		}
		settings[setting.projectId][setting.key] = setting.value;
	}
	return settings;
}
