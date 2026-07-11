import { OpenTelemetryLogs } from "./openTelemetryLogs";
import { LokiLogger } from "./loki";

export function createObservabilityLogger(variant: string, config: any) {
	if (variant === LokiLogger.variant) {
		return new LokiLogger(config);
	} else if (variant === OpenTelemetryLogs.variant) {
		return new OpenTelemetryLogs(config);
	}
	throw new Error("Invalid generic provider variant: " + variant);
}

export * from "./openTelemetryLogs";
export * from "./loki";
