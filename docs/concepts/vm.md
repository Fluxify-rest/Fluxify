---
title: JavaScript Virtual Machine (VM)
description: How Fluxify executes custom JavaScript safely.
---

# JavaScript Virtual Machine (VM)

Fluxify uses a sandboxed JavaScript Virtual Machine (VM) to execute your custom JavaScript code within blocks like **JS Runner**, **Set Variable**, **Transformer**, and more.

## Safety & Security

- **Sandboxed Environment**: Your code runs in a secure context, separated from the core application.
- **No External Access**: You cannot access the server's file system or internal modules directly.
- **Timeout**: All scripts have a maximum execution time of **4 seconds** to prevent infinite loops from freezing the system.
- **No Node.js Globals**: Standard Node.js global objects (like `process` or `fs`) are **not** accessible for security reasons.
- **Previous block's output**: The output of the previous block is available as `input` in the context.

## Supported Features

- **Sync & Async**: You can write synchronous code or use `await` for asynchronous operations.
- **Input Variables**: Data passed to the block is often available as `input` or other specific variables in the context.
- **Truthiness**: The VM has helper logic to determine if values are "truthy" or "falsy" (e.g., empty objects might be considered true).
