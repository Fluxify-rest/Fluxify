"use client";

import { Center, Stack, Text } from "@mantine/core";
import { TbCpuOff } from "react-icons/tb";

const AiChatDrawer = () => {
  return (
    <Center h="100%">
      <Stack align="center" gap="xs" c="dimmed">
        <TbCpuOff size={48} />
        <Text fw={500}>AI Chat — Not Implemented</Text>
        <Text size="sm" ta="center" maw={240}>
          This feature is not available in this version of Fluxify.
        </Text>
      </Stack>
    </Center>
  );
};

export default AiChatDrawer;
