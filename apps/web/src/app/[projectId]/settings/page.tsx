"use server";
import ProjectSettings from "@/components/project/settings";
import { authClient } from "@/lib/auth";
import { canAccessProject } from "@fluxify/server/src/lib/acl";
import { Stack, Text } from "@mantine/core";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import React from "react";

const Page = async (params: any) => {
  const { projectId } = await params.params;
  const headersList = await headers();
  const session = await authClient.getSession({
    fetchOptions: { headers: headersList },
  });
  
  if (!session.data?.user) {
    redirect("/login");
  }
  
  const hasAccess = canAccessProject(
    (session.data as any).acl,
    projectId,
    "creator",
  );
  
  if (!hasAccess) {
    redirect("/");
  }
  
  const disableNpm = process.env.DISABLE_NPM;

  return (
    <Stack p="md" h="100%">
      <Text size="2rem" fw={500}>Project Settings</Text>
      <div style={{ flex: 1, overflowY: "auto" }}>
        <ProjectSettings disableNpm={disableNpm === "true"} />
      </div>
    </Stack>
  );
};

export default Page;
