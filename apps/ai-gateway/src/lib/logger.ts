import winston from "winston";
import { OpenTelemetryTransportV3 } from "@opentelemetry/winston-transport";
import {
	OTLP_LOGS_ENDPOINT,
	OTLP_AUTH_HEADER_NAME,
	OTLP_AUTH_HEADER_VALUE,
	OTLP_SERVICE_NAME,
	OTLP_LOGGER_ENABLED,
} from "./env";
import { initializeOtlpLogger } from "./otlp/logs";

export interface LoggerConfig {
	serviceName?: string;
	level?: string;
	otlpEndpoint?: string;
	otlpHeaders?: Record<string, string>;
	useOtlp?: boolean;
}

export const logger = winston.createLogger({
	level: "info",
	transports: [
		new winston.transports.Console({
			format: winston.format.combine(
				winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
				winston.format.printf((info) => {
					return `${info.timestamp} [${info.level.toUpperCase()}]: ${info.message}`;
				}),
			),
		}),
	],
});

let isInitialized = false;

export function initializeLogger(config: LoggerConfig = {}): void {
	if (isInitialized) {
		return;
	}

	const serviceName =
		config.serviceName || OTLP_SERVICE_NAME || "fluxify.api-gateway";
	const level = config.level || "info";
	const otlpEndpoint = config.otlpEndpoint || OTLP_LOGS_ENDPOINT;

	// Enable OTLP only if config.useOtlp is true, or if OTLP_LOGGER_ENABLED is "true" and an endpoint exists
	const useOtlp =
		config.useOtlp ?? (OTLP_LOGGER_ENABLED === "true" && !!otlpEndpoint);

	const transports: winston.transport[] = [
		new winston.transports.Console({
			format: winston.format.combine(
				winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
				winston.format.printf((info) => {
					return `${info.timestamp} [${info.level.toUpperCase()}]: ${info.message}`;
				}),
			),
		}),
	];

	if (useOtlp && otlpEndpoint) {
		const authHeaderName = OTLP_AUTH_HEADER_NAME ?? "Authorization";
		const authHeaderValue = OTLP_AUTH_HEADER_VALUE ?? "";
		const headers = {
			[authHeaderName]: authHeaderValue,
			...config.otlpHeaders,
		};

		// 1. Setup OpenTelemetry OTLP exporter and logger provider
		initializeOtlpLogger({
			url: otlpEndpoint,
			headers,
			serviceName,
		});

		// 2. Add OpenTelemetry transport to Winston
		transports.push(new OpenTelemetryTransportV3());
	}

	// Reconfigure the Winston logger instance with new level and transports
	logger.configure({
		level,
		transports,
	});

	isInitialized = true;
}

export default logger;
