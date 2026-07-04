"use client";
import React from "react";
import { Stack, Group, Text, ActionIcon, Center } from "@mantine/core";
import { TbX, TbCodeCircle2 } from "react-icons/tb";

interface Props {
  onClose: () => void;
}

const EmptyArtifactPanel = ({ onClose }: Props) => {
  return (
    <Stack h="100%" w={400} bg="gray.0" style={{ borderLeft: "1px solid #eee" }}>
      <Group justify="space-between" p="md" style={{ borderBottom: "1px solid #eee" }}>
        <Group gap="xs">
          <TbCodeCircle2 size={20} />
          <Text fw={500}>Artifacts</Text>
        </Group>
        <ActionIcon variant="subtle" color="gray" onClick={onClose}>
          <TbX size={18} />
        </ActionIcon>
      </Group>

      <Center flex={1}>
        <Text c="dimmed">Artifact generation is not yet implemented.</Text>
      </Center>
    </Stack>
  );
};

export default EmptyArtifactPanel;
