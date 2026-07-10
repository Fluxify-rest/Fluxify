import React from "react";
import {
  Stack,
  Group,
  TextInput,
  Select,
  Button,
  ActionIcon,
  Paper,
  Text,
  Badge,
} from "@mantine/core";
import { TbPlus, TbTrash, TbChevronDown, TbChevronUp } from "react-icons/tb";
import ArrayEditor from "@/components/editors/jsonEditor/ArrayEditor";

const paramTypes = [
  { value: "text_input", label: "Text Input" },
  { value: "checkbox", label: "Checkbox" },
  { value: "array_editor", label: "Array Editor" },
  { value: "integration_selector", label: "Integration Selector" },
  { value: "dropdown", label: "Dropdown" },
];

const integrationGroups = [
  { value: "database", label: "Databases" },
  { value: "kv", label: "KV" },
  { value: "ai", label: "AI" },
  { value: "baas", label: "BaaS" },
  { value: "observability", label: "Observability" },
];

export default function InputParamsEditor({ form }: { form: any }) {
  const fields = form.values.inputParams || [];

  const addParam = () => {
    form.insertListItem("inputParams", {
      type: "text_input",
      name: "",
      label: "",
    });
  };

  const removeParam = (index: number) => {
    form.removeListItem("inputParams", index);
  };

  return (
    <Stack gap="md">
      <Group justify="space-between">
        <Text fw={600} size="sm">
          Input Parameters
        </Text>
        <Button
          size="xs"
          variant="light"
          color="violet"
          leftSection={<TbPlus size={14} />}
          onClick={addParam}
        >
          Add Parameter
        </Button>
      </Group>

      {fields.length === 0 ? (
        <Paper p="xl" withBorder bg="gray.0" ta="center">
          <Text c="dimmed" size="sm">
            No input parameters defined. Click "Add Parameter" to start.
          </Text>
        </Paper>
      ) : (
        <Stack gap="md">
          {fields.map((field: any, index: number) => (
            <Paper key={index} p="md" withBorder bg="gray.0">
              <Stack gap="sm">
                <Group justify="space-between">
                  <Badge variant="light" color="violet">
                    Param #{index + 1}
                  </Badge>
                  <ActionIcon
                    color="red"
                    variant="subtle"
                    onClick={() => removeParam(index)}
                  >
                    <TbTrash size={16} />
                  </ActionIcon>
                </Group>

                <Group grow align="flex-start">
                  <TextInput
                    label="Name"
                    placeholder="e.g. param_name"
                    required
                    {...form.getInputProps(`inputParams.${index}.name`)}
                    description="Lowercase and underscores only"
                  />
                  <TextInput
                    label="Label"
                    placeholder="e.g. User Name"
                    required
                    {...form.getInputProps(`inputParams.${index}.label`)}
                  />
                  <Select
                    label="Type"
                    data={paramTypes}
                    required
                    {...form.getInputProps(`inputParams.${index}.type`)}
                  />
                </Group>

                {field.type === "integration_selector" && (
                  <Group grow align="flex-start">
                    <Select
                      label="Integration Group"
                      data={integrationGroups}
                      required
                      {...form.getInputProps(`inputParams.${index}.group`)}
                    />
                    <TextInput
                      label="Variant (Optional)"
                      placeholder="e.g. postgresql"
                      {...form.getInputProps(`inputParams.${index}.variant`)}
                    />
                    {/* Tags would realistically be a MultiSelect, simplified for now */}
                    <TextInput
                      label="Tags (Comma separated)"
                      placeholder="e.g. primary, readonly"
                      value={form.values.inputParams[index].tags?.join(", ") || ""}
                      onChange={(e) => {
                        const tags = e.target.value
                          .split(",")
                          .map((t) => t.trim())
                          .filter(Boolean);
                        form.setFieldValue(`inputParams.${index}.tags`, tags);
                      }}
                    />
                  </Group>
                )}

                {field.type === "dropdown" && (
                  <Stack gap="xs">
                    <Text size="sm" fw={500}>
                      Dropdown Options
                    </Text>
                    <ArrayEditor
                      value={form.values.inputParams[index].options || []}
                      onChange={(val) =>
                        form.setFieldValue(`inputParams.${index}.options`, val)
                      }
                      depth={0}
                    />
                  </Stack>
                )}
              </Stack>
            </Paper>
          ))}
        </Stack>
      )}
    </Stack>
  );
}
