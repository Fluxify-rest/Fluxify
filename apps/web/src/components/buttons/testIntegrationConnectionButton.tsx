import { isAxiosError } from "axios";
import { useParams } from "next/navigation";
import { integrationsQuery } from "@/query/integrationsQuery";
import { Button } from "@mantine/core";
import { notifications, showNotification } from "@mantine/notifications";
import React from "react";
import { TbPlayerStopFilled, TbPlugConnected } from "react-icons/tb";

type PropTypes = {
  data: any;
  variant: string;
  group: string;
  showStop?: boolean;
  onConnectionOk?: () => void;
  onConnectionError?: () => void;
};

const TestIntegrationConnectionButton = (props: PropTypes) => {
  const { projectId } = useParams<{ projectId: string }>();
  const { mutateAsync, isPending, reset } =
    integrationsQuery.testConnection.mutation(projectId || "");

  async function onClick() {
    if (isPending && props.showStop) {
      reset();
      return;
    }
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
          message: "Connection successful " + status,
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
      color={props.showStop && isPending ? "red.8" : "green.8"}
      loading={!props.showStop && isPending}
      leftSection={
        props.showStop && isPending ? (
          <TbPlayerStopFilled size={15} />
        ) : (
          <TbPlugConnected size={15} />
        )
      }
    >
      {props.showStop && isPending ? "Stop" : "Test Connection"}
    </Button>
  );
};

export default TestIntegrationConnectionButton;
