"use server";
import LoginForm from "@/components/forms/login";
import { authClient } from "@/lib/auth";
import { Center, Stack, Text } from "@mantine/core";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import React from "react";

const LoginPage = async () => {
  const session = await authClient.getSession({
    fetchOptions: { headers: await headers() },
  });
  if (session.data?.user) {
    return redirect("/");
  }
  return (
    <Stack w={"100vw"} h={"100vh"}>
      <Center h={"100%"}>
        <LoginForm />
      </Center>
    </Stack>
  );
};

export default LoginPage;
