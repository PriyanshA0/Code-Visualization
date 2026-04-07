import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { spawn } from "node:child_process";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import { ExecutionStep, ExecutionTrace } from "./types";

function isVercelRuntime() {
  return Boolean(process.env.VERCEL || process.env.VERCEL_ENV);
}

function buildUnsupportedTrace(message: string): ExecutionTrace {
  return {
    steps: [],
    output: "",
    errors: message,
    totalSteps: 0,
    executionTime: 0,
  };
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

export async function executeJava(code: string, timeout: number = 5000): Promise<ExecutionTrace> {
  const startTime = Date.now();

  if (isVercelRuntime()) {
    return buildUnsupportedTrace(
      "Java execution is not available in the current Vercel serverless runtime. Use a JVM-enabled worker or run locally for Java support."
    );
  }

  const workDir = await mkdtemp(join(tmpdir(), `talksy-java-${randomUUID()}-`));
  const sourcePath = join(workDir, "Main.java");

  try {
    await writeFile(sourcePath, code, "utf8");

    const compile = await runCommand("javac", ["Main.java"], workDir, timeout);
    if (compile.code !== 0) {
      return {
        steps: [],
        output: compile.stdout,
        errors: compile.stderr || "Java compilation failed",
        totalSteps: 0,
        executionTime: Date.now() - startTime,
      };
    }

    const run = await runCommand("java", ["Main"], workDir, timeout);
    const result: ExecutionTrace = {
      steps: [] as ExecutionStep[],
      output: run.stdout,
      errors: run.code === 0 ? null : run.stderr || "Java execution failed",
      totalSteps: 0,
      executionTime: Date.now() - startTime,
    };

    return result;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to execute Java code";
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