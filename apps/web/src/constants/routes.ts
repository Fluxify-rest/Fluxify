export const APP_ROUTES = {
	HOME: "/",
	PROJECT_AI: (projectId: string) => `/${projectId}/ai`,
	PROJECT_ROUTES: (projectId: string) => `/${projectId}/routes`,
	PROJECT_EXECUTIONS: (projectId: string) => `/${projectId}/executions`,
	PROJECT_INTEGRATIONS: (projectId: string) => `/${projectId}/integrations`,
	PROJECT_APP_CONFIG: (projectId: string) => `/${projectId}/app-config`,
	PROJECT_SETTINGS: (projectId: string) => `/${projectId}/settings`,
	PROJECT_CUSTOM_BLOCKS: (projectId: string) => `/${projectId}/custom-blocks`,
	PROJECT_AI_CONVERSATION: (projectId: string, conversationId: string) =>
		`/${projectId}/ai/${conversationId}`,
};
