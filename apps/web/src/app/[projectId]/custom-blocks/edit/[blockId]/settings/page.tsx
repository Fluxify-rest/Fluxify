"use client";

import React from "react";
import { Container, Title, Button, Group, Center, Loader, Alert } from "@mantine/core";
import { TbArrowLeft, TbAlertCircle } from "react-icons/tb";
import { useRouter, useParams } from "next/navigation";
import { APP_ROUTES } from "@/constants/routes";
import CustomBlockForm from "../../../create/CustomBlockForm";
import { customBlocksQueries } from "@/query/customBlocksQuery";

export default function EditCustomBlockSettingsPage() {
  const router = useRouter();
  const { projectId, blockId } = useParams();
  
  const { data, isLoading, error } = customBlocksQueries.getById.useQuery(blockId as string);

  if (isLoading) {
    return (
      <Center h="100vh">
        <Loader size="lg" color="violet" />
      </Center>
    );
  }

  if (error || !data) {
    return (
      <Center h="100vh" p="xl">
        <Alert icon={<TbAlertCircle size={16} />} title="Error loading block" color="red">
          {error?.message || "Custom block not found"}
        </Alert>
      </Center>
    );
  }

  const initialData = {
    ...data,
    icon: (data.iconUrl && data.iconUrl.includes("data:image")) || (data.iconUrl && data.iconUrl.includes("http")) 
      ? "custom" 
      : "premade-list",
  };

  return (
    <Container size="xl" py="xl">
      <Group mb="xl">
        <Button
          variant="subtle"
          color="gray"
          leftSection={<TbArrowLeft size={16} />}
          onClick={() =>
            router.push(APP_ROUTES.PROJECT_CUSTOM_BLOCKS(projectId as string) + `/edit/${blockId}`)
          }
        >
          Back to Editor
        </Button>
        <Title order={2}>Settings: {data.label}</Title>
      </Group>

      <CustomBlockForm initialValues={initialData} isEdit={true} blockId={blockId as string} />
    </Container>
  );
}
