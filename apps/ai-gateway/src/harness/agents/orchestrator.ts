import { BaseAgent } from "./base";
import {
	type GlobalGraphState,
	AgentNode,
	type Task,
	type AgentNodeName,
} from "../types";
import { dispatchAgentEvent } from "../callbacks";
import { TaskGeneratorAgent } from "./taskGenerator";

function topologicalSortByLevel(tasks: Task[]): string[][] {
	const inDegree = new Map<string, number>();
	const children = new Map<string, string[]>();
	const result: string[][] = [];

	for (const task of tasks) {
		inDegree.set(task.id, 0);
		children.set(task.id, []);
	}

	for (const task of tasks) {
		if (task.dependsOnAgentId) {
			for (const parentId of task.dependsOnAgentId) {
				inDegree.set(task.id, (inDegree.get(task.id) || 0) + 1);
				if (!children.has(parentId)) {
					children.set(parentId, []);
				}
				children.get(parentId)!.push(task.id);
			}
		}
	}

	let queue: string[] = [];
	for (const [taskId, deg] of inDegree.entries()) {
		if (deg === 0) {
			queue.push(taskId);
		}
	}

	let processedCount = 0;

	while (queue.length > 0) {
		const nextQueue: string[] = [];
		const currentLevel: string[] = [];

		for (const taskId of queue) {
			currentLevel.push(taskId);
			processedCount++;

			const taskChildren = children.get(taskId) || [];
			for (const childId of taskChildren) {
				const currentDeg = inDegree.get(childId) || 0;
				inDegree.set(childId, currentDeg - 1);
				if (currentDeg - 1 === 0) {
					nextQueue.push(childId);
				}
			}
		}

		result.push(currentLevel);
		queue = nextQueue;
	}

	if (processedCount !== tasks.length) {
		throw new Error("Cyclic dependency detected in tasks");
	}

	return result;
}

export class OrchestratorAgent extends BaseAgent {
	constructor(state: GlobalGraphState) {
		super(state);
	}

	async execute(): Promise<Partial<GlobalGraphState>> {
		await dispatchAgentEvent({
			name: "agent_status",
			data: {
				status: "Orchestrating tasks...",
				agent: AgentNode.ORCHESTRATOR,
			},
		});

		let tasks = this.state.orchestratorState?.tasks || [];
		let taskQueue = this.state.orchestratorState?.taskQueue || [];

		// Initialize tasks if none exist
		if (tasks.length === 0) {
			const taskGenerator = new TaskGeneratorAgent(this.state);
			tasks = await taskGenerator.execute();

			if (tasks.length > 0) {
				taskQueue = topologicalSortByLevel(tasks);
			}
		}

		if (taskQueue.length === 0) {
			await dispatchAgentEvent({
				name: "agent_status",
				data: {
					status: "All tasks completed.",
					agent: AgentNode.ORCHESTRATOR,
				},
			});
			return {
				currentAgent: AgentNode.ORCHESTRATOR,
				nextRoute: undefined, // Let graph logic end the flow
				orchestratorState: {
					...this.state.orchestratorState,
					tasks,
					taskQueue,
				},
			};
		}

		// Pop the next level of tasks
		const nextTaskIds = taskQueue.shift() || [];
		const nextRoutes: AgentNodeName[] = [];
		const assignedTaskIds: string[] = [];
		const dispatchedTasks: Task[] = [];

		for (const nextTaskId of nextTaskIds) {
			const nextTaskIndex = tasks.findIndex((t) => t.id === nextTaskId);
			if (nextTaskIndex !== -1) {
				tasks[nextTaskIndex].status = "running";
				nextRoutes.push(tasks[nextTaskIndex].assignedAgentNode);
				assignedTaskIds.push(nextTaskId);
				dispatchedTasks.push(tasks[nextTaskIndex]);
			}
		}

		let nextRoute: AgentNodeName | AgentNodeName[] | undefined = undefined;
		if (nextRoutes.length === 1) {
			nextRoute = nextRoutes[0];
		} else if (nextRoutes.length > 1) {
			nextRoute = nextRoutes;
		}

		if (nextRoutes.length > 0) {
			await dispatchAgentEvent({
				name: "agent_status",
				data: {
					status: `Routing to tasks: ${assignedTaskIds.join(", ")}`,
					agent: AgentNode.ORCHESTRATOR,
					data: { taskIds: assignedTaskIds, nextRoute },
				},
			});
		}

		return {
			currentAgent: AgentNode.ORCHESTRATOR,
			nextRoute,
			orchestratorState: {
				...this.state.orchestratorState,
				tasks,
				taskQueue,
				dispatchedTasks,
			},
		};
	}
}
