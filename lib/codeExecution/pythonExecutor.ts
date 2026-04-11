import { spawn } from "child_process";
import { CallFrameInfo, ExecutionStep, ExecutionTrace } from "./types";

const TRACE_MARKER = "__TALKSY_TRACE__";

type PythonLaunchCandidate = {
  command: string;
  args: string[];
  label: string;
};

function getPythonLaunchCandidates(): PythonLaunchCandidate[] {
  const customCommand = process.env.PYTHON_COMMAND?.trim();
  if (customCommand) {
    return [{ command: customCommand, args: ["-u"], label: customCommand }];
  }

  return [
    { command: "python", args: ["-u"], label: "python" },
    { command: "python3", args: ["-u"], label: "python3" },
    { command: "py", args: ["-3", "-u"], label: "py -3" },
  ];
}

function normalizeStep(step: any): ExecutionStep {
  return {
  description:
    typeof step?.description === "string" && step.description.length > 0
    ? step.description
    : `Executing line ${Number(step?.line) || 0}`,
  line: Number(step?.line) || 0,
  variables:
    step?.variables && typeof step.variables === "object"
    ? (step.variables as Record<string, unknown>)
    : {},
  callStack: Array.isArray(step?.callStack)
    ? step.callStack.map((frame: any): CallFrameInfo => ({
      functionName:
      typeof frame?.functionName === "string" && frame.functionName.length > 0
        ? frame.functionName
        : "<module>",
      parameters:
      frame?.parameters && typeof frame.parameters === "object"
        ? (frame.parameters as Record<string, unknown>)
        : {},
      localVariables:
      frame?.localVariables && typeof frame.localVariables === "object"
        ? (frame.localVariables as Record<string, unknown>)
        : {},
    }))
    : [],
  output: typeof step?.output === "string" ? step.output : "",
  timestamp: Number(step?.timestamp) || 0,
  };
}

function buildTracedPythonScript(userCode: string): string {
  const encodedCode = JSON.stringify(userCode);

  return `
import sys
import json
import time
import inspect
import traceback

_TALKSY_USER_CODE = ${encodedCode}
_TALKSY_START = time.time()
_TALKSY_STEPS = []
_TALKSY_CALL_STACK = []

def _talksy_normalize(value, depth=0):
  if depth > 3:
    return "[MaxDepth]"
  if value is None or isinstance(value, (bool, int, float, str)):
    return value
  if isinstance(value, (list, tuple)):
    return [_talksy_normalize(v, depth + 1) for v in value]
  if isinstance(value, dict):
    out = {}
    for k, v in value.items():
      out[str(k)] = _talksy_normalize(v, depth + 1)
    return out
  if callable(value):
    return f"[Function {getattr(value, '__name__', 'anonymous')}]"
  try:
    return repr(value)
  except Exception:
    return "[Object]"

def _talksy_current_ms():
  return int((time.time() - _TALKSY_START) * 1000)

def _talksy_param_map(frame):
  try:
    info = inspect.getargvalues(frame)
    out = {}
    for arg_name in info.args:
      out[arg_name] = _talksy_normalize(frame.f_locals.get(arg_name))
    if info.varargs:
      out[info.varargs] = _talksy_normalize(frame.f_locals.get(info.varargs))
    if info.keywords:
      out[info.keywords] = _talksy_normalize(frame.f_locals.get(info.keywords))
    return out
  except Exception:
    return {}

def _talksy_snapshot_stack():
  return [
    {
      "functionName": frame["functionName"],
      "parameters": _talksy_normalize(frame.get("parameters", {})),
      "localVariables": _talksy_normalize(frame.get("localVariables", {})),
    }
    for frame in _TALKSY_CALL_STACK
  ]

def _talksy_tracer(frame, event, arg):
  if frame.f_code.co_filename != "<user-code>":
    return _talksy_tracer

  if event == "call":
    fn_name = frame.f_code.co_name or "<module>"
    _TALKSY_CALL_STACK.append({
      "functionName": fn_name,
      "parameters": _talksy_param_map(frame),
      "localVariables": _talksy_normalize(frame.f_locals),
    })
    return _talksy_tracer

  if event == "return":
    if _TALKSY_CALL_STACK:
      _TALKSY_CALL_STACK.pop()
    return _talksy_tracer

  if event == "line":
    if _TALKSY_CALL_STACK:
      _TALKSY_CALL_STACK[-1]["localVariables"] = _talksy_normalize(frame.f_locals)

    _TALKSY_STEPS.append({
      "description": f"Executing line {frame.f_lineno}",
      "line": frame.f_lineno,
      "variables": _talksy_normalize(frame.f_locals),
      "callStack": _talksy_snapshot_stack(),
      "output": "",
      "timestamp": _talksy_current_ms(),
    })
    return _talksy_tracer

  return _talksy_tracer

_talksy_error = None

try:
  compiled = compile(_TALKSY_USER_CODE, "<user-code>", "exec")
  _globals = {"__name__": "__main__"}
  sys.settrace(_talksy_tracer)
  exec(compiled, _globals, _globals)
except Exception:
  _talksy_error = traceback.format_exc()
finally:
  sys.settrace(None)

_talksy_payload = {
  "steps": _TALKSY_STEPS,
  "error": _talksy_error,
}

print("${TRACE_MARKER}" + json.dumps(_talksy_payload, ensure_ascii=False))
`;
}

export async function executePython(
  code: string,
  timeout: number = 5000
): Promise<ExecutionTrace> {
  const startTime = Date.now();
  const tracedScript = buildTracedPythonScript(code);
  const candidates = getPythonLaunchCandidates();

  return new Promise((resolve) => {
    const tryRunCandidate = (index: number) => {
      if (index >= candidates.length) {
        const executionTime = Date.now() - startTime;
        resolve({
          steps: [],
          output: "",
          errors:
            "Python runtime not found. Install Python and add it to PATH, or set PYTHON_COMMAND in environment variables.",
          totalSteps: 0,
          executionTime,
        });
        return;
      }

      const candidate = candidates[index];
      const python = spawn(candidate.command, candidate.args, { timeout });

      let output = "";
      let errorOutput = "";
      let hasTimedOut = false;
      let attemptHandled = false;

      const timeoutTimer = setTimeout(() => {
        hasTimedOut = true;
        python.kill();
      }, timeout);

      python.stdout?.on("data", (data) => {
        output += data.toString();
      });

      python.stderr?.on("data", (data) => {
        errorOutput += data.toString();
      });

      python.on("error", (error: NodeJS.ErrnoException) => {
        if (attemptHandled) {
          return;
        }
        attemptHandled = true;
        clearTimeout(timeoutTimer);

        if (error.code === "ENOENT") {
          tryRunCandidate(index + 1);
          return;
        }

        const executionTime = Date.now() - startTime;
        resolve({
          steps: [],
          output,
          errors:
            error instanceof Error
              ? `Failed to start Python process (${candidate.label}): ${error.message}`
              : `Failed to start Python process (${candidate.label})`,
          totalSteps: 0,
          executionTime,
        });
      });

      python.on("close", (exitCode: number) => {
        if (attemptHandled) {
          return;
        }
        attemptHandled = true;

        clearTimeout(timeoutTimer);
        const executionTime = Date.now() - startTime;

        if (hasTimedOut) {
          resolve({
            steps: [],
            output,
            errors: `Execution timeout after ${timeout}ms`,
            totalSteps: 0,
            executionTime,
          });
          return;
        }

        const markerIndex = output.lastIndexOf(TRACE_MARKER);
        let renderedOutput = output;
        let parsedSteps: ExecutionStep[] = [];
        let traceError: string | null = null;

        if (markerIndex >= 0) {
          renderedOutput = output.slice(0, markerIndex).replace(/\s+$/, "");
          const payloadRaw = output.slice(markerIndex + TRACE_MARKER.length).trim();

          try {
            const payload = JSON.parse(payloadRaw) as {
              steps?: any[];
              error?: string | null;
            };
            parsedSteps = Array.isArray(payload.steps)
              ? payload.steps.map((step) => normalizeStep(step))
              : [];
            traceError = typeof payload.error === "string" && payload.error.length > 0 ? payload.error : null;
          } catch {
            traceError = "Failed to parse Python execution trace payload";
          }
        }

        if (exitCode !== 0 || traceError || errorOutput) {
          resolve({
            steps: parsedSteps,
            output: renderedOutput,
            errors: traceError || errorOutput || `Python process exited with code ${exitCode}`,
            totalSteps: parsedSteps.length,
            executionTime,
          });
          return;
        }

        resolve({
          steps: parsedSteps,
          output: renderedOutput,
          errors: null,
          totalSteps: parsedSteps.length,
          executionTime,
        });
      });

      // Run traced wrapper that executes user code and emits structured trace.
      python.stdin?.write(tracedScript);
      python.stdin?.end();
    };

    tryRunCandidate(0);
  });
}
