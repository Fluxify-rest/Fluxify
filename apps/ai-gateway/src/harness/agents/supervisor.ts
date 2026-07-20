import { BaseAgent } from "./base";
import { type GlobalGraphState, AgentNode } from "../types";
import { dispatchAgentEvent } from "../callbacks";

export class SupervisorAgent extends BaseAgent {
	constructor(state: GlobalGraphState) {
		super(state);
	}

	async execute(): Promise<Partial<GlobalGraphState>> {
		await dispatchAgentEvent({
			name: "agent_status",
			data: {
				status: "Aggregating and verifying results...",
				agent: AgentNode.SUPERVISOR,
			},
		});

		// Currently acts as a pass-through aggregator.
		// Additional verification logic can be added here in the future.

		return {
			currentAgent: AgentNode.SUPERVISOR,
			nextRoute: AgentNode.ORCHESTRATOR,
		};
	}
}
