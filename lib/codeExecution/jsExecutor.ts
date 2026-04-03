import { createContext, Script } from "node:vm";
import { ExecutionTrace, ExecutionStep } from "./types";

interface ExecutionContext {
  output: string[];
  steps: ExecutionStep[];
  variables: Map<string, any>;
  callStack: any[];
  currentLine: number;
}

export async function executeJavaScript(
  code: string,
  timeout: number = 5000
): Promise<ExecutionTrace> {
  const startTime = Date.now();
  const context: ExecutionContext = {
    output: [],
    steps: [],
    variables: new Map(),
    callStack: [],
    currentLine: 0,
  };

  // Setup console object for capturing output
  const captureConsole = {
    log: (...args: any[]) => {
      const message = args
        .map((arg) =>
          typeof arg === "object" ? JSON.stringify(arg, null, 2) : String(arg)
        )
        .join(" ");
      context.output.push(message);
    },
    error: (...args: any[]) => {
      const message = args
        .map((arg) =>
          typeof arg === "object" ? JSON.stringify(arg, null, 2) : String(arg)
        )
        .join(" ");
      context.output.push(`ERROR: ${message}`);
    },
  };

  // Instrument code with step tracking
  const instrumentedCode = instrumentCode(code);

  const vmContext = createContext({
    console: captureConsole,
    __step: (line: number, variables: Record<string, any>) => {
      context.steps.push({
        line,
        variables: { ...variables },
        callStack: [...context.callStack],
        output: context.output.join("\n"),
        timestamp: Date.now() - startTime,
      });
    },
  });

  try {
    // Execute with timeout
    const script = new Script(instrumentedCode, { filename: "user-code.js" });

    const executePromise = new Promise<ExecutionTrace>((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error(`Execution timeout after ${timeout}ms`));
      }, timeout);

      try {
        script.runInContext(vmContext, { timeout });
        clearTimeout(timeoutId);

        const executionTime = Date.now() - startTime;
        resolve({
          steps: context.steps,
          output: context.output.join("\n"),
          errors: null,
          totalSteps: context.steps.length,
          executionTime,
        });
      } catch (error) {
        clearTimeout(timeoutId);
        reject(error);
      }
    });

    return await executePromise;
  } catch (error) {
    const executionTime = Date.now() - startTime;
    return {
      steps: context.steps,
      output: context.output.join("\n"),
      errors: error instanceof Error ? error.message : "Unknown error",
      totalSteps: context.steps.length,
      executionTime,
    };
  }
}

function instrumentCode(code: string): string {
  // Simple instrumentation: add __step calls before each line
  // This is a basic implementation - a real version would use AST parsing

  const lines = code.split("\n");
  const instrumentedLines = lines.map((line, index) => {
    const lineNumber = index + 1;
    if (line.trim() === "" || line.trim().startsWith("//")) {
      return line;
    }
    // Add step tracking (simplified - real implementation needs AST)
    return `__step(${lineNumber}, {});\n${line}`;
  });

  return instrumentedLines.join("\n");
}
