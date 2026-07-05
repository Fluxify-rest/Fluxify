import { useAppConfig } from "@/context/appConfigPage";
import { ActionIcon } from "@mantine/core";
import { useQueryClient } from "@tanstack/react-query";
import React, { useCallback, useMemo, useState } from "react";
import { TbTrash } from "react-icons/tb";
import ConfirmDialog from "../dialog/confirmDialog";
import { appConfigQuery } from "@/query/appConfigQuery";
import { showNotification } from "@mantine/notifications";
import { useParams } from "next/navigation";

const AppConfigDeleteButton = () => {
  const queryClient = useQueryClient();
  const { projectId } = useParams<{ projectId: string }>();
  const { selectedItems, clearSelection } = useAppConfig();
  const selectedIds = useMemo(
    () => Array.from(selectedItems).map((item) => Number(item)),
    [selectedItems]
  );
  const deleteBulkMutation = appConfigQuery.deleteBulk.useMutation(
    projectId as string,
    queryClient
  );

  const [open, setOpen] = useState(false);

  const handleDelete = useCallback(async () => {
    if (selectedItems.size === 0) return;
    try {
      await deleteBulkMutation.mutateAsync({ ids: selectedIds });
      clearSelection();
    } catch (error) {
      showNotification({
        title: "Error",
        message: "Failed to delete items",
        color: "red",
      });
    } finally {
      setOpen(false);
    }
  }, [selectedIds]);

  return (
    <>
      <ActionIcon
        color="red"
        variant="light"
        disabled={selectedItems.size === 0}
        onClick={() => setOpen(true)}
      >
        <TbTrash />
      </ActionIcon>
      <ConfirmDialog
        title="Delete"
        children="Are you sure you want to delete these items?"
        onConfirm={handleDelete}
        open={open}
        onClose={() => setOpen(false)}
        confirmText="Delete"
        confirmColor="red"
      />
    </>
  );
};

export default AppConfigDeleteButton;
