import { useEditorChangeTrackerStore } from "@/store/editor";
import { Button } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { useParams } from "next/navigation";
import { TbDeviceFloppy } from "react-icons/tb";
import { useCanvasSave } from "@/hooks/useCanvasState";

const SaveEditorButton = () => {
	const changeTracker = useEditorChangeTrackerStore();
	const disableButton = changeTracker.tracker.size === 0;
	const { id: routeId } = useParams<{ id: string }>();
	const { onSave } = useCanvasSave(routeId);

	async function onSaveClicked() {
		await onSave();
	}

	return (
		<Button
			size="xs"
			disabled={disableButton}
			variant="light"
			onClick={onSaveClicked}
			color="violet"
			leftSection={<TbDeviceFloppy size={18} />}
		>
			Save
		</Button>
	);
};

export default SaveEditorButton;
