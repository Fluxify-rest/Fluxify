import { Link, useParams } from "@tanstack/react-router";
import { TbFlask } from "react-icons/tb";
import { REF_ICONS } from "../AgentRef";
import type { ToolPart } from "../agentMessages";
import { rec, str } from "./data";

const KINDS = {
	route: { label: "Route", icon: REF_ICONS.route, page: "canvas" },
	workflow: { label: "Workflow", icon: REF_ICONS.workflow, page: "workflow-canvas" },
	custom_block: {
		label: "Custom block",
		icon: REF_ICONS.custom_block,
		page: "custom-block-canvas",
	},
	sandbox: { label: "Sandbox", icon: TbFlask, page: "sandbox-canvas" },
} as const;

const SANDBOX_TOOLS = new Set(["get_sandbox", "call_sandbox", "run_sandbox", "delete_sandbox"]);

type Which = { kind: keyof typeof KINDS; id: string; projectId: string } | { blocks: number };

/**
 * Which canvas a canvas or sandbox tool works on: get_canvas / edit_canvas name one,
 * so do the sandbox tools; run_blocks carries its blocks and has none to open.
 * Undefined for any other tool, or until the input has been read.
 */
export function canvasOf(tool: ToolPart): Which | undefined {
	const input = rec(tool.input);
	if (tool.name === "run_blocks")
		return Array.isArray(input.blocks) ? { blocks: input.blocks.length } : undefined;
	// get_sandbox, call_sandbox, run_sandbox, delete_sandbox: the sandbox is the input's own id
	if (SANDBOX_TOOLS.has(tool.name)) {
		const id = str(input.sandboxId);
		return id ? { kind: "sandbox", id, projectId: str(input.projectId) } : undefined;
	}
	if (tool.name !== "get_canvas" && tool.name !== "edit_canvas") return undefined;
	const target = rec(input.target);
	const kind = str(target.kind);
	const id = str(target.id);
	if (!(kind in KINDS) || !id) return undefined;
	return { kind: kind as keyof typeof KINDS, id, projectId: str(target.projectId) };
}

/** The folded row's line for a canvas tool: its kind and id, the id opening the canvas in a new tab. */
export function CanvasTarget({ which }: { which: Which }) {
	const params = useParams({ strict: false }) as { projectId?: string };
	if ("blocks" in which)
		return (
			<span className="text-foreground">
				Ephemeral run · {which.blocks} block{which.blocks === 1 ? "" : "s"}
			</span>
		);
	const { label, icon: Icon, page } = KINDS[which.kind];
	const projectId = which.projectId || params.projectId;
	const path: string = `/${projectId}/${page}/${which.id}`;
	return (
		<span className="inline-flex items-center gap-1.5 text-foreground">
			<Icon size={13} className="shrink-0 text-muted" />
			{label}
			{projectId ? (
				<Link
					to={path}
					target="_blank"
					rel="noopener noreferrer"
					title={`Open ${label.toLowerCase()} in a new tab`}
					className="text-accent no-underline hover:underline"
				>
					{which.id}
				</Link>
			) : (
				<span className="text-muted">{which.id}</span>
			)}
		</span>
	);
}
