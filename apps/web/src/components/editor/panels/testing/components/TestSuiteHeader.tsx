import React from "react";
import {
  Box,
  Group,
  Text,
  Badge,
  ActionIcon,
  Menu,
} from "@mantine/core";
import {
  TbCheck,
  TbX,
  TbDotsVertical,
  TbEdit,
  TbTrash,
} from "react-icons/tb";

interface TestSuiteHeaderProps {
  status: "passed" | "failed" | null;
  onEdit: () => void;
  onDelete: () => void;
  urlBar?: React.ReactNode;
  actions?: React.ReactNode;
}

export default function TestSuiteHeader({
  status,
  onEdit,
  onDelete,
  urlBar,
  actions,
}: TestSuiteHeaderProps) {
  return (
    <Box
      px="xl"
      py="lg"
      style={{
        borderBottom: "1px solid #eee",
        backgroundColor: "white",
        zIndex: 5,
        flexShrink: 0,
      }}
    >
      <Group justify="space-between" align="flex-start" wrap="nowrap">
        <Box style={{ flexGrow: 1 }}>
          {urlBar}
        </Box>
        <Group gap="xs" wrap="nowrap" align="center" mt={4}>
          {status === "passed" && (
            <Badge
              variant="light"
              color="green"
              radius="sm"
              leftSection={<TbCheck size={12} />}
            >
              Passed
            </Badge>
          )}
          {status === "failed" && (
            <Badge
              variant="light"
              color="red"
              radius="sm"
              leftSection={<TbX size={12} />}
            >
              Failed
            </Badge>
          )}
          {actions}
          <Menu shadow="md" width={200} position="bottom-end">
            <Menu.Target>
              <ActionIcon variant="subtle" size="lg" color="dark">
                <TbDotsVertical />
              </ActionIcon>
            </Menu.Target>

            <Menu.Dropdown>
              <Menu.Item leftSection={<TbEdit size={14} />} onClick={onEdit}>
                Edit Suite Info
              </Menu.Item>
              <Menu.Divider />
              <Menu.Item
                color="red"
                leftSection={<TbTrash size={14} />}
                onClick={onDelete}
              >
                Delete Suite
              </Menu.Item>
            </Menu.Dropdown>
          </Menu>
        </Group>
      </Group>
    </Box>
  );
}
