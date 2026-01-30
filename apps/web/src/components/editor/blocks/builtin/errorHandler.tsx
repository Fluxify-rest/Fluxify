import { NodeProps, Position } from "@xyflow/react";
import BaseBlock from "../base";
import { MdOutlineReportGmailerrorred } from "react-icons/md";
import { useMantineTheme } from "@mantine/core";
import BlockHandle from "../handle";

export default function ErrorHandlerBlock(props: NodeProps) {
  const red = useMantineTheme().colors.red;
  return (
    <BaseBlock  blockId={props.id}
    nodeProps={props}
    icon={<MdOutlineReportGmailerrorred size={15} color={red[7]} />}
    tooltip={props?.data?.label?.toString() ?? ""}
    showOptionsTooltip={!props.dragging}
    blockName="Error Handler"
      labelPlacement="top">
        <BlockHandle type="source"
        blockId={`${props.id}`}
        position={Position.Bottom}
        color={red[7]}
        />
    </BaseBlock>
  );
}
