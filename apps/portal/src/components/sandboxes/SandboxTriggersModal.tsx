import { CloseButton, Modal } from "@fluxify/components";
import { AttachedTriggers } from "@/components/triggers/AttachedTriggers";

/** The triggers that run a sandbox on a development worker (#735). */
export function SandboxTriggersModal({
	projectId,
	sandboxId,
	readOnly,
	isOpen,
	onOpenChange,
}: {
	projectId: string;
	sandboxId: string;
	readOnly: boolean;
	isOpen: boolean;
	onOpenChange: (open: boolean) => void;
}) {
	return (
		<Modal isOpen={isOpen} onOpenChange={onOpenChange}>
			<Modal.Backdrop>
				<Modal.Container placement="center">
					<Modal.Dialog className="w-[36rem] max-w-[92vw]">
						<Modal.Header className="flex flex-row items-center gap-3">
							<Modal.Heading className="text-sm font-semibold">Sandbox triggers</Modal.Heading>
							<CloseButton aria-label="Close triggers" className="ml-auto" />
						</Modal.Header>
						<Modal.Body>
							<AttachedTriggers
								target={{ kind: "sandbox", id: sandboxId }}
								projectId={projectId}
								readOnly={readOnly}
							/>
						</Modal.Body>
					</Modal.Dialog>
				</Modal.Container>
			</Modal.Backdrop>
		</Modal>
	);
}
