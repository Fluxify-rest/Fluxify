import { LokiLogger } from "./loki";
import { OpenObserve } from "./openObserve";

export function createObservabilityLogger(variant: any, config: any) {
	if (variant === LokiLogger.variant) {
		return new LokiLogger(config);
	} else if (variant === OpenObserve.variant) {
		return new OpenObserve(config);
	}
}

export * from "./loki";
export * from "./openObserve";
