export interface AbstractLogger {
	logInfo(value: any): void;
	logWarn(value: any): void;
	logError(value: any): void;
}

export class ConsoleLoggerProvider implements AbstractLogger {
	constructor(private readonly routeId?: string) {}

	logInfo(message: any, extra = {}): void {
		console.log(`[INFO] [ROUTE: ${this.routeId}]`, message, extra);
	}

	logWarn(message: any, extra = {}): void {
		console.log(`[WARN] [ROUTE: ${this.routeId}]`, message, extra);
	}

	logError(message: any, extra = {}): void {
		console.log(`[ERROR] [ROUTE: ${this.routeId}]`, message, extra);
	}
}
export class EmptyLoggerProvider implements AbstractLogger {
	logInfo(_: any): void {}
	logWarn(_: any): void {}
	logError(_: any): void {}
}
