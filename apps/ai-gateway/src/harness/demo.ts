import { flushTraces } from "../instrumentation";

async function main() {
	// Dynamically import to ensure OTEL instrumentation patches LangChain before it loads
	const { app } = await import("./graph");
	const { AgentFactory } = await import("./models/factory");
	const { DbService } = await import("./internal/dbService");
	const { drizzleInit } = await import("@fluxify/server");
	const { FluxifyOtelTracer } = await import("./telemetry/otel-tracer");

	// Mistral integration with API key support
	await drizzleInit();
	const factory = new AgentFactory({
		provider: "mistral",
		modelName: "mistral-medium-3-5",
		apiKey: process.env.MISTRAL_API_KEY || "z7XQwB1H4c13lyWxSqLZUcvxcpn3bhLu",
	});

	/*
	// OpenAI compatible version (uncomment to use)
	// const factory = new AgentFactory({
	// 	provider: "openai",
	// 	modelName: "gpt-4o",
	// 	apiKey: process.env.OPENAI_API_KEY || "YOUR_OPENAI_API_KEY",
	// });
	*/

	const agentWrapper = factory.createAgent();

	// Sample user query to trigger building an API route
	const userQuery =
		"Create a new route that fetches a user by ID from the PostgreSQL database.";

	const initialState = {
		messages: [],
		userQuery,
		agentWrapper,
		scratchpad: [],
		internal: {
			dbService: new DbService(), // Real DbService instance
		},
	};

	console.log(`Starting Harness Demo with Query: "${userQuery}"\n`);

	try {
		const tracer = new FluxifyOtelTracer();
		const finalState = await app.invoke(initialState, {
			callbacks: [tracer],
		});

		console.log("\n====== WORKFLOW FINISHED ======");
		console.log("Final State Keys:", Object.keys(finalState));
	} catch (error) {
		console.error("Error executing harness graph:", error);
	} finally {
		await flushTraces();
	}
}

// Run the demo
main().catch(console.error);
