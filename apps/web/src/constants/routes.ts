export const APP_ROUTES = {
  HOME: "/new_homepage",
  PROJECT_AI: (projectId: string) => `/new_project/${projectId}/ai`,
  PROJECT_ROUTES: (projectId: string) => `/new_project/${projectId}/routes`,
  PROJECT_EXECUTIONS: (projectId: string) => `/new_project/${projectId}/executions`,
  PROJECT_INTEGRATIONS: (projectId: string) => `/new_project/${projectId}/integrations`,
  PROJECT_APP_CONFIG: (projectId: string) => `/new_project/${projectId}/app-config`,
  PROJECT_SETTINGS: (projectId: string) => `/new_project/${projectId}/settings`,
  PROJECT_AI_CONVERSATION: (projectId: string, conversationId: string) => `/new_project/${projectId}/ai/${conversationId}`,
};
