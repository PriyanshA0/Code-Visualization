import { spawn } from "child_process";
import { ExecutionTrace } from "./types";

export async function executePython(
  code: string,
  timeout: number = 5000
): Promise<ExecutionTrace> {
  const startTime = Date.now();

  return new Promise((resolve) => {
    const python = spawn("python", ["-u"], { timeout });

    let output = "";
    let errorOutput = "";
    let hasTimedOut = false;

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

    python.on("close", (code: number) => {
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

      if (code !== 0) {
        resolve({
          steps: [],
          output,
          errors: errorOutput,
          totalSteps: 0,
          executionTime,
        });
        return;
      }

      resolve({
        steps: [],
        output,
        errors: null,
        totalSteps: 0,
        executionTime,
      });
    });

    // Write code to Python process
    python.stdin?.write(code);
    python.stdin?.end();
  });
}
