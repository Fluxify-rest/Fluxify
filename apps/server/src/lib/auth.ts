import { betterAuth } from "better-auth";
import { DB, drizzleAdapter } from "better-auth/adapters/drizzle";
import { deleteCacheKey, getCache, setCache, setCacheEx } from "../db/redis";
import { accessControlEntity, ssoAllowlistEntity } from "../db/schema";
import { eq } from "drizzle-orm";
import { customSession } from "better-auth/plugins";
import * as authSchemas from "../db/auth-schema";
import { admin } from "better-auth/plugins";
import { sso } from "@better-auth/sso";
import { generateID } from "@fluxify/lib";
import { getSetting } from "../loaders/instanceSettingsLoader";

export let auth: ReturnType<typeof initializeAuth> = null!;

function trustedOrigins() {
	const origins = process.env.TRUSTED_ORIGINS?.split(",").map((o) =>
		o.trim(),
	) ?? [process.env.SERVER_URL!];
	// The configured SSO issuer is inherently trusted (an admin set it); the SSO
	// plugin validates the OIDC discovery endpoint against trustedOrigins, so add
	// the issuer/discovery origin here to allow the discovery fetch.
	const sso = getSetting("sso_config");
	for (const url of [sso?.issuer, sso?.discoveryEndpoint]) {
		if (!url) continue;
		try {
			origins.push(new URL(url).origin);
		} catch {
			/* ignore malformed url */
		}
	}
	return [...new Set(origins)];
}

// Build a single inline SSO provider from instance_settings.sso_config.
// Precedence over any DB providers; we never create the ssoProvider table.
function ssoDefaults(): NonNullable<Parameters<typeof sso>[0]>["defaultSSO"] {
	const cfg = getSetting("sso_config");
	if (!cfg || !cfg.enabled) return [];
	if (cfg.provider === "oidc") {
		return [
			{
				domain: cfg.domain,
				providerId: cfg.providerId,
				oidcConfig: {
					issuer: cfg.issuer,
					clientId: cfg.clientId!,
					clientSecret: cfg.clientSecret!,
					discoveryEndpoint:
						cfg.discoveryEndpoint ??
						`${cfg.issuer.replace(/\/$/, "")}/.well-known/openid-configuration`,
					pkce: true,
					scopes: cfg.scopes ?? ["openid", "email", "profile"],
				},
			},
		];
	}
	// ponytail: SAML mapped from minimal fields; spMetadata/signing left default,
	// wire fully when a real SAML IdP is onboarded.
	return [
		{
			domain: cfg.domain,
			providerId: cfg.providerId,
			samlConfig: {
				issuer: cfg.issuer,
				entryPoint: cfg.entryPoint!,
				cert: cfg.samlCert!,
				callbackUrl: `${process.env.SERVER_URL!}/_/admin/api/auth/sso/saml2/callback/${cfg.providerId}`,
				spMetadata: { metadata: "" },
			},
		},
	];
}

export function initializeAuth(db: DB) {
	const _auth = betterAuth({
		database: drizzleAdapter(db, {
			provider: "pg",
			schema: authSchemas,
		}),
		basePath: "/_/admin/api/auth",
		trustedOrigins: trustedOrigins(),
		user: {
			additionalFields: {
				isSystemAdmin: {
					type: "boolean",
					defaultValue: false,
				},
			},
		},
		emailAndPassword: {
			enabled: true,
			disableSignUp: true,
			requireEmailVerification: false,
		},
		databaseHooks: {
			user: {
				create: {
					// Gate SSO JIT provisioning to the admin-managed allowlist.
					// Runs before the row is written, so a blocked login creates
					// nothing (no orphan, no linking gate).
					before: async (userData) => {
						if (getSetting("auth_config")?.mode !== "sso_only") return;
						const email = (userData.email ?? "").toLowerCase();
						const allowed = await db
							.select({ id: ssoAllowlistEntity.id })
							.from(ssoAllowlistEntity)
							.where(eq(ssoAllowlistEntity.email, email));
						if (allowed.length === 0) return false; // reject login
					},
					// Link the allowlist entry to the new user so deleting the
					// user cascades the entry away.
					after: async (userData) => {
						if (getSetting("auth_config")?.mode !== "sso_only") return;
						const email = (userData.email ?? "").toLowerCase();
						await db
							.update(ssoAllowlistEntity)
							.set({ userId: userData.id })
							.where(eq(ssoAllowlistEntity.email, email));
					},
				},
			},
		},
		advanced: {
			database: {
				generateId: generateID,
			},
		},
		secondaryStorage: {
			async get(key: string) {
				return getCache(key);
			},
			async set(key: string, value: string, ttl?: number) {
				if (ttl) {
					await setCacheEx(key, value, ttl);
				} else {
					await setCache(key, value);
				}
			},
			async delete(key: string) {
				await deleteCacheKey(key);
			},
		},
		plugins: [
			customSession(async ({ user, session }) => {
				const acl = await getUserAccessControls(db, session.userId);
				return {
					user,
					session,
					acl, // extends session with acl
				};
			}),
			admin(),
			// Single SSO provider loaded from instance_settings.sso_config.
			// Better Auth handles sign-up + account creation/linking automatically.
			sso({
				defaultSSO: ssoDefaults(),
			}),
		],
	});
	auth = _auth;
	return _auth;
}

async function getUserAccessControls(db: DB, userId: string) {
	const user = await db
		.select()
		.from(authSchemas.user)
		.where(eq(authSchemas.user.id, userId));
	if (user[0]?.isSystemAdmin) {
		return [
			{
				projectId: "*",
				role: "system_admin",
			},
		];
	}
	const userAccessControls = await db
		.select({
			projectId: accessControlEntity.projectId,
			role: accessControlEntity.role,
		})
		.from(accessControlEntity)
		.where(eq(accessControlEntity.userId, userId));
	return userAccessControls;
}
