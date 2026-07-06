---
description: Workflow and structure for creating new Admin API endpoints.
---

# Admin API Development

When building a new Admin API endpoint, we follow a modular feature-based structure located in `apps/server/src/api/v1/`.
Routes are grouped by their domain/group (e.g., `projects`) and then separated into distinct folders for each action (e.g., `create`, `update`, `get-all`).

## Structure

A typical action folder (e.g., `apps/server/src/api/v1/projects/create/`) should contain:
- `dto.ts`: Data Transfer Objects. Defines Zod schemas for request validation (e.g., `requestBodySchema`) and response validation (`responseSchema`).
- `repository.ts`: Handles all direct database interactions using Drizzle ORM.
- `service.ts`: Contains the business logic. It imports from `repository.ts` and processes the data before passing it to or from the route handler.
- `route.ts`: Contains the Hono route definition using `hono-openapi` for Swagger documentation (`describeRoute`, `validator`, `resolver`). Handles middlewares (e.g., `requireSystemAdmin`), validates requests, and returns JSON responses.
- `tests/`: Directory containing unit and integration tests for this action.

## Steps to Add an Endpoint
1. Identify the group and action. If creating a new group, also create a `register.ts` file in the group root to export the routes.
2. Create the action folder with the necessary structure (`dto.ts`, `route.ts`, `service.ts`, `repository.ts`).
3. Define request and response schemas in `dto.ts` using Zod.
4. Implement data operations in `repository.ts`.
5. Implement business logic in `service.ts`.
6. Define the route in `route.ts` with correct OpenAPI descriptions and tags.
7. Register the route in the group's `register.ts` file, and ensure it's loaded in the main API registry.
8. Add corresponding tests.