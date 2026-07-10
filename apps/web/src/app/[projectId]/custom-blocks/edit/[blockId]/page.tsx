"use client";

import React from "react";
import { useParams, useRouter } from "next/navigation";
import { APP_ROUTES } from "@/constants/routes";
import { Button, Box } from "@mantine/core";
import { TbArrowLeft } from "react-icons/tb";

export default function EditCustomBlockPage() {
  const { projectId, blockId } = useParams();
  const router = useRouter();

  return (
    <Box w="100vw" h="100vh" bg="gray.0" pos="relative">
      <Button
        variant="default"
        pos="absolute"
        top={16}
        left={16}
        leftSection={<TbArrowLeft size={16} />}
        onClick={() => router.push(APP_ROUTES.PROJECT_CUSTOM_BLOCKS(projectId as string))}
        style={{ zIndex: 100 }}
      >
        Back to Custom Blocks
      </Button>
      {/* Canvas or form goes here */}
    </Box>
  );
}
