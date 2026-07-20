import { flushTraces } from "./instrumentation";
import { trace } from "@opentelemetry/api";

async function main() {
	console.log("Starting manual OTEL trace test...");

	// 1. Get the tracer (uses the globally registered provider from instrumentation.ts)
	const tracer = trace.getTracer("manual-test-tracer");

	// 2. Start a manual span
	await tracer.startActiveSpan("manual-test-span", async (span) => {
		try {
			console.log("Span started.");
			
			// 3. Add some attributes
			span.setAttribute("test.message", "Hello from manual trace test");
			span.setAttribute("test.timestamp", new Date().toISOString());

			// Simulate some work
			await new Promise((resolve) => setTimeout(resolve, 500));

			span.addEvent("test-event-occurred");
			console.log("Span work completed.");
		} catch (error: any) {
			span.recordException(error);
			throw error;
		} finally {
			// 4. End the span
			span.end();
			console.log("Span ended.");
		}
	});

	// 5. Force flush to ensure it reaches the collector
	console.log("Flushing traces...");
	await flushTraces();
	console.log("Traces flushed successfully.");
}

main().catch(console.error);
