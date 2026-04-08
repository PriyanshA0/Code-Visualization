"use client";

import React from "react";
import { ExecutionTrace } from "@/lib/codeExecution/types";

interface ExecutionControlsProps {
  isRunning: boolean;
  currentStep: number;
  totalSteps: number;
  onStep: (step: number) => void;
  executionTrace: ExecutionTrace | null;
}

export default function ExecutionControls({
  isRunning,
  currentStep,
  totalSteps,
  onStep,
  executionTrace,
}: ExecutionControlsProps) {
  const handleNext = () => {
    if (currentStep < totalSteps - 1) {
      onStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      onStep(currentStep - 1);
    }
  };

  const handleReset = () => {
    if (totalSteps === 0) return;
    onStep(0);
  };

  const handleLast = () => {
    if (totalSteps === 0) return;
    onStep(totalSteps - 1);
  };

  return (
    <div className="pokemon-panel flex flex-col gap-4 rounded-[20px] p-4 text-slate-200">
      {executionTrace && (
        <div className="space-y-2 text-sm">
          <p className="text-slate-200">
            <span className="font-semibold">Execution Time:</span>{" "}
            {executionTrace.executionTime}ms
          </p>
          <p className="text-slate-200">
            <span className="font-semibold">Total Steps:</span> {totalSteps}
          </p>
          {executionTrace.errors && (
            <p className="text-rose-300">
              <span className="font-semibold">Error:</span>{" "}
              {executionTrace.errors}
            </p>
          )}
        </div>
      )}

      <div className="flex gap-2">
        <button
          onClick={handleReset}
          disabled={isRunning || currentStep === 0}
          className="flex-1 rounded-xl border border-yellow-300/15 bg-white/5 px-3 py-2 text-sm font-medium text-slate-200 transition hover:bg-yellow-300/10 disabled:opacity-50"
          title="Reset to start"
        >
          ⏮ Start
        </button>

        <button
          onClick={handlePrevious}
          disabled={isRunning || currentStep === 0}
          className="flex-1 rounded-xl border border-yellow-300/15 bg-white/5 px-3 py-2 text-sm font-medium text-slate-200 transition hover:bg-yellow-300/10 disabled:opacity-50"
          title="Previous step"
        >
          ◀ Prev
        </button>

        <button
          onClick={handleNext}
          disabled={isRunning || currentStep >= totalSteps - 1}
          className="flex-1 rounded-xl bg-gradient-to-r from-yellow-400 to-amber-500 px-3 py-2 text-sm font-medium text-[#04121f] shadow-lg shadow-amber-500/25 transition hover:brightness-110 disabled:opacity-50"
          title="Next step"
        >
          Next ▶
        </button>

        <button
          onClick={handleLast}
          disabled={isRunning || currentStep === totalSteps - 1}
          className="flex-1 rounded-xl border border-yellow-300/15 bg-white/5 px-3 py-2 text-sm font-medium text-slate-200 transition hover:bg-yellow-300/10 disabled:opacity-50"
          title="Jump to end"
        >
          End ⏭
        </button>
      </div>

      {totalSteps > 0 && (
        <div className="space-y-2">
          <input
            type="range"
            min="0"
            max={totalSteps - 1}
            value={currentStep}
            onChange={(e) => onStep(parseInt(e.target.value))}
            disabled={isRunning}
            className="w-full"
          />
          <p className="text-center text-xs tracking-[0.25em] text-yellow-100 uppercase">
            Step: {currentStep + 1} / {totalSteps}
          </p>
        </div>
      )}

      {executionTrace?.output && (
        <div className="mt-2 rounded-2xl border border-yellow-300/15 bg-[#0b1020] p-3">
          <p className="mb-2 text-xs uppercase tracking-[0.3em] text-yellow-100">Output</p>
          <pre className="max-h-40 overflow-y-auto whitespace-pre-wrap break-words text-xs text-slate-200">
            {executionTrace.output}
          </pre>
        </div>
      )}
    </div>
  );
}
