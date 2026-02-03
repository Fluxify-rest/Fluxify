import React, { useState } from "react";
import { ifBlockSchema } from "@fluxify/blocks";
import z from "zod";
import {
  ActionIcon,
  Box,
  Button,
  ButtonGroup,
  Center,
  Divider,
  Grid,
  Group,
  Select,
  Stack,
  Text,
} from "@mantine/core";
import JsEditButton from "./jsEditButton";
import JsTextInput from "./jsTextInput";
import { TbTrashFilled } from "react-icons/tb";

interface Props {
  conditions: z.infer<typeof ifBlockSchema>["conditions"];
  onChange?: (conditions: z.infer<typeof ifBlockSchema>["conditions"]) => void;
  disableJsConditions?: boolean;
  ignoreOperators?: string[];
}

const ConditionsEditor = (props: Props) => {
  const [conditions, setConditions] = useState(props.conditions);

  const onAddCondition = (chain: "and" | "or" = "and") => {
    const newConditions = [...conditions];
    newConditions.push({ lhs: "", rhs: "", operator: "eq", chain });
    setConditions(newConditions);
    if (props.onChange) props.onChange(newConditions);
  };
  const onRemoveCondition = (index: number) => {
    const newConditions = [...conditions];
    newConditions.splice(index, 1);
    setConditions(newConditions);
    if (props.onChange) props.onChange(newConditions);
  };
  const onLHSChange = (index: number, value: string) => {
    const newConditions = [...conditions];
    newConditions[index].lhs = value;
    setConditions(newConditions);
    if (props.onChange) props.onChange(newConditions);
  };
  const onRHSChange = (index: number, value: string) => {
    const newConditions = [...conditions];
    newConditions[index].rhs = value;
    setConditions(newConditions);
    if (props.onChange) props.onChange(newConditions);
  };
  const onOperatorChange = (index: number, value: string | null) => {
    if (!value) return;
    const newConditions = [...conditions];
    newConditions[index].operator = value as z.infer<
      typeof ifBlockSchema
    >["conditions"][number]["operator"];
    setConditions(newConditions);
    if (props.onChange) props.onChange(newConditions);
  };
  const onJsChange = (index: number, value: string) => {
    const newConditions = [...conditions];
    newConditions[index].js = value;
    setConditions(newConditions);
    if (props.onChange) props.onChange(newConditions);
  };

  return (
    <Stack gap={"xs"}>
      {conditions.map((condition, index) => {
        const isJs = condition.operator === "js";
        const hideRhs =
          condition.operator === "is_empty" ||
          condition.operator === "is_not_empty";
        return (
          <Box key={index}>
            {condition.chain === "or" && (
              <Group my={"xs"}>
                <Divider flex={1} w={"100%"} />
                <Text fw={"bold"}>OR</Text>
                <Divider flex={1} w={"100%"} />
              </Group>
            )}
            {/* convert isJs block of group to grid */}
            {isJs && (
              <Grid columns={11}>
                <Grid.Col span={8}>
                  <JsEditButton
                    value={condition.js || ""}
                    onChange={(value) => onJsChange(index, value)}
                  />
                </Grid.Col>
                <Grid.Col span={2}>
                  <Select
                    value={condition.operator}
                    data={
                      props.disableJsConditions
                        ? operators.filter((x) => x.value !== "js")
                        : operators
                    }
                    onChange={(value) => onOperatorChange(index, value)}
                  />
                </Grid.Col>
                <Grid.Col span={1}>
                  <Center h={"100%"}>
                    <ActionIcon
                      onClick={() => onRemoveCondition(index)}
                      variant="outline"
                      color="red"
                    >
                      <TbTrashFilled />
                    </ActionIcon>
                  </Center>
                </Grid.Col>
              </Grid>
            )}
            {!isJs && (
              <Grid columns={11}>
                <Grid.Col span={4}>
                  <JsTextInput
                    value={condition.lhs.toString()}
                    onValueChange={(value) => onLHSChange(index, value)}
                  />
                </Grid.Col>
                <Grid.Col span={hideRhs ? 6 : 2}>
                  <Select
                    value={condition.operator}
                    data={
                      props.disableJsConditions
                        ? operators.filter(
                            (x) =>
                              x.value !== "js" &&
                              !props.ignoreOperators?.includes(x.value),
                          )
                        : operators
                    }
                    onChange={(value) => onOperatorChange(index, value)}
                  />
                </Grid.Col>
                {!hideRhs && (
                  <Grid.Col span={4}>
                    <JsTextInput
                      value={condition.rhs.toString()}
                      onValueChange={(value) => onRHSChange(index, value)}
                      disabled={hideRhs}
                    />
                  </Grid.Col>
                )}
                <Grid.Col span={1}>
                  <Center h={"100%"}>
                    <ActionIcon
                      onClick={() => onRemoveCondition(index)}
                      variant="outline"
                      color="red"
                    >
                      <TbTrashFilled />
                    </ActionIcon>
                  </Center>
                </Grid.Col>
              </Grid>
            )}
          </Box>
        );
      })}
      <ButtonGroup>
        <Button
          color="violet"
          fullWidth
          variant="outline"
          onClick={() => onAddCondition("and")}
        >
          Add {conditions.length > 0 && "And"} Condition
        </Button>
        {conditions.length > 0 && (
          <Button
            color="violet"
            fullWidth
            variant="outline"
            onClick={() => onAddCondition("or")}
          >
            Add Or Condition
          </Button>
        )}
      </ButtonGroup>
    </Stack>
  );
};

// "eq", "neq", "gt", "gte", "lt", "lte", "js"
const operators = [
  { value: "eq", label: "=" },
  { value: "neq", label: "!=" },
  { value: "gt", label: ">" },
  { value: "gte", label: ">=" },
  { value: "lt", label: "<" },
  { value: "lte", label: "<=" },
  { value: "js", label: "JS" },
  { value: "is_empty", label: "Is Empty/Null" },
  { value: "is_not_empty", label: "Is Not Empty/Null" },
];

export default ConditionsEditor;
