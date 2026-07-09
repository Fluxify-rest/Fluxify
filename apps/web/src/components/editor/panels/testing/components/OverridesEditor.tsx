import React from "react";
import { Box, Group, Text, Select, ActionIcon, Stack, PasswordInput } from "@mantine/core";
import { TbPlus, TbTrash } from "react-icons/tb";
import { integrationIcons, IntegrationVariants } from "../../../../integrationIcons";

interface AppConfigOverride {
  key: string;
  value: string;
}

interface IntegrationOverride {
  existingId: string;
  newId: string;
}

interface OverridesEditorProps {
  appConfigOverrides: AppConfigOverride[];
  onAppConfigOverridesChange: (overrides: AppConfigOverride[]) => void;
  integrationOverrides: IntegrationOverride[];
  onIntegrationOverridesChange: (overrides: IntegrationOverride[]) => void;
  availableAppConfigs: string[];
  availableIntegrations: Array<{ id: string; name: string; variant: string; group: string }>;
}

export default function OverridesEditor({
  appConfigOverrides,
  onAppConfigOverridesChange,
  integrationOverrides,
  onIntegrationOverridesChange,
  availableAppConfigs,
  availableIntegrations,
}: OverridesEditorProps) {
  
  const appConfigOptions = availableAppConfigs.map(c => ({ value: c, label: c }));
  const integrationOptions = availableIntegrations.map(i => ({ value: i.id, label: i.name }));

  const addAppConfig = () => {
    onAppConfigOverridesChange([...appConfigOverrides, { key: "", value: "" }]);
  };

  const removeAppConfig = (index: number) => {
    const newOverrides = [...appConfigOverrides];
    newOverrides.splice(index, 1);
    onAppConfigOverridesChange(newOverrides);
  };

  const updateAppConfig = (index: number, key: string, value: string) => {
    const newOverrides = [...appConfigOverrides];
    newOverrides[index] = { key, value };
    onAppConfigOverridesChange(newOverrides);
  };

  const addIntegration = () => {
    onIntegrationOverridesChange([...integrationOverrides, { existingId: "", newId: "" }]);
  };

  const removeIntegration = (index: number) => {
    const newOverrides = [...integrationOverrides];
    newOverrides.splice(index, 1);
    onIntegrationOverridesChange(newOverrides);
  };

  const updateIntegration = (index: number, existingId: string, newId: string) => {
    const newOverrides = [...integrationOverrides];
    newOverrides[index] = { existingId, newId };
    onIntegrationOverridesChange(newOverrides);
  };

  return (
    <Stack gap="lg">
      <Box>
        <Group justify="space-between" mb="sm">
          <Text size="sm" fw={700}>App Config Overrides</Text>
          <ActionIcon color="violet" variant="light" onClick={addAppConfig}>
            <TbPlus size={16} />
          </ActionIcon>
        </Group>
        
        {appConfigOverrides.length === 0 && (
          <Text size="xs" c="dimmed">No app config overrides configured.</Text>
        )}
        
        <Stack gap="xs">
          {appConfigOverrides.map((override, index) => (
            <Group key={index} grow align="flex-end">
              <Select
                label={index === 0 ? "Key" : undefined}
                placeholder="Select config key"
                data={appConfigOptions}
                value={override.key}
                searchable
                onChange={(val) => updateAppConfig(index, val || "", override.value)}
              />
              <PasswordInput
                label={index === 0 ? "Value (Testing)" : undefined}
                placeholder="Override value"
                value={override.value}
                onChange={(e) => updateAppConfig(index, override.key, e.currentTarget.value)}
              />
              <ActionIcon 
                color="red" 
                variant="subtle" 
                onClick={() => removeAppConfig(index)}
                style={{ flexGrow: 0, flexBasis: '40px' }}
                mb={4}
              >
                <TbTrash size={16} />
              </ActionIcon>
            </Group>
          ))}
        </Stack>
      </Box>

      <Box>
        <Group justify="space-between" mb="sm">
          <Text size="sm" fw={700}>Integration Overrides</Text>
          <ActionIcon color="violet" variant="light" onClick={addIntegration}>
            <TbPlus size={16} />
          </ActionIcon>
        </Group>

        {integrationOverrides.length === 0 && (
          <Text size="xs" c="dimmed">No integration overrides configured.</Text>
        )}

        <Stack gap="xs">
          {integrationOverrides.map((override, index) => (
            <Group key={index} grow align="flex-end">
              <Select
                label={index === 0 ? "Existing Integration" : undefined}
                placeholder="Select integration to override"
                data={integrationOptions.filter(o => o.value !== override.newId)}
                value={override.existingId}
                searchable
                renderOption={({ option }) => {
                  const integration = availableIntegrations.find((i) => i.id === option.value);
                  if (!integration) return <>{option.label}</>;
                  return (
                    <Group gap="sm">
                      {integrationIcons[integration.variant as IntegrationVariants]}
                      <Text size="sm">{option.label}</Text>
                    </Group>
                  );
                }}
                leftSection={
                  override.existingId && availableIntegrations.find(i => i.id === override.existingId)
                    ? integrationIcons[availableIntegrations.find(i => i.id === override.existingId)!.variant as IntegrationVariants]
                    : undefined
                }
                onChange={(val) => updateIntegration(index, val || "", override.newId)}
              />
              <Select
                label={index === 0 ? "Test Integration" : undefined}
                placeholder="Select replacement"
                data={integrationOptions.filter(o => o.value !== override.existingId)}
                value={override.newId}
                searchable
                renderOption={({ option }) => {
                  const integration = availableIntegrations.find((i) => i.id === option.value);
                  if (!integration) return <>{option.label}</>;
                  return (
                    <Group gap="sm">
                      {integrationIcons[integration.variant as IntegrationVariants]}
                      <Text size="sm">{option.label}</Text>
                    </Group>
                  );
                }}
                leftSection={
                  override.newId && availableIntegrations.find(i => i.id === override.newId)
                    ? integrationIcons[availableIntegrations.find(i => i.id === override.newId)!.variant as IntegrationVariants]
                    : undefined
                }
                onChange={(val) => updateIntegration(index, override.existingId, val || "")}
              />
              <ActionIcon 
                color="red" 
                variant="subtle" 
                onClick={() => removeIntegration(index)}
                style={{ flexGrow: 0, flexBasis: '40px' }}
                mb={4}
              >
                <TbTrash size={16} />
              </ActionIcon>
            </Group>
          ))}
        </Stack>
      </Box>
    </Stack>
  );
}
