"use client";

import React from "react";
import { Container, Title, Button, Group } from "@mantine/core";
import { TbArrowLeft } from "react-icons/tb";
import { useRouter, useParams } from "next/navigation";
import { APP_ROUTES } from "@/constants/routes";
import CustomBlockForm from "./CustomBlockForm";

export default function CreateCustomBlockPage() {
  const router = useRouter();
  const { projectId } = useParams();

  return (
    <Container size="xl" py="xl">
      <Group mb="xl">
        <Button
          variant="subtle"
          color="gray"
          leftSection={<TbArrowLeft size={16} />}
          onClick={() =>
            router.push(APP_ROUTES.PROJECT_CUSTOM_BLOCKS(projectId as string))
          }
        >
          Back
        </Button>
        <Title order={2}>Create Custom Block</Title>
      </Group>

      <CustomBlockForm />
    </Container>
  );
}
