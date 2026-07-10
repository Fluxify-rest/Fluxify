"use client";
import React, { useEffect } from "react";
import { FlowEditorProvider } from "@/components/editor/flowEditor/flowEditorContext";
import FlowEditor from "@/components/editor/flowEditor";
import { customBlocksQueries } from "@/query/customBlocksQuery";
import { Center, Loader, Alert } from "@mantine/core";
import { CanvasStoreProvider } from "@/store/canvas";
import { BlockDataStoreProvider } from "@/store/blockDataStore";
import { EditorStoreProvider } from "@/store/editor";
import { useAuthStore } from "@/store/auth";
import { canAccess } from "@fluxify/server/src/lib/acl";
import SaveEditorButton from "@/components/editor/saveEditorButton";
import { Box, Group, Menu, ActionIcon, Text, Button } from "@mantine/core";
import { TbDots, TbEdit, TbTrash, TbAlertCircle, TbArrowLeft } from "react-icons/tb";
import CustomBlockAppShell from "@/components/editor/customBlockAppShell";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { customBlocksService } from "@/services/customBlocks";
import { useRouter } from "next/navigation";
import { APP_ROUTES } from "@/constants/routes";

const CustomBlockCanvas = ({ blockId, projectId }: { blockId: string; projectId: string }) => {
  const { data, isLoading, error } = customBlocksQueries.getCanvasItems.useQuery(blockId);
  const { data: blockData, isLoading: isBlockLoading } = customBlocksQueries.getById.useQuery(blockId);
  const { acl, userData } = useAuthStore();
  const queryClient = useQueryClient();
  const router = useRouter();

  if (isLoading || isBlockLoading) {
    return (
      <Center h="100%">
        <Loader size="lg" color="violet" />
      </Center>
    );
  }

  if (error) {
    return (
      <Center h="100%" p="xl">
        <Alert
          icon={<TbAlertCircle size={16} />}
          title="Error loading canvas"
          color="red"
          variant="filled"
        >
          {error.message}
        </Alert>
      </Center>
    );
  }

  if (!data || !blockData) return null;

  const userRole = acl[projectId] || acl["*"];
  const readonly = userData?.isSystemAdmin ? false : (userRole ? !canAccess(userRole, "creator") : true);

  const initialBlockData = data.blocks.reduce((acc: any, block: any) => {
    acc[block.id] = block.data;
    return acc;
  }, {});

  const initialEdges = data.edges.map((edge: any) => ({
    id: edge.id,
    source: edge.from,
    target: edge.to,
    sourceHandle: edge.fromHandle,
    targetHandle: edge.toHandle,
    type: "custom",
  }));

  return (
    <EditorStoreProvider>
      <FlowEditorProvider
        value={{
        readonly,
        entityId: blockId,
        entityType: "customBlock",
        projectId: projectId,
        features: {
          zoomPanel: true,
          addBlockSidebar: true,
          undoRedo: true,
          stickyNoteBtn: true,
          keyboardAccessibility: true,
          aiAssistant: false,
        },
      }}
    >
      <CanvasStoreProvider initialBlocks={data.blocks as any} initialEdges={initialEdges}>
        <BlockDataStoreProvider initialBlockData={initialBlockData}>
          <CustomBlockAppShell>
            <FlowEditor />
          </CustomBlockAppShell>
        </BlockDataStoreProvider>
      </CanvasStoreProvider>
    </FlowEditorProvider>
    </EditorStoreProvider>
  );
};

export default CustomBlockCanvas;
