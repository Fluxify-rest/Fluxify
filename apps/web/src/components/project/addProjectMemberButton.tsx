import { Box, Button } from "@mantine/core";
import React from "react";
import { TbUserPlus } from "react-icons/tb";

const AddProjectMemberButton = () => {
  return (
    <Box>
      <Button
        variant="outline"
        size="xs"
        color="violet"
        leftSection={<TbUserPlus size={16} />}
      >
        Add Member
      </Button>
    </Box>
  );
};

export default AddProjectMemberButton;
