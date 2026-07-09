import underscore from "underscore";
import jwt from "jsonwebtoken";
import { getCookie, setCookie } from "hono/cookie";
import dayjs from "dayjs";
import dayjsUtc from "dayjs/plugin/utc";
import {
	AbstractLogger,
	ConsoleLoggerProvider,
	EmptyLoggerProvider,
	HttpClient,
	HttpRoute,
	HttpRouteParser,
} from "@fluxify/lib";
import {
	Context as BlockContext,
	BlockOutput,
	ContextVarsType,
} from "@fluxify/blocks";
import { Context } from "hono";
import { ContentfulStatusCode } from "hono/utils/http-status";
import { JsVM } from "@fluxify/lib";
import { startBlocksExecution } from "../../loaders/blocksLoader";
import { getAppConfig } from "../../loaders/appconfigLoader";
import { parseRequestSchema, ValidationError } from "../../lib/schemaParser";
import { createObservabilityLogger, DbFactory } from "@fluxify/adapters";
import {
	dbIntegrationsCache,
	observabilityIntegrationsCache,
} from "../../loaders/integrationsLoader";
import * as zodLib from "zod";
import { projectSettingsCache } from "../../loaders/projectSettingsLoader";

export type HandleRequestType = {
	data?: any;
	status: ContentfulStatusCode;
};

export type RequestOverrides = {
	integrations?: Array<{ existingId: string; newId: string }>;
	appConfigs?: Array<{ key: string; value: string }>;
};

export const RESPONSE_TIMEOUT = 4 * 1000;

export async function handleRequest(
	ctx: Context,
	parser: HttpRouteParser,
): Promise<HandleRequestType> {
	const path = parser.getRouteId(
		ctx.req.path,
		ctx.req.method as HttpRoute["method"],
	);
	if (!path) {
		return {
			status: 404,
			data: {
				message: "Route not found",
			},
		};
	}

	const requestBody = await getRequestBody(ctx);
	const headers = ctx.req.header();
	const query = ctx.req.query();

	return executeRouteInternal(
		{
			id: path.id,
			projectId: path.projectId!,
			projectName: path.projectName!,
			routeParams: path.routeParams,
			bodySchema: path.bodySchema,
			querySchema: path.querySchema,
			paramsSchema: path.paramsSchema,
		},
		{
			method: ctx.req.method,
			path: ctx.req.path,
			headers,
			query,
			body: requestBody,
			params: path.routeParams || {},
		},
		ctx,
	);
}

export async function executeRouteInternal(
	routeInfo: {
		id: string;
		projectId: string;
		projectName: string;
		routeParams?: Record<string, string>;
		bodySchema?: any;
		querySchema?: any;
		paramsSchema?: any;
	},
	requestData: {
		method: string;
		path: string;
		headers: Record<string, string>;
		query: Record<string, string | string[]>;
		body: any;
		params: Record<string, string>;
	},
	ctx?: Context,
	overrides?: RequestOverrides,
): Promise<HandleRequestType> {
	const httpClient = createHttpClient();
	const vars = setupContextVars(
		ctx,
		requestData,
		routeInfo.id,
		httpClient,
		routeInfo.projectId,
		overrides,
	);
	const vm = createJsVM(vars);

	if (routeInfo.bodySchema && Object.keys(routeInfo.bodySchema).length > 0) {
		const result = await parseRequestSchema(
			routeInfo.bodySchema,
			requestData.body,
			{
				vm,
			},
		);
		if (!result.success) {
			return {
				status: 400,
				data: { message: "Body validation failed", errors: result.errors },
			};
		}
	}

	if (routeInfo.querySchema && Object.keys(routeInfo.querySchema).length > 0) {
		const result = await parseRequestSchema(
			routeInfo.querySchema,
			requestData.query,
			{
				vm,
				coerce: true,
			},
		);
		if (!result.success) {
			return {
				status: 400,
				data: { message: "Query validation failed", errors: result.errors },
			};
		}
	}

	if (
		routeInfo.paramsSchema &&
		Object.keys(routeInfo.paramsSchema).length > 0
	) {
		const result = await parseRequestSchema(
			routeInfo.paramsSchema,
			requestData.params,
			{ vm, coerce: true },
		);
		if (!result.success) {
			return {
				status: 400,
				data: {
					message: "Path parameters validation failed",
					errors: result.errors,
				},
			};
		}
	}

	const dbFactory = createDbFactory(vm, overrides?.integrations);
	const context = createContext(
		routeInfo,
		requestData,
		vm,
		vars,
		dbFactory,
		httpClient,
	);

	const executionResult = await startBlocksExecution(
		{
			projectId: routeInfo.projectId,
			routeId: routeInfo.id,
			projectName: routeInfo.projectName,
		},
		context,
	);

	if (executionResult) {
		return parseResult(executionResult);
	}
	return {
		status: 500,
		data: {
			message: "Internal server error",
		},
	};
}

function parseResult(executionResult: BlockOutput) {
	return {
		status:
			executionResult.output?.httpCode || (executionResult.error ? 500 : 200),
		data:
			executionResult.output?.body || // has output from previous blocks which passed to response block
			executionResult?.output || // has output from previous blocks which didn't pass (or no response block) to response block
			(!executionResult.successful
				? { error: executionResult.error?.toString() || "Unknown error" }
				: "NO RESULT"),
	};
}

function createContext(
	routeInfo: { id: string; projectId: string },
	requestData: { path: string; body: any },
	vm: JsVM,
	vars: ContextVarsType & Record<string, any>,
	dbFactory: DbFactory,
	httpClient: HttpClient,
): BlockContext {
	return {
		apiId: routeInfo.id,
		route: requestData.path,
		projectId: routeInfo.projectId,
		requestBody: requestData.body,
		vm,
		vars,
		dbFactory,
		httpClient,
		stopper: {
			timeoutEnd: 0,
			duration: RESPONSE_TIMEOUT,
		},
	};
}

function createHttpClient() {
	return new HttpClient();
}

function createDbFactory(
	vm: JsVM,
	integrationOverrides?: Array<{ existingId: string; newId: string }>,
) {
	if (!integrationOverrides || integrationOverrides.length === 0) {
		return new DbFactory(vm, dbIntegrationsCache);
	}

	const customDbCache = { ...dbIntegrationsCache };
	for (const override of integrationOverrides) {
		if (dbIntegrationsCache[override.newId]) {
			customDbCache[override.existingId] = dbIntegrationsCache[override.newId];
		}
	}
	return new DbFactory(vm, customDbCache);
}

function setupContextVars(
	ctx: Context | undefined,
	requestData: {
		method: string;
		path: string;
		headers: Record<string, string>;
		query: Record<string, string | string[]>;
		body: any;
		params: Record<string, string>;
	},
	routeId: string,
	httpClient: HttpClient,
	projectId: string,
	overrides?: RequestOverrides,
): BlockContext["vars"] {
	let logger: AbstractLogger = null!;

	const projectSettings = projectSettingsCache[projectId];
	if (projectSettings && "settings.ai.loggerConnectionId" in projectSettings) {
		let connectionId = projectSettings["settings.ai.loggerConnectionId"];

		// Apply integration override for logger if present
		if (overrides?.integrations) {
			const override = overrides.integrations.find(
				(o) => o.existingId === connectionId,
			);
			if (override) {
				connectionId = override.newId;
			}
		}

		const config = observabilityIntegrationsCache[connectionId];
		if (!!config) {
			config.projectId = projectId;
			config.routeId = routeId;
			logger = createObservabilityLogger(config["variant"], config)!;
		} else {
			logger = new ConsoleLoggerProvider(routeId);
		}
	} else {
		logger = new ConsoleLoggerProvider(routeId);
	}

	return {
		ValidationError: ValidationError,
		jwt: {
			decode(token, options) {
				return jwt.decode(token, options) as Record<string, string>;
			},
			sign(payload, secretKey, options) {
				return jwt.sign(payload, secretKey, options);
			},
			verify(token, secretKey, options) {
				try {
					const payload = jwt.verify(token, secretKey, options) as Record<
						string,
						string
					>;
					return { payload, success: true };
				} catch (error) {
					return { payload: null, success: false };
				}
			},
		},
		libs: {
			dayjs: dayjs.extend(dayjsUtc),
			_: underscore,
			zod: zodLib,
		},
		logger,
		getCookie(key) {
			return ctx ? getCookie(ctx, key) || "" : "";
		},
		getConfig(key) {
			if (overrides?.appConfigs) {
				const override = overrides.appConfigs.find((c) => c.key === key);
				if (override) return override.value;
			}
			return getAppConfig(projectId, key);
		},
		setCookie(name, options) {
			if (ctx) {
				setCookie(ctx, name, options?.value.toString() || "", {
					domain: options?.domain,
					path: options?.path,
					expires: new Date(options?.expiry),
					httpOnly: options?.httpOnly,
					secure: options?.secure,
					sameSite: options?.samesite || "Strict",
				});
			}
		},
		getHeader(key) {
			const lowerKey = key.toLowerCase();
			for (const k in requestData.headers) {
				if (k.toLowerCase() === lowerKey) {
					return requestData.headers[k] || "";
				}
			}
			return "";
		},
		getQueryParam(key) {
			return (requestData.query[key] as string) || "";
		},
		getRequestBody() {
			return requestData.body;
		},
		getRouteParam(key) {
			return requestData.params[key] || "";
		},
		httpRequestMethod: requestData.method,
		httpRequestRoute: requestData.path,
		setHeader(key, value) {
			if (ctx) {
				ctx.header(key, value);
			}
		},
		httpClient,
	};
}

function createJsVM(vars: Record<string, any>) {
	const vm = new JsVM(vars);
	return vm;
}

async function getRequestBody(ctx: Context) {
	const method = ctx.req.method;
	if (method == "POST" || method == "PUT") {
		const contentType = ctx.req.header("Content-Type");
		if (contentType === "application/json") {
			return await ctx.req.json();
		}
		if (contentType === "application/x-www-form-urlencoded") {
			return await ctx.req.formData();
		}
		return await ctx.req.text();
	}
	return null;
}
