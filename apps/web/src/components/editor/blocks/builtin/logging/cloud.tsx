import { useContext } from "react";
import BaseBlock from "../../base";
import BlockHandle from "../../handle";
import { NodeProps, Position } from "@xyflow/react";
import { Stack, Select, Box } from "@mantine/core";
import z from "zod";
import { DataSettingsProps } from "../../settingsDialog/blockSettingsDialog";
import { BlockCanvasContext } from "@/context/blockCanvas";
import JsTextInput from "@/components/editors/jsTextInput";
import { LuFileText } from "react-icons/lu";
import IntegrationSelector from "@/components/editors/integrationSelector";
import { cloudLogsBlockSchema } from "@fluxify/blocks/builtin/log/cloudLogs";

const CloudLogBlock = (props: NodeProps) => {
  return (
    <BaseBlock
      blockId={props.id}
      nodeProps={props}
      icon={<LuFileText size={15} />}
      tooltip={props?.data?.label?.toString() ?? ""}
      showOptionsTooltip={!props.dragging}
      optionsTooltip={["delete", "options"]}
      blockName="Cloud Log store"
      labelPlacement="left"
    >
      <BlockHandle
        type="source"
        blockId={`${props.id}`}
        position={Position.Bottom}
      />
      <BlockHandle
        type="target"
        blockId={`${props.id}`}
        position={Position.Top}
      />
    </BaseBlock>
  );
};

export const CloudSettingsPanel = (
  props: DataSettingsProps<z.infer<typeof cloudLogsBlockSchema>>,
) => {
  const { updateBlockData } = useContext(BlockCanvasContext);

  function onLevelChange(value: string | null) {
    if (!value) return;
    updateBlockData(props.blockId, { level: value });
  }

  function onMessageChange(value: string) {
    updateBlockData(props.blockId, { message: value });
  }

  function onIntegrationSelect(id: string) {
    updateBlockData(props.blockId, {
      connection: id,
    });
  }

  return (
    <Stack px={"xs"}>
      <IntegrationSelector
        group="observability"
        label="Choose Observability Connection"
        description="Select the observability connection to use for this block"
        selectedIntegration={props.blockData.connection}
        onSelect={onIntegrationSelect}
      />
      <Select
        data={[
          { value: "info", label: "Info" },
          { value: "warn", label: "Warn" },
          { value: "error", label: "Error" },
        ]}
        label="Log Level"
        value={props.blockData.level}
        onChange={(value) => onLevelChange(value)}
      />
      <JsTextInput
        value={props.blockData.message}
        label="Message"
        placeholder="Hello World"
        description="The message to log. Also supports JS expressions"
        onValueChange={onMessageChange}
      />
    </Stack>
  );
};

export default CloudLogBlock;
