export class ExecutionTimeoutError extends Error {
  public readonly name: string = "ExecutionTimeoutError";
  constructor(message: string) {
    super(message);
  }
}
