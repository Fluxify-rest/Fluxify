export interface PlannerOutput {
	markdownPlan: string;
	success: boolean;
	rejectReason?: string;
	thinkingProcess: string;
	scratchPad: string[];
}

export interface BuilderState {
	scratchPad: string[];
	plannerOutput?: PlannerOutput;
	workflowStatus?:
		| "planning"
		| "under_plan_review"
		| "executing"
		| "completed"
		| "rejected";
}

export type ResourceType =
	| "route"
	| "app_config"
	| "integration"
	| "custom_block";

export interface FindResourceResult {
	type: ResourceType;
	id: string;
	name: string;
	description?: string;
	path?: string;
	method?: string;
	group?: string;
	variant?: string;
}
