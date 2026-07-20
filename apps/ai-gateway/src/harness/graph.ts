import { StateGraph, END, START } from "@langchain/langgraph";
import { GraphState, type GlobalGraphState, AgentNode } from "./types";
import { RouterAgent, DiscussionAgent, VerifyUserQueryAgent } from "./agents";

const workflow = new StateGraph(GraphState)
	.addNode(AgentNode.ROUTER, async (state: GlobalGraphState) => {
		const agent = new RouterAgent(state);
		return await agent.execute();
	})
	.addNode(AgentNode.VERIFY_USER_QUERY, async (state: GlobalGraphState) => {
		const agent = new VerifyUserQueryAgent(state);
		return await agent.execute();
	})
	.addNode(AgentNode.DISCUSSION, async (state: GlobalGraphState) => {
		const agent = new DiscussionAgent(state);
		return await agent.execute();
	})
	.addNode(AgentNode.PLANNER, async (state: GlobalGraphState) => {
		// To be implemented
		return {};
	})
	.addNode(AgentNode.BUILDER, async (state: GlobalGraphState) => {
		// To be implemented
		return {};
	})
	.addEdge(START, AgentNode.ROUTER)
	.addConditionalEdges(AgentNode.ROUTER, (state: GlobalGraphState) => {
		if (state.nextRoute === AgentNode.VERIFY_USER_QUERY) {
			return AgentNode.VERIFY_USER_QUERY;
		} else if (state.nextRoute === AgentNode.DISCUSSION) {
			return AgentNode.DISCUSSION;
		}
		return END;
	})
	.addConditionalEdges(AgentNode.VERIFY_USER_QUERY, (state: GlobalGraphState) => {
		if (state.nextRoute === AgentNode.PLANNER) {
			return AgentNode.PLANNER;
		}
		return END;
	})
	.addEdge(AgentNode.PLANNER, AgentNode.BUILDER)
	.addEdge(AgentNode.DISCUSSION, END)
	.addEdge(AgentNode.BUILDER, END);

export const app = workflow.compile();
