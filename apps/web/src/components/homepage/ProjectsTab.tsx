"use client";
import React, { useState } from "react";
import { Button, Card, Center, Grid, Group, Stack, Text } from "@mantine/core";
import { TbPlus } from "react-icons/tb";
import { projectsQuery } from "@/query/projectsQuery";
import QueryLoader from "../query/queryLoader";
import QueryError from "../query/queryError";
import { useQueryClient } from "@tanstack/react-query";
import RequireRoleInAnyProject from "../auth/requireRoleInAnyProject";
import ProjectCard from "./ProjectCard";
import { useDisclosure } from "@mantine/hooks";
import FormDialog from "../dialog/formDialog";
import ProjectForm from "../forms/projectForm";
import { projectsService } from "@/services/projects";
import { z } from "zod";
import { showErrorNotification } from "@/lib/errorNotifier";

function NewProjectFormDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [saving, setSaving] = useState(false);
  const { invalidateAll } = projectsQuery;
  const client = useQueryClient();

  async function onSubmit(
    values: z.infer<typeof projectsService.createRequestBodySchema>
  ) {
    try {
      setSaving(true);
      await projectsService.create(values);
      onClose();
      invalidateAll(client);
    } catch (error: any) {
      showErrorNotification(error);
    } finally {
      setSaving(false);
    }
  }

  return (
    <FormDialog title="Create New Project" open={open} onClose={onClose}>
      <ProjectForm
        zodSchema={projectsService.createRequestBodySchema}
        onSubmit={onSubmit}
        actionSection={
          <Group mt={"xs"} gap={"xs"} justify="end">
            <Button
              loading={saving}
              type="submit"
              variant="outline"
              color="violet"
            >
              Create
            </Button>
            <Button onClick={onClose} variant="subtle" color="dark">
              Cancel
            </Button>
          </Group>
        }
      />
    </FormDialog>
  );
}

const ProjectsTab = () => {
  const { useQuery, invalidate } = projectsQuery.getAll;
  const client = useQueryClient();
  const [open, { open: openDialog, close: closeDialog }] = useDisclosure(false);

  const queryParams = {
    page: 1,
    perPage: 50,
  };

  const { data, isLoading, isError, isRefetching } = useQuery(queryParams);

  if (isLoading || isRefetching) {
    return <QueryLoader skeletonsRows={3} skeletonsCols={3} />;
  }

  if (isError) {
    return (
      <QueryError
        overrideMessage="Error loading projects"
        refetcher={() => invalidate(queryParams, client)}
      />
    );
  }

  return (
    <Stack gap="lg" mt="md">
      <Grid gutter="md">
        {data?.data?.map((project) => (
          <Grid.Col key={project.id} span={{ base: 12, sm: 6, md: 4, lg: 3 }}>
            <ProjectCard
              id={project.id}
              name={project.name!}
              updatedAt={project.updatedAt}
              createdAt={project.createdAt}
            />
          </Grid.Col>
        ))}

        <RequireRoleInAnyProject requiredRole="system_admin">
          <Grid.Col span={{ base: 12, sm: 6, md: 4, lg: 3 }}>
            <Card
              shadow="sm"
              padding="0"
              radius="md"
              bg="gray.3"
              style={{ cursor: "pointer", height: "100%", minHeight: 200 }}
              onClick={openDialog}
            >
              <Center h="100%">
                <Stack align="center" gap={4}>
                  <TbPlus size={48} color="gray" />
                  <Text size="lg" c="dimmed">
                    New Project
                  </Text>
                </Stack>
              </Center>
            </Card>
          </Grid.Col>
        </RequireRoleInAnyProject>
      </Grid>

      <NewProjectFormDialog open={open} onClose={closeDialog} />
    </Stack>
  );
};

export default ProjectsTab;
