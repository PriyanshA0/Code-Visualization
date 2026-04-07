import { createContext, Script } from "node:vm";
import { CallFrameInfo, ExecutionTrace, ExecutionStep } from "./types";

interface ExecutionContext {
  output: string[];
  steps: ExecutionStep[];
  callStack: CallFrameInfo[];
}

interface FunctionDeclarationInfo {
  name: string;
  params: string[];
}

function parseParameterList(raw: string): string[] {
  return raw
    .split(",")
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => p.replace(/^\.\.\./, "").replace(/\s*=.*$/, ""))
    .map((p) => (/^[a-zA-Z_$][\w$]*$/.test(p) ? p : ""))
    .filter(Boolean);
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

function extractFunctionDeclarations(code: string): FunctionDeclarationInfo[] {
  const seen = new Set<string>();
  const declarations: FunctionDeclarationInfo[] = [];
  const fnRegex = /\b(?:async\s+)?function\s+([a-zA-Z_$][\w$]*)\s*\(([^)]*)\)/g;

  let match: RegExpExecArray | null;
  while ((match = fnRegex.exec(code)) !== null) {
    const name = match[1];
    if (seen.has(name)) continue;
    seen.add(name);

    const params = parseParameterList(match[2]);

    declarations.push({ name, params });
  }

  return declarations;
}

function buildFunctionWrappers(code: string): string {
  const functionDeclarations = extractFunctionDeclarations(code);
  if (functionDeclarations.length === 0) {
    return "";
  }

  const wrappers = functionDeclarations.map(({ name, params }) => {
    const safeName = JSON.stringify(name);
    const paramLiteral = JSON.stringify(params);

    return `if (typeof ${name} === "function") {\n  const __orig_${name} = ${name};\n  ${name} = function (...__args) {\n    __enter(${safeName}, ${paramLiteral}, __args);\n    let __didExit = false;\n    const __leave = () => {\n      if (!__didExit) {\n        __didExit = true;\n        __exit();\n      }\n    };\n    try {\n      const __result = __orig_${name}.apply(this, __args);\n      if (__result && typeof __result.then === "function") {\n        return __result.finally(__leave);\n      }\n      __leave();\n      return __result;\n    } catch (__error) {\n      __leave();\n      throw __error;\n    }\n  };\n}`;
  });

  return wrappers.join("\n");
}

function cloneCallStack(callStack: CallFrameInfo[]): CallFrameInfo[] {
  return callStack.map((frame) => ({
    functionName: frame.functionName,
    parameters: normalizeValue(frame.parameters) as Record<string, unknown>,
    localVariables: normalizeValue(frame.localVariables) as Record<string, unknown>,
  }));
}

function extractParamsFromCallableRhs(rhs: string): string[] {
  const fnMatch = rhs.match(/^\s*(?:async\s*)?function(?:\s+[a-zA-Z_$][\w$]*)?\s*\(([^)]*)\)/);
  if (fnMatch) return parseParameterList(fnMatch[1]);

  const arrowParenMatch = rhs.match(/^\s*(?:async\s*)?\(([^)]*)\)\s*=>/);
  if (arrowParenMatch) return parseParameterList(arrowParenMatch[1]);

  const arrowSingleMatch = rhs.match(/^\s*(?:async\s*)?([a-zA-Z_$][\w$]*)\s*=>/);
  if (arrowSingleMatch) return [arrowSingleMatch[1]];

  return [];
}

function wrapCallableAssignments(line: string): string {
  const declarationMatch = line.match(/^\s*(const|let|var)\s+([a-zA-Z_$][\w$]*)\s*=\s*(.+?)\s*;?\s*$/);
  if (declarationMatch) {
    const [, keyword, name, rhs] = declarationMatch;
    if (!/(^\s*(?:async\s*)?function\b)|(^\s*(?:async\s*)?(?:\([^)]*\)|[a-zA-Z_$][\w$]*)\s*=>)/.test(rhs)) {
      return line;
    }

    const params = extractParamsFromCallableRhs(rhs);
    return `${keyword} ${name} = __wrapCallable(${JSON.stringify(name)}, ${rhs}, ${JSON.stringify(params)});`;
  }

  const assignmentMatch = line.match(/^\s*([a-zA-Z_$][\w$]*)\s*=\s*(.+?)\s*;?\s*$/);
  if (assignmentMatch) {
    const [, name, rhs] = assignmentMatch;
    if (!/(^\s*(?:async\s*)?function\b)|(^\s*(?:async\s*)?(?:\([^)]*\)|[a-zA-Z_$][\w$]*)\s*=>)/.test(rhs)) {
      return line;
    }

    const params = extractParamsFromCallableRhs(rhs);
    return `${name} = __wrapCallable(${JSON.stringify(name)}, ${rhs}, ${JSON.stringify(params)});`;
  }

  return line;
}

function instrumentCode(code: string, trackedVariables: string[]): string {
  const lines = code.split("\n");
  const wrappers = buildFunctionWrappers(code);
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

    const transformedLine = wrapCallableAssignments(line);

    return `__step(${lineNumber}, { ${variableSnapshot} });\n${transformedLine}`;
  });

  const instrumentedBody = instrumentedLines.join("\n");
  if (!wrappers) {
    return instrumentedBody;
  }

  // Function declarations are hoisted, so wrappers can be installed first.
  return `${wrappers}\n${instrumentedBody}`;
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
    __wrapCallable: (functionName: string, fn: unknown, params: string[]) => {
      if (typeof fn !== "function") return fn;
      const original = fn as (...args: unknown[]) => unknown;

      const wrapped = function (this: unknown, ...args: unknown[]) {
        (vmContext as any).__enter(functionName || original.name || "anonymous", params, args);
        let didExit = false;
        const leave = () => {
          if (!didExit) {
            didExit = true;
            (vmContext as any).__exit();
          }
        };

        try {
          const result = original.apply(this, args);
          if (result && typeof (result as Promise<unknown>).then === "function") {
            return (result as Promise<unknown>).finally(leave);
          }
          leave();
          return result;
        } catch (error) {
          leave();
          throw error;
        }
      };

      Object.defineProperty(wrapped, "name", {
        value: original.name || functionName || "wrapped",
        configurable: true,
      });

      return wrapped;
    },
    __enter: (functionName: string, params: string[], args: unknown[]) => {
      const parameterMap: Record<string, unknown> = {};
      const safeParams = Array.isArray(params) ? params : [];
      const safeArgs = Array.isArray(args) ? args : [];

      for (let i = 0; i < safeArgs.length; i++) {
        const paramName = safeParams[i] || `arg${i}`;
        parameterMap[paramName] = normalizeValue(safeArgs[i]);
      }

      context.callStack.push({
        functionName,
        parameters: parameterMap,
        localVariables: {},
      });
    },
    __exit: () => {
      if (context.callStack.length > 0) {
        context.callStack.pop();
      }
    },
    __step: (line: number, variables: Record<string, unknown>) => {
      context.steps.push({
        description: `Executing line ${line}`,
        line,
        variables: normalizeValue({ ...variables }) as Record<string, unknown>,
        callStack: cloneCallStack(context.callStack),
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
