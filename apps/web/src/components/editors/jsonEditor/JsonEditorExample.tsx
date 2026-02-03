/**
 * JsonEditor Example / Demo Component
 * Shows how to use the JsonEditor component
 */

import React, { useState } from "react";
import { Stack, Card, Text, Group, Button, Code, Paper } from "@mantine/core";
import JsonEditor from "./JsonEditor";

/**
 * Example 1: Object Editor
 */
export const ObjectEditorExample: React.FC = () => {
  const [savedData, setSavedData] = useState<any>(null);

  const defaultObjectValue = {
    name: "John Doe",
    age: 30,
    email: "john@example.com",
    isActive: true,
    tags: ["developer", "react"],
    metadata: {
      createdAt: "2024-01-01",
      updatedAt: "2024-01-15",
    },
  };

  return (
    <Stack gap="lg">
      <Card withBorder>
        <Card.Section inheritPadding py="md" withBorder>
          <Text fw={600} size="lg">
            Object Editor Example
          </Text>
        </Card.Section>
        <Card.Section inheritPadding py="md">
          <JsonEditor
            rootValueType="object"
            defaultValue={defaultObjectValue}
            onSave={(json) => {
              setSavedData(json);
            }}
          />
        </Card.Section>
      </Card>

      {savedData && (
        <Paper p="md" bg="green.0" withBorder>
          <Text fw={500} mb="xs">
            Last Saved Data:
          </Text>
          <Code block>{JSON.stringify(savedData, null, 2)}</Code>
        </Paper>
      )}
    </Stack>
  );
};

/**
 * Example 2: Array Editor
 */
export const ArrayEditorExample: React.FC = () => {
  const [savedData, setSavedData] = useState<any>(null);

  const defaultArrayValue = [
    { id: 1, name: "Item 1", completed: false },
    { id: 2, name: "Item 2", completed: true },
    { id: 3, name: "Item 3", completed: false },
  ];

  return (
    <Stack gap="lg">
      <Card withBorder>
        <Card.Section inheritPadding py="md" withBorder>
          <Text fw={600} size="lg">
            Array Editor Example
          </Text>
        </Card.Section>
        <Card.Section inheritPadding py="md">
          <JsonEditor
            rootValueType="array"
            defaultValue={defaultArrayValue}
            onSave={(json) => {
              setSavedData(json);
            }}
          />
        </Card.Section>
      </Card>

      {savedData && (
        <Paper p="md" bg="green.0" withBorder>
          <Text fw={500} mb="xs">
            Last Saved Data:
          </Text>
          <Code block>{JSON.stringify(savedData, null, 2)}</Code>
        </Paper>
      )}
    </Stack>
  );
};

/**
 * Example 3: Read-only Mode
 */
export const ReadOnlyExample: React.FC = () => {
  const defaultValue = {
    status: "active",
    count: 42,
    enabled: true,
  };

  return (
    <Card withBorder>
      <Card.Section inheritPadding py="md" withBorder>
        <Text fw={600} size="lg">
          Read-Only Mode Example
        </Text>
      </Card.Section>
      <Card.Section inheritPadding py="md">
        <JsonEditor
          rootValueType="object"
          defaultValue={defaultValue}
          readonly={true}
          onSave={() => {}}
        />
      </Card.Section>
    </Card>
  );
};

/**
 * Main Demo Component
 */
const JsonEditorDemo: React.FC = () => {
  return (
    <Stack gap="xl" p="lg">
      <div>
        <Text fw={700} size="xl" mb="xs">
          JSON Editor Component Library
        </Text>
        <Text c="dimmed" size="sm">
          A complete, production-grade JSON editor built with React, TypeScript,
          and Mantine UI
        </Text>
      </div>

      <ObjectEditorExample />
      <ArrayEditorExample />
      <ReadOnlyExample />
    </Stack>
  );
};

export default JsonEditorDemo;
