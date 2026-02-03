import { isAxiosError } from "axios";
import { integrationsQuery } from "@/query/integrationsQuery";
import { Button } from "@mantine/core";
import { notifications, showNotification } from "@mantine/notifications";
import React from "react";
import { TbPlugConnected } from "react-icons/tb";

type PropTypes = {
  data: any;
  variant: string;
  group: string;
  onConnectionOk?: () => void;
  onConnectionError?: () => void;
};

const TestIntegrationConnectionButton = (props: PropTypes) => {
  const { mutateAsync, isPending } =
    integrationsQuery.testConnection.mutation();

  async function onClick() {
    if (!props.variant || !props.group) {
      return;
    }
    try {
      const res = await mutateAsync({
        variant: props.variant,
        group: props.group,
        config: props.data,
      });
      if (res.success) {
        notifications.show({
          message: "Connection successful",
          color: "green",
        });
      }
    } catch (e) {
      const isAxios = isAxiosError(e);
      if (isAxios) {
        notifications.show({
          title: "Connection failed",
          message:
            e.response?.data.error ??
            "Something went wrong while testing the connection",
          color: "red",
        });
      }
    }
  }

  return (
    <Button
      onClick={onClick}
      variant="outline"
      color="green.8"
      loading={isPending}
      leftSection={<TbPlugConnected size={15} />}
    >
      Test Connection
    </Button>
  );
};

export default TestIntegrationConnectionButton;
