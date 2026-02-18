---
title: Scripting Context
description: Variables and functions available to your scripts.
---

# Scripting Context

When your script runs (within a **JS Runner** block or a `js:` expression), it has access to a variety of global variables and helper functions. 

## Global Variables

- **`input`**: The data passed to the current block. 
    - In a **JS Runner** or **Transformer**, this is the output of the preceding block.
    - In a conditional field (e.g., `js: input.id === 5`), this is the data available to that field.
- **`vars`**: The global variable store. Any variable you create with the **Set Variable** block is permanently stored here and can be accessed or modified by scripts using `vars.myVariableName`.

---

## HTTP Request Helpers

These functions allow you to read data from the incoming request that triggered the workflow:

| Function | Description |
| :--- | :--- |
| **`getQueryParam(key)`** | Returns the value of a URL query parameter (e.g., `?id=123`). |
| **`getRouteParam(key)`** | Returns the value of a dynamic URL path segment (e.g., `/users/:id`). |
| **`getHeader(key)`** | Returns the value of an incoming HTTP request header. |
| **`getCookie(key)`** | Returns the value of a specific cookie sent with the request. |
| **`getRequestBody()`** | Returns the parsed body of the request (JSON, Form Data, or Text). |
| **`httpRequestMethod`** | (String) The method of the request (e.g., `GET`, `POST`). |
| **`httpRequestRoute`** | (String) The full path of the request being handled. |

---

## HTTP Response Helpers

Used to prepare the response that will be sent back when the workflow completes:

| Function | Description |
| :--- | :--- |
| **`setHeader(key, value)`** | Sets a custom HTTP header on the outgoing response. |
| **`setCookie(name, options)`** | Sets a cookie on the response. The second argument is an object containing `value`, `domain`, `path`, `expiry`, and flags like `httpOnly` or `secure`. |

---

## Utility Helpers

| Function | Description |
| :--- | :--- |
| **`logger`** | Access to the logging system. Functions: `logger.logInfo()`, `logger.logWarn()`, `logger.logError()`. These logs appear in the server console or cloud log store. |
| **`getConfig(key)`** | Accesses sensitive configuration or secrets defined in the **App Config** (e.g., `getConfig("STRIPE_KEY")`). |

---

## Database (DB Native Block Only)

- **`dbQuery(sql)`**: This function is **only** available within the **DB Native** block. It allows you to execute raw SQL queries directly against the database integration selected for that block.

---

## Technical Note for LLMs
The scripting environment is an isolated **V8 Sandbox** instance. All properties of the `vars` object are injected as top-level globals. Standard Node.js global objects (like `process` or `fs`) are **not** accessible for security reasons. Scripts have a maximum execution time of **4 seconds**.
