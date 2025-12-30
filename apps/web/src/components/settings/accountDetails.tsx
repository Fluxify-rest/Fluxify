"use client";

import { authClient } from "@/lib/auth";
import React, { useState } from "react";
import QueryLoader from "../query/queryLoader";
import QueryError from "../query/queryError";
import {
  Box,
  Button,
  Divider,
  PasswordInput,
  Stack,
  Text,
  TextInput,
} from "@mantine/core";
import { TbDeviceFloppy } from "react-icons/tb";
import { showErrorNotification } from "@/lib/errorNotifier";
import { showNotification } from "@mantine/notifications";

const AccountDetails = () => {
  const { data, error, isPending, refetch, isRefetching } =
    authClient.useSession();
  const [username, setUsername] = useState(data?.user.name || "");
  const [password, setPassword] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [pwdLoading, setPwdLoading] = useState(false);
  if (isPending) return <QueryLoader />;
  if (error || !data?.user)
    return (
      <QueryError
        error={error!}
        overrideMessage="Failed to load the profile"
        refetcher={refetch}
      />
    );
  function onNameChange(value: string) {
    setUsername(value);
  }
  async function onSaveClicked() {
    if (!username) return;
    try {
      const result = await authClient.updateUser({
        name: username,
      });
      if (result.error) {
        showNotification({
          message: result.error.message,
          color: "red",
        });
      } else {
        showNotification({
          message: "Saved successfully",
          color: "green",
        });
      }
    } catch (error: any) {
      showErrorNotification(error, true);
    }
  }
  function onPasswordChange(value: string) {
    setPassword(value);
  }
  function onCurrentPasswordChange(value: string) {
    setCurrentPassword(value);
  }
  async function onSavePasswordClicked() {
    if (!password) return;
    try {
      setPwdLoading(true);
      const result = await authClient.changePassword({
        currentPassword,
        newPassword: password,
      });
      if (result.error) {
        showNotification({
          title: "Error",
          message: result.error.message,
          color: "red",
        });
      } else {
        showNotification({
          message: "Saved successfully",
          color: "green",
        });
      }
    } catch (error: any) {
      showNotification({
        message: "Failed to save new password",
        title: "Error",
        color: "red",
      });
    } finally {
      setPwdLoading(false);
    }
  }
  const { email, id } = data!.user;
  return (
    <Stack w={"min(50%, 500px)"}>
      <TextInput label="User Id" value={id} disabled />
      <TextInput
        label="User name"
        value={username}
        description="Name of the user"
        name="username"
        onChange={(e) => onNameChange(e.target.value)}
      />
      <TextInput label="Email" value={email} readOnly />
      <Button
        color="violet"
        leftSection={<TbDeviceFloppy size={20} />}
        w={"fit-content"}
        variant="outline"
        onClick={onSaveClicked}
        loading={isPending || isRefetching}
      >
        Save
      </Button>
      <Divider />
      <Stack>
        <Text size="1.5rem" fw={"500"} c={"dark"}>
          Password
        </Text>
        <PasswordInput
          description="Type your current password here"
          label="Current Password"
          name="password"
          value={currentPassword}
          onChange={(e) => onCurrentPasswordChange(e.target.value)}
        />
        <PasswordInput
          description="Type a new password here"
          label="New Password"
          name="new_password"
          value={password}
          onChange={(e) => onPasswordChange(e.target.value)}
        />
        <Button
          color="red.8"
          variant="outline"
          onClick={onSavePasswordClicked}
          loading={pwdLoading}
        >
          Change Password
        </Button>
      </Stack>
    </Stack>
  );
};

export default AccountDetails;
