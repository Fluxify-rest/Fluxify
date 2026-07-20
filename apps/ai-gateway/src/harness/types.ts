import { Annotation, MessagesAnnotation } from "@langchain/langgraph";
import type { BaseAgentWrapper } from "./models/base";
import type { DbService } from "./internal/dbService";

export enum AgentNode {
	ROUTER = "router",
	CLASSIFIER = "classifier",
	VERIFY_USER_QUERY = "verifyUserQuery",
	PLANNER = "planner",
	DISCUSSION = "discussion",
	BUILDER = "builder"
}

export type AgentNodeName = `${AgentNode}`;

export type CustomEventName = "agent_status" | "human_in_the_loop_required";

export interface AgentCustomEvent {
  name: CustomEventName;
  data: unknown;
}

export interface RouterState {
	intent?: "discussion" | "builder";
	reason?: string;
}

export interface ClassifierState {
	status?: boolean;
	reasoning?: string;
	data?: "discussion" | "builder";
}

export interface VerifyUserQueryState {
	capable?: boolean;
	rejectReason?: string;
}

export interface BuilderState {
	agentA?: Record<string, unknown>;
	// Additional builder sub-agents state can be added here
}

export interface DiscussionState {
	markdown?: string;
}

export const GraphState = Annotation.Root({
	...MessagesAnnotation.spec,
	scratchpad: Annotation<string[]>({
		reducer: (oldState, newState) => [...oldState, ...newState],
		default: () => [],
	}),
	agentWrapper: Annotation<BaseAgentWrapper>({
		reducer: (oldState, newState) => newState ?? oldState,
		default: () => undefined as unknown as BaseAgentWrapper,
	}),
	internal: Annotation<{ dbService: DbService; metadata?: any }>({
		reducer: (oldState, newState) => newState ?? oldState,
	}),
	userQuery: Annotation<string | undefined>({
		reducer: (oldState, newState) => newState ?? oldState,
		default: () => undefined,
	}),
	action: Annotation<unknown>({
		// TODO: implement core details of action (e.g. HITL, approvals) later
		reducer: (oldState, newState) => newState ?? oldState,
		default: () => undefined,
	}),
	nextRoute: Annotation<AgentNodeName | undefined>({
		reducer: (oldState, newState) => newState !== undefined ? newState : oldState,
		default: () => undefined,
	}),
	currentAgent: Annotation<AgentNodeName | undefined>({
		reducer: (oldState, newState) => newState ?? oldState,
		default: () => undefined,
	}),
	router: Annotation<RouterState>({
		reducer: (oldState, newState) => ({ ...oldState, ...newState }),
		default: () => ({}),
	}),
	discussion: Annotation<DiscussionState>({
		reducer: (oldState, newState) => ({ ...oldState, ...newState }),
		default: () => ({}),
	}),
	classifier: Annotation<ClassifierState>({
		reducer: (oldState, newState) => ({ ...oldState, ...newState }),
		default: () => ({}),
	}),
	verifyUserQuery: Annotation<VerifyUserQueryState>({
		reducer: (oldState, newState) => ({ ...oldState, ...newState }),
		default: () => ({}),
	}),
	builder: Annotation<BuilderState>({
		reducer: (oldState, newState) => ({ ...oldState, ...newState }),
		default: () => ({}),
	}),
	// Additional context can be added here in the future
});

export type GlobalGraphState = typeof GraphState.State;
