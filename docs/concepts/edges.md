---
title: Edges
description: Connecting blocks to form logic.
---

# Edges
**Edges** are the visual lines that connect one block to another. They determine the order in which your blocks will execute.

## Types of Connections
- **Direct Flow**: A simple line between two blocks. The second block runs as soon as the first one finishes successfully.
- **Decision Paths**: Used by blocks like **If Condition**. You can connect the "True" output to one path and the "False" output to another.
- **Error Paths**: Used to handle situations where something goes wrong. If a block fails, you can direct the workflow to an **Error Handler** block to keep your application running.
