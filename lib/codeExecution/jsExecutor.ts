import { createContext, Script } from "node:vm";
import { ExecutionTrace, ExecutionStep } from "./types";

interface ExecutionContext {
  output: string[];
  steps: ExecutionStep[];
  callStack: any[];
}

function normalizeValue(value: unknown, depth = 0): unknown {
  if (depth > 3) return "[MaxDepth]";
  if (value === null || value === undefined) return value;

  const t = typeof value;
  if (t === "string" || t === "number" || t === "boolean") {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map((item) => normalizeValue(item, depth + 1));
  }

  if (t === "function") {
    const fn = value as Function;
    return `[Function ${fn.name || "anonymous"}]`;
  }

  if (t === "object") {
    try {
      const out: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
        out[k] = normalizeValue(v, depth + 1);
      }
      return out;
    } catch {
      return "[Object]";
    }
  }

  return String(value);
}

function extractTrackedVariables(code: string): string[] {
  const names = new Set<string>();

  const declarationRegex = /\b(?:let|const|var)\s+([a-zA-Z_$][\w$]*)/g;
  let declarationMatch: RegExpExecArray | null;
  while ((declarationMatch = declarationRegex.exec(code)) !== null) {
    names.add(declarationMatch[1]);
  }

  const functionRegex = /\bfunction\s+[a-zA-Z_$][\w$]*\s*\(([^)]*)\)/g;
  let functionMatch: RegExpExecArray | null;
  while ((functionMatch = functionRegex.exec(code)) !== null) {
    const params = functionMatch[1]
      .split(",")
      .map((param) => param.trim())
      .filter(Boolean)
      .map((param) => param.replace(/\s*=.*$/, ""));

    for (const param of params) {
      if (/^[a-zA-Z_$][\w$]*$/.test(param)) {
        names.add(param);
      }
    }
  }

  return Array.from(names);
}

function instrumentCode(code: string, trackedVariables: string[]): string {
  const lines = code.split("\n");
  const variableSnapshot =
    trackedVariables.length > 0
      ? trackedVariables
          .map((name) => `${JSON.stringify(name)}: __capture(() => ${name})`)
          .join(", ")
      : "";

  const instrumentedLines = lines.map((line, index) => {
    const lineNumber = index + 1;
    if (line.trim() === "" || line.trim().startsWith("//")) {
      return line;
    }

    return `__step(${lineNumber}, { ${variableSnapshot} });\n${line}`;
  });

  return instrumentedLines.join("\n");
}

export async function executeJavaScript(
  code: string,
  timeout: number = 5000
): Promise<ExecutionTrace> {
  const startTime = Date.now();
  const context: ExecutionContext = {
    output: [],
    steps: [],
    callStack: [],
  };

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

  const trackedVariables = extractTrackedVariables(code);
  const instrumentedCode = instrumentCode(code, trackedVariables);

  const vmContext = createContext({
    console: captureConsole,
    __capture: (getter: () => unknown) => {
      try {
        return getter();
      } catch {
        return undefined;
      }
    },
    __step: (line: number, variables: Record<string, unknown>) => {
      context.steps.push({
        line,
        variables: normalizeValue({ ...variables }) as Record<string, unknown>,
        callStack: [...context.callStack],
        output: context.output.join("\n"),
        timestamp: Date.now() - startTime,
      });
    },
  });

  try {
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
