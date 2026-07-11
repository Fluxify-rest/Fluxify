import winston from "winston";
import LokiTransport from "winston-loki";

export interface LokiLoggerOptions {
	host: string;
	basicAuth?: string;
	labels?: Record<string, string>;
}

export function createLokiLogger(options: LokiLoggerOptions): winston.Logger {
	return winston.createLogger({
		level: "info",
		format: winston.format.json(),
		transports: [
			new LokiTransport({
				host: options.host,
				basicAuth: options.basicAuth,
				labels: options.labels || {},
				batching: true,
				interval: 1,
				json: true,
			}),
		],
	});
}
