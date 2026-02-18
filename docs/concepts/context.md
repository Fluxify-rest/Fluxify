---
title: Execution Context
description: Understanding the shared data and environment of your workflows.
---

# Execution Context

The **Execution Context** is the environment where your workflow runs. It stores information about the current request, gives you access to helper functions, and allows you to pass data between different blocks.

## Global Object & Variables

In Fluxify, the context acts as a **Global Object**. This means you don't need to use a prefix like `context.` or `vars.` to access built-in tools or your own variables.

### Accessing Built-in Helpers
You can call helper functions directly in any script or dynamic input:
- `getQueryParam('id')`
- `getHeader('Content-Type')`
- `logger.logInfo('Process started')`

### Using Global Variables
Any variable you set is available globally across your entire workflow. 
- **To get a variable**: Just use its name directly, e.g., `myVariable`.
- **To set a global variable**: In any script block, simply assign a value to a new or existing name:
  ```javascript
  userName = "John Doe";
  ```
  This variable will now be accessible by its name in all subsequent blocks.

---

## Accessing Block Output

Every block in Fluxify produces an output. When you are writing a script or using a dynamic input (prefixed with `js:`), you can access the output of the **immediately preceding block** using the global `input` variable.

*Example*: If the previous block was an HTTP Request that returned a JSON object, you can access its data like this:
```javascript
return input.data.title;
```

---

## Persistence & Lifetime

- **Per Request**: Every time your workflow is triggered (e.g., by an API call), a fresh context is created. 
- **Isolated**: Data in the context is only shared between blocks within that specific run. It is not shared between different users or different requests.
- **Cleanup**: Once the workflow reaches a **Response** block or ends, the context is cleared.

---

## Best Practices

- **Simple Names**: Use clear names for your variables to avoid confusion.
- **Check for Existence**: When using `input`, make sure the previous block actually returned the data you expect.
