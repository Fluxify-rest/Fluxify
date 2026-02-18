---
title: Blocks
description: High-level concept of Blocks in Fluxify.
---

# Blocks
Blocks are the basic building modules of Fluxify. Each block is designed to perform one specific task, like  fetching data from a database, or checking a condition.

By connecting these blocks together, you create a visual graph that defines the logic of your API.

## How they work
Every block has:
- **Inputs**: What the block needs to work (e.g., a URL for an HTTP request).
- **Outputs**: What the block produces after it finishes (available as `input` in the next block).
- **Settings**: Configuration that defines how the block behaves.
- **Connections**: Edges that define the flow of execution.

You can customize block behavior using js expressions.
