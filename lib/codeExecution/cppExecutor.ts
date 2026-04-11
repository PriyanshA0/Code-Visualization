import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { spawn } from "node:child_process";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import { ExecutionStep, ExecutionTrace } from "./types";

function isVercelRuntime() {
  return Boolean(process.env.VERCEL || process.env.VERCEL_ENV);
}

function runCommand(command: string, args: string[], cwd: string, timeout: number) {
  return new Promise<{ code: number | null; stdout: string; stderr: string }>((resolve, reject) => {
    const child = spawn(command, args, { cwd, windowsHide: true });
    let stdout = "";
    let stderr = "";
    let settled = false;

    const timer = setTimeout(() => {
      child.kill();
      if (!settled) {
        settled = true;
        reject(new Error(`Execution timeout after ${timeout}ms`));
      }
    }, timeout);

    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
    });

    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });

    child.on("error", (error) => {
      clearTimeout(timer);
      if (!settled) {
        settled = true;
        reject(error);
      }
    });

    child.on("close", (code) => {
      clearTimeout(timer);
      if (!settled) {
        settled = true;
        resolve({ code, stdout, stderr });
      }
    });
  });
}

export async function executeCpp(code: string, timeout: number = 5000): Promise<ExecutionTrace> {
  const startTime = Date.now();

  if (isVercelRuntime()) {
    return {
      steps: [],
      output: "",
      errors:
        "C++ execution is not available in the current Vercel serverless runtime. Use a worker with g++ installed or run locally.",
      totalSteps: 0,
      executionTime: 0,
    };
  }

  const workDir = await mkdtemp(join(tmpdir(), `talksy-cpp-${randomUUID()}-`));
  const sourcePath = join(workDir, "main.cpp");
  const outputBinary = process.platform === "win32" ? "main.exe" : "main";

  try {
    await writeFile(sourcePath, code, "utf8");

    const compile = await runCommand(
      "g++",
      ["main.cpp", "-std=c++17", "-O2", "-o", outputBinary],
      workDir,
      timeout
    );

    if (compile.code !== 0) {
      return {
        steps: [],
        output: compile.stdout,
        errors: compile.stderr || "C++ compilation failed",
        totalSteps: 0,
        executionTime: Date.now() - startTime,
      };
    }

    const runCommandName = process.platform === "win32" ? outputBinary : `./${outputBinary}`;
    const run = await runCommand(runCommandName, [], workDir, timeout);

    return {
      steps: [] as ExecutionStep[],
      output: run.stdout,
      errors: run.code === 0 ? null : run.stderr || "C++ execution failed",
      totalSteps: 0,
      executionTime: Date.now() - startTime,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to execute C++ code";
    return {
      steps: [],
      output: "",
      errors: message,
      totalSteps: 0,
      executionTime: Date.now() - startTime,
    };
  } finally {
    await rm(workDir, { recursive: true, force: true }).catch(() => undefined);
  }
}
