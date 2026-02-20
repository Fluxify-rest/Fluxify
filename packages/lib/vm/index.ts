import { Script } from "vm";

export class JsVM {
  private context: Record<string, any>;
  private static readonly DEFAULT_TIMEOUT = 4 * 1000;
  constructor(context: Record<string, any>) {
    this.context = context;
  }

  run(code: string, extras?: any, insideIIFE = true): any {
    const script = new Script(
      insideIIFE ? `(function () {${code}}).bind(this)();` : code,
    );
    this.context["input"] = extras;
    return script.runInNewContext(this.context, {
      timeout: JsVM.DEFAULT_TIMEOUT,
    });
  }
  async runAsync(code: string, extras?: any, insideIIFE = true): Promise<any> {
    const result = this.run(code, extras, insideIIFE); // vm timeout handles sync infinite loops

    // If it returned a Promise (async code), race it against a timeout
    if (result instanceof Promise) {
      const timeout = new Promise((_, reject) =>
        setTimeout(
          () => reject(new Error("JavaScript execution timeout")),
          JsVM.DEFAULT_TIMEOUT,
        ),
      );
      return Promise.race([result, timeout]);
    }
    return result;
  }
  truthy(value: any) {
    const type = typeof value;
    if (
      type == "bigint" ||
      type == "number" ||
      type == "string" ||
      type == "boolean"
    ) {
      return !!value;
    } else if (type == "object" && value != null) {
      return true;
    } else {
      return false;
    }
  }
  falsy(value: any) {
    return !this.truthy(value);
  }
}
