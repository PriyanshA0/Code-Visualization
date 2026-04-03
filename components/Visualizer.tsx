"use client";

import React from "react";
import { ExecutionTrace } from "@/lib/codeExecution/types";
import VariablesPanel from "./visualizers/VariablesPanel";

interface VisualizerProps {
  code: string;
  executionTrace: ExecutionTrace | null;
  currentStepIndex: number;
  speed: number;
}

export default function Visualizer({
  code,
  executionTrace,
  currentStepIndex,
  speed,
}: VisualizerProps) {
  const currentStep =
    executionTrace && currentStepIndex < executionTrace.steps.length
      ? executionTrace.steps[currentStepIndex]
      : null;

  const previousStep =
    executionTrace && currentStepIndex > 0 && currentStepIndex - 1 < executionTrace.steps.length
      ? executionTrace.steps[currentStepIndex - 1]
      : null;

  const currentLineNumber = currentStep?.line || 0;
  const speedFill = Math.min(100, Math.max(10, (speed / 3) * 100));

  return (
    <div className="flex h-full min-h-0 flex-col gap-4 overflow-y-auto rounded-[24px] border border-white/8 bg-[#141a2a] p-4 shadow-[0_16px_70px_rgba(0,0,0,0.35)]">
      <div className="rounded-2xl border border-white/6 bg-[#0b1020] p-4">
        <div className="mb-3 flex items-center justify-between text-xs uppercase tracking-[0.3em] text-slate-400">
          <span>Live Visualization</span>
          <div className="flex items-center gap-3 text-[11px] tracking-[0.2em] text-slate-500">
            <span>Speed: {speed.toFixed(1)}x</span>
            <span className="h-1.5 w-24 rounded-full bg-white/10">
              <span
                className="block h-full rounded-full bg-indigo-500 transition-all duration-300"
                style={{ width: `${speedFill}%` }}
              />
            </span>
          </div>
        </div>
        <div className="max-h-[470px] overflow-y-auto rounded-xl border border-white/6 bg-[#11182b]">
          <div className="font-mono text-sm text-slate-200">
            {code.split("\n").map((line, index) => {
              const lineNumber = index + 1;
              const isCurrentLine = lineNumber === currentLineNumber;

              return (
                <div
                  key={index}
                  className={`flex ${
                    isCurrentLine
                      ? "line-focus-active bg-indigo-500/20 text-white"
                      : "hover:bg-white/5"
                  } transition-colors duration-200`}
                >
                  <div
                    className={`w-12 text-right pr-4 py-1 ${
                      isCurrentLine
                        ? "bg-indigo-500/35 text-indigo-100"
                        : "bg-[#0b1020] text-slate-500"
                    } border-r border-white/6 transition-colors duration-200`}
                  >
                    {lineNumber}
                  </div>
                  <div className="flex-1 px-4 py-1 whitespace-pre-wrap break-words transition-transform duration-200">
                    {line}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Variables Panel */}
      {executionTrace && (
        <VariablesPanel
          step={currentStep}
          previousStep={previousStep}
          currentStepIndex={currentStepIndex}
          totalSteps={executionTrace.totalSteps}
        />
      )}

      {/* No Trace Message */}
      {!executionTrace && (
        <div className="rounded-2xl border border-dashed border-white/8 py-8 text-center text-slate-400">
          <p className="text-sm font-medium">
            Run code to see visualization
          </p>
        </div>
      )}
    </div>
  );
}
