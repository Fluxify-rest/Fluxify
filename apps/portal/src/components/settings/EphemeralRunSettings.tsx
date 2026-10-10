import { Button, Checkbox, Label, NumberField, toast } from "@fluxify/components";
import type { RequestBodySchema } from "@fluxify/server/src/api/v1/projects/settings/keys/upsert/dto";
import { useEffect, useState } from "react";
import { showErrorNotification } from "@/lib/errorNotifier";
import { projectSettingsKeysQuery } from "@/query/projectSettingsKeysQuery";
import { useCanEditProject } from "@/store/auth";

const TIMEOUT_KEY = "settings.ai.ephemeralRunTimeoutSeconds";
const ASK_KEY = "settings.ai.askBeforeEphemeralRuns";
const DEFAULT_TIMEOUT = 10;

/**
 * The agent's `run_blocks` (#741): how long one run may take, and whether the
 * chat asks first. Creators change both; they are not run limits an admin owns.
 */
export function EphemeralRunSettings({
	projectId,
	settings,
}: {
	projectId: string;
	settings: Record<string, string>;
}) {
	const canEdit = useCanEditProject(projectId);
	const upsert = projectSettingsKeysQuery.upsert.useMutation(projectId);
	const saved = Number(settings[TIMEOUT_KEY]) || DEFAULT_TIMEOUT;
	const [timeout, setTimeoutSeconds] = useState(saved);
	useEffect(() => setTimeoutSeconds(saved), [saved]);

	const save = (key: string, value: string, what: string) =>
		upsert.mutate({ key, value } as RequestBodySchema, {
			onSuccess: () => toast.success(`${what} saved`),
			onError: (e) => showErrorNotification(e as Error),
		});

	return (
		<div className="flex flex-col gap-4 rounded-lg border border-border bg-surface p-4">
			<div>
				<h3 className="font-medium text-foreground">Ephemeral runs</h3>
				<p className="text-sm text-muted">
					The agent can try a few blocks in one call on a development worker. Nothing is saved
					except one log entry that only the person who ran it can read.
					{canEdit ? "" : " Only a creator can change these."}
				</p>
			</div>
			<NumberField
				value={timeout}
				minValue={1}
				maxValue={30}
				step={1}
				isDisabled={!canEdit}
				onChange={setTimeoutSeconds}
				className="w-64"
			>
				<Label>Run timeout (seconds)</Label>
				<NumberField.Group>
					<NumberField.DecrementButton />
					<NumberField.Input />
					<NumberField.IncrementButton />
				</NumberField.Group>
			</NumberField>
			{canEdit && timeout !== saved && (
				<Button
					variant="primary"
					size="sm"
					className="self-start"
					isPending={upsert.isPending}
					onPress={() => save(TIMEOUT_KEY, String(timeout), "Run timeout")}
				>
					Save
				</Button>
			)}
			<Checkbox
				isSelected={settings[ASK_KEY] === "true"}
				isDisabled={!canEdit}
				onChange={(on: boolean) =>
					save(ASK_KEY, on ? "true" : "false", "Ask before ephemeral runs")
				}
				label="Ask before ephemeral runs"
				description="The agent waits for your approval before every run, in auto mode too."
			/>
		</div>
	);
}
