"use client";

import React, { useEffect, useState } from "react";
import CodeEditor from "@/components/CodeEditor";
import ExecutionControls from "@/components/ExecutionControls";
import Visualizer from "@/components/Visualizer";
import { ExecutionTrace } from "@/lib/codeExecution/types";

const initialJavaScript = `async function bubbleSort(arr) {
  let n = arr.length;
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n - i - 1; j++) {
      if (arr[j] > arr[j + 1]) {
        let temp = arr[j];
        arr[j] = arr[j + 1];
        arr[j + 1] = temp;
      }
    }
  }
  return arr;
}

const data = [12, 24, 68, 42, 88, 15, 33, 57];
console.log(bubbleSort(data));`;

export function ExplorerShell() {
  const [language, setLanguage] = useState<"javascript" | "python">("javascript");
  const [executionTrace, setExecutionTrace] = useState<ExecutionTrace | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [lastCode, setLastCode] = useState(initialJavaScript);
  const [mode, setMode] = useState<"step" | "auto">("step");
  const [speed, setSpeed] = useState(1.5);

  useEffect(() => {
    if (mode !== "auto" || !executionTrace || isRunning || executionTrace.totalSteps === 0) {
      return;
    }

    if (currentStep >= executionTrace.totalSteps - 1) {
      setMode("step");
      return;
    }

    const stepDelay = Math.max(120, Math.round(700 / speed));
    const timeout = setTimeout(() => {
      setCurrentStep((prev) => Math.min(prev + 1, executionTrace.totalSteps - 1));
    }, stepDelay);

    return () => clearTimeout(timeout);
  }, [mode, executionTrace, currentStep, speed, isRunning]);

  const handleRun = async (code: string) => {
    setIsRunning(true);
    setLastCode(code);
    setCurrentStep(0);

    try {
      const endpoint =
        language === "javascript" ? "/api/execute/javascript" : "/api/execute/python";

      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, timeout: 5000 }),
      });

      const contentType = response.headers.get("content-type") || "";
      if (!contentType.includes("application/json")) {
        const bodyText = await response.text();
        const shortBody = bodyText.slice(0, 220).replace(/\s+/g, " ").trim();
        throw new Error(
          `Execution API returned ${response.status} ${response.statusText}. ${shortBody || "Expected JSON response."}`
        );
      }

      const trace = await response.json();
      if (!response.ok) {
        throw new Error(trace?.error || "Failed to execute code");
      }

      setExecutionTrace(trace);
      setCurrentStep(0);
    } catch (error) {
      setExecutionTrace({
        steps: [],
        output: "",
        errors: error instanceof Error ? error.message : "Unknown error",
        totalSteps: 0,
        executionTime: 0,
      });
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#060812] px-4 py-4 text-slate-100 lg:px-6 lg:py-6">
      <section className="mx-auto flex w-full max-w-[1700px] flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/8 bg-[#111827] px-4 py-3">
          <h1 className="text-sm font-semibold tracking-[0.2em] text-slate-200 uppercase">
            Code Visualization
          </h1>
          <div className="flex items-center gap-2 rounded-xl border border-white/8 bg-[#141a2a] p-1 text-xs">
            <button
              className={`rounded-lg px-3 py-1.5 font-semibold transition ${
                mode === "step" ? "bg-white/10 text-white" : "text-slate-400"
              }`}
              onClick={() => setMode("step")}
            >
              Step
            </button>
            <button
              className={`rounded-lg px-3 py-1.5 font-semibold transition ${
                mode === "auto" ? "bg-indigo-500 text-white" : "text-slate-400"
              }`}
              onClick={() => setMode((prev) => (prev === "auto" ? "step" : "auto"))}
              disabled={!executionTrace || executionTrace.totalSteps === 0}
            >
              {mode === "auto" ? "Pause" : "Auto"}
            </button>
          </div>
        </div>

        <div className="grid min-h-[calc(100vh-130px)] gap-4 xl:grid-cols-[minmax(0,1fr)_380px]">
          <div className="min-h-0 rounded-[28px] border border-white/8 bg-[#121827] p-4 shadow-[0_20px_80px_rgba(0,0,0,0.35)]">
            <Visualizer
              code={lastCode}
              executionTrace={executionTrace}
              currentStepIndex={currentStep}
              speed={speed}
            />
          </div>

          <aside className="flex min-h-0 flex-col gap-4">
            <div className="rounded-2xl border border-white/8 bg-[#141a2a] p-4 shadow-[0_16px_60px_rgba(0,0,0,0.3)]">
              <div className="mb-2 flex items-center justify-between text-xs uppercase tracking-[0.2em] text-slate-400">
                <span>Speed</span>
                <span>{speed.toFixed(1)}x</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="3"
                step="0.1"
                value={speed}
                onChange={(e) => setSpeed(parseFloat(e.target.value))}
                className="w-full accent-indigo-500"
              />
            </div>

            <div className="min-h-[380px] overflow-hidden rounded-[24px] border border-white/8 bg-[#121827] p-3 shadow-[0_16px_70px_rgba(0,0,0,0.35)]">
              <CodeEditor
                language={language}
                onLanguageChange={setLanguage}
                onRun={handleRun}
                isRunning={isRunning}
                initialCode={lastCode}
              />
            </div>

            <ExecutionControls
              isRunning={isRunning}
              currentStep={currentStep}
              totalSteps={executionTrace?.totalSteps || 0}
              onStep={setCurrentStep}
              executionTrace={executionTrace}
            />
          </aside>
        </div>
      </section>
    </main>
  );
}
