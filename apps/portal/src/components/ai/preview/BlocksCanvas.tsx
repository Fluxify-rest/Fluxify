import { lazy, Suspense, useMemo, useState } from "react";
import { Fold } from "./Collapsible";
import type { CanvasDiff } from "./canvasDiff";
import { isRec, rec, str } from "./data";

// ReactFlow is only loaded once the fold is opened
const CanvasDiffGraph = lazy(() => import("./CanvasDiffGraph"));

/** run_blocks's blocks and edges, as the canvas they would make: every block as it is, none changed. */
export function canvasFromBlocks(input: Record<string, unknown>): CanvasDiff | null {
	if (!Array.isArray(input.blocks) || input.blocks.length === 0) return null;
	const blocks: CanvasDiff["blocks"] = [];
	for (const raw of input.blocks) {
		if (!isRec(raw) || !str(raw.ref) || !str(raw.type)) return null;
		blocks.push({
			key: str(raw.ref),
			type: str(raw.type),
			status: "same",
			data: rec(raw.data),
			changes: [],
		});
	}
	const edges: CanvasDiff["edges"] = [];
	for (const raw of Array.isArray(input.edges) ? input.edges : []) {
		const e = rec(raw);
		const [from, dotted] = str(e.from).split(".");
		if (!from || !str(e.to)) continue;
		const handle = str(e.handle) || dotted || "source";
		edges.push({
			id: `${from}.${handle}>${str(e.to)}`,
			from,
			to: str(e.to),
			handle,
			status: "same",
		});
	}
	return { blocks, edges };
}

/** The "Blocks sent" fold: the canvas, with the block settings panel (from a block's hover menu). */
export function BlocksCanvas({ input }: { input: unknown }) {
	const diff = useMemo(() => canvasFromBlocks(rec(input)), [input]);
	const [open, setOpen] = useState(false);
	const [picked, setPicked] = useState<string>();
	if (!diff) return null;
	return (
		<Fold label={`Blocks sent (${diff.blocks.length})`} open={open} onToggle={setOpen}>
			{open && (
				<Suspense fallback={<div className="h-96 animate-pulse rounded-lg bg-surface-secondary" />}>
					<CanvasDiffGraph diff={diff} selected={picked} onSelect={setPicked} panel />
				</Suspense>
			)}
		</Fold>
	);
}
