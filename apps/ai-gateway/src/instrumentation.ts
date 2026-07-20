import { NodeTracerProvider } from "@opentelemetry/sdk-trace-node";
import {
	BatchSpanProcessor,
	SpanProcessor,
	ReadableSpan,
} from "@opentelemetry/sdk-trace-base";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-proto";
import { registerInstrumentations } from "@opentelemetry/instrumentation";
import { LangChainInstrumentation } from "@arizeai/openinference-instrumentation-langchain";
import { resourceFromAttributes } from "@opentelemetry/resources";
import { context, Context, createContextKey } from "@opentelemetry/api";
import {
	LLM_TRACING_ENABLED,
	LLM_OTLP_TRACES_ENDPOINT,
	LLM_OTLP_TRACES_HEADERS,
} from "./lib/env";
import { isMainThread } from "worker_threads";

// Import the internal SDK span type directly from trace-base to satisfy SDK 2.9.0's type system
import type { Span as SdkSpan } from "@opentelemetry/sdk-trace-base";

export const FLUXIFY_CONTEXT_KEY = createContextKey("fluxify_context");

export interface FluxifyContextData {
	userQuery?: string;
	action?: string;
}

/**
 * Custom SpanProcessor correctly typed for @opentelemetry/sdk-trace-base v2.9.0.
 * By using `SdkSpan` instead of API's user-facing Span, it cleanly passes into `addSpanProcessor()`.
 */
class FluxifyContextSpanProcessor implements SpanProcessor {
	forceFlush(): Promise<void> {
		return Promise.resolve();
	}

	shutdown(): Promise<void> {
		return Promise.resolve();
	}

	onStart(span: SdkSpan, _parentContext: Context): void {
		const fluxifyContext = context
			.active()
			.getValue(FLUXIFY_CONTEXT_KEY) as FluxifyContextData;

		if (fluxifyContext) {
			if (fluxifyContext.userQuery) {
				span.setAttribute("fluxify.userQuery", fluxifyContext.userQuery);
			}
			if (fluxifyContext.action) {
				span.setAttribute("fluxify.action", fluxifyContext.action);
			}
		}
	}

	onEnd(_span: ReadableSpan): void {}
}

function parseHeaders(
	headersString: string | undefined,
): Record<string, string> {
	if (!headersString) return {};
	const headers: Record<string, string> = {};
	const parts = headersString.split(";");
	for (const part of parts) {
		const colonIndex = part.indexOf(":");
		if (colonIndex !== -1) {
			const key = part.slice(0, colonIndex).trim();
			const value = part.slice(colonIndex + 1).trim();
			if (key && value) {
				headers[key] = value;
			}
		}
	}
	return headers;
}

let isInitialized = false;

export function initializeInstrumentation(): void {
	if (isInitialized) return;
	if (!LLM_TRACING_ENABLED || !LLM_OTLP_TRACES_ENDPOINT) return;

	const serviceName = isMainThread
		? "fluxify.ai-gateway-main.llm"
		: "fluxify.ai-gateway-worker.llm";

	// Cast the exporter cleanly if experimental 0.220 packages have slight assignment drift
	const exporter = new OTLPTraceExporter({
		url: LLM_OTLP_TRACES_ENDPOINT,
		headers: parseHeaders(LLM_OTLP_TRACES_HEADERS),
	}) as any;

	// Creating resource mapping explicitly conforming to SDK 2.9.0 definitions
	const provider = new NodeTracerProvider({
		resource: resourceFromAttributes({
			"service.name": serviceName,
		}),
		spanProcessors: [
			new FluxifyContextSpanProcessor(),
			new BatchSpanProcessor(exporter),
		],
	});

	(global as any).__tracerProvider = provider;

	provider.register();

	// Bind OpenInference / LangChain instrumentation hooks
	registerInstrumentations({
		instrumentations: [new LangChainInstrumentation() as any],
	});

	isInitialized = true;
}

export async function flushTraces(): Promise<void> {
	if ((global as any).__tracerProvider) {
		await (global as any).__tracerProvider.forceFlush();
	}
}

// Automatically execute the initialization
initializeInstrumentation();
