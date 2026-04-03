"use client";

import React from "react";
import { CallFrameInfo, ExecutionStep } from "@/lib/codeExecution/types";

interface VariablesPanelProps {
  step: ExecutionStep | null;
  previousStep: ExecutionStep | null;
  currentStepIndex: number;
  totalSteps: number;
}

export default function VariablesPanel({
  step,
  previousStep,
  currentStepIndex,
  totalSteps,
}: VariablesPanelProps) {
  const renderValue = (value: unknown): string => {
    if (value === null) return "null";
    if (value === undefined) return "undefined";
    if (typeof value === "object") return JSON.stringify(value, null, 2);
    return String(value);
  };

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-[24px] border border-white/8 bg-[#141a2a] shadow-[0_16px_70px_rgba(0,0,0,0.35)]">
      <div className="border-b border-white/6 p-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-white">Variables & State</h3>
          <span className="rounded-full border border-emerald-400/20 bg-emerald-500/10 px-2.5 py-1 text-[10px] font-bold tracking-[0.25em] text-emerald-300">
            ACTIVE STEP
          </span>
        </div>
        <p className="mt-2 text-xs tracking-[0.25em] text-slate-400 uppercase">
          Step {currentStepIndex + 1} of {totalSteps}
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {step && Object.keys(step.variables).length > 0 ? (
          <div className="space-y-3">
            {Object.entries(step.variables).map(([key, value]) => (
              (() => {
                const hadKey = previousStep ? key in previousStep.variables : false;
                const previousValue = hadKey ? previousStep?.variables[key] : undefined;
                const changed =
                  !hadKey ||
                  JSON.stringify(previousValue) !== JSON.stringify(value);

                return (
              <div
                key={key}
                className={`rounded-2xl border p-3 transition-all duration-300 ${
                  changed
                    ? "var-card-updated border-emerald-300/30 bg-emerald-400/10"
                    : "border-white/8 bg-[#0b1020]"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-white">{key}</p>
                  {changed && (
                    <span className="rounded-full border border-emerald-300/30 bg-emerald-400/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-emerald-200">
                      changed
                    </span>
                  )}
                </div>
                <pre className="mt-2 overflow-x-auto text-xs text-slate-300">
                  {renderValue(value)}
                </pre>
              </div>
                );
              })()
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-400">
            No variables in current scope
          </p>
        )}
      </div>

      {step && step.callStack.length > 0 && (
        <div className="border-t border-white/6 p-4">
          <h4 className="mb-3 text-sm font-semibold uppercase tracking-[0.25em] text-slate-400">
            Call Stack
          </h4>
          <div className="space-y-2">
            {step.callStack.map((frame: CallFrameInfo, idx: number) => (
              <div
                key={idx}
                className="rounded-2xl border border-indigo-400/20 bg-[#0b1020] px-3 py-2 text-sm text-slate-200"
              >
                {frame.functionName || JSON.stringify(frame)}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
