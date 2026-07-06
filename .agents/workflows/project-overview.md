---
description: Overview of the Fluxify project architecture, tech stack, and development guidelines.
---
# Fluxify Project Instructions for Vibe Coding

## 1. Project Overview
Fluxify is a **low-code backend development platform** that empowers developers to build and deploy APIs rapidly. It bridges the gap between visual development and production-grade infrastructure by providing a seamless workflow for designing, testing, and deploying backend logic.

### 2.1 Key Components
- **Web Application**: The main UI for the platform located at `apps/web`.
- **Admin API Server**: The main admin API server for the platform located at `apps/server`.
- **Blocks**: The main built-in blocks logic located at `packages/blocks`.
- **Lib**: Useful utilities for the platform located at `packages/lib`.
- **Adapters**: The main adapters (for integrations with other services) located at `packages/adapters`.

## Development Guidelines
- **Code Style**: The platform uses a consistent code style that is easy to read and maintain.
  - Follow rules for writing code (see rules.md).
  - Uses bun as both runtime and package manager.
  - Uses tsgo for type safety and linting.
  - Uses `fta-cli` for checking code maintainability.
- **Documentation**: The platform is documented-enough with explanations of the architecture and features.
- **Testing**: The platform is well-tested with a comprehensive suite of unit tests. For every new feature, unit tests are a must. Use Bun's built-in test runner.

### Commands Available
- `bun run dev`: Starts all development servers (web, server, ai-gateway, docs).
- `bun run build`: Builds the production version of the app using Turbo.
- `bun run test:unit`: Runs the unit test suite.
- `bun run test:integration`: Runs the integration test suite.
- `bun run lint`: Lints the code using Turbo.
- `bun run analyze`: Analyzes the code for maintainability using fta-cli.

## Tech Stack
- **Frontend**: React, Mantine, Bun, Mantine Notifications
- **Backend**: Bun, Hono, Drizzle, Zod
- **Database**: PostgreSQL, Redis
- **Authentication**: BetterAuth
- **CI/CD**: GitHub Actions
- **Deployment**: Docker
- **Testing**: Bun's built-in test runner (currently **.test.ts** files are used for unit tests, in future **.spec.ts** files will be used for integration tests)

## Feature Development
- **Integration**: Refer to integration.md for building integrations & its guidelines.
- **Adding Admin API**: Refer to admin-api.md for building admin APIs & its guidelines.
- **Adding Blocks**: Refer to blocks.md for building blocks & its guidelines.
