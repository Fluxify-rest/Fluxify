"use client";

import { Divider, Group, Stack, Text } from "@mantine/core";
import React from "react";
import AddProjectMemberButton from "./addProjectMemberButton";
import ProjectMember from "./projectMember";

const ProjectMembersList = () => {
  return (
    <Stack>
      <Group justify="space-between">
        <Text size="lg" fw={"500"} c="dark">
          Project Members List
        </Text>
        <Group>
          <AddProjectMemberButton />
        </Group>
      </Group>
      <Divider />
      {/* <ProjectMember /> */}
    </Stack>
  );
};

export default ProjectMembersList;
