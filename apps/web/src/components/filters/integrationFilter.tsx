"use client";
import {
  useIntegrationActions,
  useIntegrationState,
} from "@/store/integration";
import {
  ActionIcon,
  Box,
  Center,
  Divider,
  Group,
  Indicator,
  Paper,
  Select,
  Stack,
  Text,
} from "@mantine/core";
import React from "react";
import DebouncedTextInput from "../editors/debouncedTextInput";
import { getIntegrationsVariants } from "@fluxify/server/src/api/v1/integrations/helpers";
import { TbFilter } from "react-icons/tb";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa6";

const IntegrationFilter = () => {
  const { setFilterVariant, setSearchQuery, toggleFilterVisibility } =
    useIntegrationActions();
  const { filterVariant, searchQuery, selectedMenu, filterHidden } =
    useIntegrationState();
  if (filterHidden) {
    return (
      <Box p={"xs"}>
        <Indicator
          size={"6"}
          color={"red"}
          disabled={!(!!filterVariant || !!searchQuery)}
        >
          <ActionIcon
            onClick={toggleFilterVisibility}
            w={"auto"}
            h={"fit-content"}
            variant="subtle"
            color="dark"
          >
            <TbFilter size={15} />
          </ActionIcon>
        </Indicator>
      </Box>
    );
  }
  return (
    <Stack w="20%" h="100%" style={{ minWidth: 0, overflowY: "auto" }}>
      <Paper shadow="sm" w={"100%"} p={"sm"} withBorder>
        <Group justify="space-between">
          <Text>Filter Integrations</Text>
          <ActionIcon
            onClick={toggleFilterVisibility}
            variant="subtle"
            color="dark"
          >
            <FaChevronRight size={15} />
          </ActionIcon>
        </Group>
        <Divider my={4} />
        <Stack>
          <DebouncedTextInput
            label="Search"
            placeholder="Search..."
            value={searchQuery}
            onValueChange={setSearchQuery}
            debounceDelay={150}
          />
          <Select
            data={getIntegrationsVariants(selectedMenu)}
            value={filterVariant}
            onChange={(e) => setFilterVariant(e || "")}
            placeholder="PostgreSQL"
            label="By type"
            clearable
          />
        </Stack>
      </Paper>
    </Stack>
  );
};

export default IntegrationFilter;
