import { type Check, calledTool, type Task } from "./checks";

/**
 * Ephemeral runs (#741). In its own file so tasks2.ts stays under the FTA cap.
 * The point is the one call: nothing is saved, so the checks look for leftovers.
 */

/** A sandbox is what a run_blocks call must not leave behind. */
const noSandboxLeft: Check = {
	name: "left no sandbox behind",
	run: async (ctx) => {
		const sandboxes = await ctx.tool("list_sandboxes", { projectId: ctx.projectId });
		return sandboxes.length
			? { pass: false, message: `${sandboxes.length} sandboxes` }
			: { pass: true, message: "none" };
	},
};

const noRouteLeft: Check = {
	name: "made no route",
	run: async (ctx) => {
		const { items } = await ctx.tool("list_routes", { projectId: ctx.projectId });
		return items.length
			? { pass: false, message: `${items.length} routes` }
			: { pass: true, message: "none" };
	},
};

/** The run's one log row is there, for the agent or the user to look back at. */
const loggedTheRun: Check = {
	name: "the run left one ephemeral system log",
	run: async (ctx) => {
		const logs = await ctx.tool("get_system_logs", { projectId: ctx.projectId, type: "ephemeral" });
		return logs.length
			? { pass: true, message: `${logs.length} row(s)` }
			: { pass: false, message: "no ephemeral log row" };
	},
};

export const ephemeralTasks: Task[] = [
	{
		id: "ephemeral-run",
		title: "Try a few blocks in one call and keep nothing (#741)",
		prompt:
			"Without saving anything, find out what this returns: a JavaScript block that adds up the squares of 1 to 10. Run it once and tell me the number. It needs a development worker running.",
		checks: [calledTool("run_blocks"), noSandboxLeft, noRouteLeft, loggedTheRun],
		judge: [
			"Used run_blocks, in one call, instead of making a route or a sandbox",
			"Reported the real answer from the run (385), not a number worked out in its head",
		],
	},
];
