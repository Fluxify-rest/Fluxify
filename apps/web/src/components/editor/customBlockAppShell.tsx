"use client";

import { Box, Flex, Group } from "@mantine/core";
import React from "react";
import CustomBlockTopbar from "./customBlockTopbar";

const CustomBlockAppShell = ({ children }: { children: React.ReactNode }) => {
  return (
    <Group
      style={{
        overflow: "hidden",
        position: "relative",
        height: "100vh",
        width: "100vw",
      }}
    >
      <Flex
        direction={"column"}
        h={"100vh"}
        style={{ overflow: "hidden", zIndex: 10 }}
        w={"100%"}
      >
        <CustomBlockTopbar />
        <Box flex={1}>{children}</Box>
      </Flex>
    </Group>
  );
};

export default CustomBlockAppShell;
