"use client";

import React from "react";
import { useParams, useRouter } from "next/navigation";
import { APP_ROUTES } from "@/constants/routes";
import { Button, Box } from "@mantine/core";
import { TbArrowLeft } from "react-icons/tb";
import CustomBlockCanvas from "./CustomBlockCanvas";

export default function EditCustomBlockPage() {
  const { projectId, blockId } = useParams();
  const router = useRouter();

  return (
    <Box w="100vw" h="100vh" bg="gray.0" pos="relative">
      <Box h="100%" w="100%">
        <CustomBlockCanvas blockId={blockId as string} projectId={projectId as string} />
      </Box>
    </Box>
  );
}
