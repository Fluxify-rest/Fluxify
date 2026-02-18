---
title: Execution Engine
description: The core system that runs your workflows.
---

# Execution Engine
The **Execution Engine** is the invisible system that makes the blocks run. It follows the paths you've drawn on the canvas and carries out each step precisely.

## How it runs your logic
1. **Entrypoint**: Something happens to start the request (like a user visiting a URL).
2. **Pathfinding**: The engine starts at the **Entrypoint** and follows the **Edges** you created.
3. **Execution**: It runs each block one by one.
4. **Data Passing**: It automatically takes the result of one block and makes it available to the next as `input`.
5. **Finish**: The request ends when it reaches a **Response** block or runs out of steps.

Built for speed, the engine can handle many requests at once without slowing down.
