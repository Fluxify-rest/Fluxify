import { Writable } from "stream";

interface HttpTransportOptions {
	url: string;
	headers?: Record<string, string>;
	flushInterval?: number;
	bufferSize?: number; // Size in bytes
	logStore?: "loki" | "openobserve";
	labels?: Record<string, string>; // Required for Loki
}

export class HttpBufferedTransport extends Writable {
	private buffer: Array<string | [string, string]> = [];
	private bufferBytes: number = 0;
	private timer?: NodeJS.Timeout;
	private url: string;
	private headers: Record<string, string>;
	private flushInterval: number;
	private bufferSize: number;
	private logStore: "loki" | "openobserve";
	private labels: Record<string, string>;
	private isFlushing: boolean = false; // Prevents race conditions

	constructor(opts: HttpTransportOptions) {
		// Force objectMode: true to accept custom Pino stream chunks
		super({ objectMode: true });

		this.url = opts.url;
		this.headers = opts.headers ?? {};
		this.flushInterval = opts.flushInterval ?? 2000;
		this.bufferSize = opts.bufferSize ?? 1024 * 64; // Default to 64KB for health
		this.logStore = opts.logStore ?? "openobserve";
		this.labels = opts.labels ?? { job: "fluxify" };

		this.timer = setInterval(() => {
			this.flush().catch((err) => console.error("Flush timer failed:", err));
		}, this.flushInterval);

		if (this.timer.unref) {
			this.timer.unref();
		}
	}

	override _write(
		chunk: any,
		_encoding: string,
		callback: (error?: Error | null) => void,
	): void {
		const line =
			typeof chunk === "string" ? chunk.trim() : JSON.stringify(chunk);

		if (this.logStore === "loki") {
			// Loki demands nanosecond timestamp precision as a string tuple
			const timestamp = (Date.now() * 1_000_000).toString();
			this.buffer.push([timestamp, line]);
		} else {
			this.buffer.push(line);
		}

		this.bufferBytes += Buffer.byteLength(line, "utf8");

		if (this.bufferBytes >= this.bufferSize) {
			this.flush().catch((err) =>
				console.error("Size-triggered flush failed:", err),
			);
		}

		callback(null);
	}

	async flush(): Promise<void> {
		if (this.isFlushing || !this.buffer.length) return;

		this.isFlushing = true;
		const bufferedEntries = [...this.buffer];

		// Clear state before sending to allow concurrent log processing
		this.buffer = [];
		this.bufferBytes = 0;

		let payload: string;
		let contentType: string;

		if (this.logStore === "loki") {
			payload = JSON.stringify({
				streams: [
					{
						stream: this.labels,
						values: bufferedEntries as Array<[string, string]>,
					},
				],
			});
			contentType = "application/json";
		} else {
			// OpenObserve handles NDJSON multi-line logs
			payload = (bufferedEntries as string[]).join("\n") + "\n";
			contentType = "application/x-ndjson";
		}

		try {
			const res = await fetch(this.url, {
				method: "POST",
				headers: {
					"Content-Type": contentType,
					...this.headers,
				},
				body: payload,
			});

			if (!res.ok) {
				throw new Error(`Log store returned HTTP status ${res.status}`);
			}
		} catch (err) {
			console.error("HTTP log push failed:", err);

			// Safety Cap: Drop old entries if buffer gets insanely large to prevent OOM
			if (this.buffer.length < 10000) {
				this.buffer.unshift(...bufferedEntries);
				this.bufferBytes += Buffer.byteLength(payload, "utf8");
			} else {
				console.error("Log buffer saturated. Dropping batch to save memory.");
			}
		} finally {
			this.isFlushing = false;
		}
	}

	override _final(callback: (error?: Error | null) => void): void {
		if (this.timer) clearInterval(this.timer);
		this.flush()
			.then(() => callback(null))
			.catch((err) => callback(err));
	}
}
