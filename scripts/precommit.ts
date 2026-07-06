import { $ } from "bun";

async function main() {
  console.log("Running pre-commit checks...");

  try {
    // 1. Run lint
    console.log("1. Running linter...");
    await $`bun run lint`;

    // 2. Run analyze
    console.log("2. Running code analysis...");
    await $`bun run analyze`;

    // 3. Determine changed files
    console.log("3. Checking git diff for selective testing...");
    const diffOutput = await $`git diff --cached --name-only`.text();
    const changedFiles = diffOutput.split("\n").filter(Boolean);
    
    // 4. Run unit tests
    console.log("4. Running unit tests...");
    await $`bun run test:unit`;

    // 5. Conditionally run adapters integration tests
    const adaptersChanged = changedFiles.some(file => file.startsWith("packages/adapters/"));
    if (adaptersChanged) {
      console.log("5. Changes in adapters detected. Running adapter integration tests...");
      await $`bun run test:adapters`;
      await $`bun run test:integration`;
    } else {
      console.log("5. No changes in adapters detected. Skipping adapter integration tests to save time.");
    }

    console.log("Pre-commit checks passed successfully!");
  } catch (error) {
    console.error("\nPre-commit checks failed! Please fix the errors before committing.");
    process.exit(1);
  }
}

main();
