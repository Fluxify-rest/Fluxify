import React from "react";
import { ActionIcon, Button, Group, Tooltip } from "@mantine/core";
import { TbEdit } from "react-icons/tb";
import FormDialog from "../dialog/formDialog";
import AppConfigForm from "../forms/appConfig";
import { useDisclosure } from "@mantine/hooks";
import { appConfigService } from "@/services/appConfig";
import { useQueryClient } from "@tanstack/react-query";
import { appConfigQuery } from "@/query/appConfigQuery";
import { showErrorNotification } from "@/lib/errorNotifier";
import { showNotification } from "@mantine/notifications";
import { useParams } from "next/navigation";

interface AppConfigTableEditButtonProps {
  id: string;
}

const AppConfigTableEditButton: React.FC<AppConfigTableEditButtonProps> = ({
  id,
}) => {
  const [opened, { open, close }] = useDisclosure(false);
  const [loading, setLoading] = React.useState(false);
  const queryClient = useQueryClient();
  const { projectId } = useParams<{ projectId: string }>();
  const updateMutation = appConfigQuery.update.useMutation(
    projectId as string,
    id,
    queryClient
  );

  async function onSubmit(data: any) {
    setLoading(true);
    try {
      await updateMutation.mutateAsync(data);
      close();
      showNotification({
        title: "Success",
        message: "Config updated successfully",
        color: "green",
      });
    } catch (error: any) {
      showErrorNotification(error, false);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Tooltip label="Edit">
        <ActionIcon variant="light" color="violet" size="sm" onClick={open}>
          <TbEdit size={16} />
        </ActionIcon>
      </Tooltip>
      <FormDialog title="Edit Config" open={opened} onClose={close}>
        <AppConfigForm
          id={id}
          schema={appConfigService.updateRequestBodySchema}
          onSubmit={onSubmit}
        >
          <Group justify="end">
            <Button color="violet" type="submit" loading={loading}>
              Update
            </Button>
            <Button variant="subtle" color="dark" onClick={close}>
              Cancel
            </Button>
          </Group>
        </AppConfigForm>
      </FormDialog>
    </>
  );
};

export default AppConfigTableEditButton;
