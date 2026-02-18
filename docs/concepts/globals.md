---
title: Globals
description: Shared state across the application.
---

# Globals

**Globals** are variables or settings that can be accessed from any part of the request.

## Global Context
Every time the request runs, it has a global scope where you can store data. 
- You can access these variables by their name directly (e.g., `userCount`).
- Assigning a value to a name in a script (like `status = "active";`) makes it available to all future blocks in that same run.

## Application State
Some information is global to the entire system, not just one request:
- **App Config**: Secrets and settings like API keys that are shared across all your workflows.
- **Database Connections**: Pre-configured connections that any block can use to talk to your databases.
