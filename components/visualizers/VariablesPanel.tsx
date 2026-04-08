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
  const asJson = (value: unknown) => {
    try {
      return JSON.stringify(value);
    } catch {
      return String(value);
    }
  };

  const renderValue = (value: unknown): string => {
    if (value === null) return "null";
    if (value === undefined) return "undefined";
    if (typeof value === "object") return JSON.stringify(value, null, 2);
    return String(value);
  };

  return (
    <div className="pokemon-panel flex h-auto min-h-0 flex-col overflow-hidden rounded-[24px]">
      <div className="border-b border-yellow-300/15 p-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-yellow-100">Variables & State</h3>
          <span className="pokemon-chip rounded-full px-2.5 py-1 text-[10px] font-bold tracking-[0.25em]">
            ACTIVE STEP
          </span>
        </div>
        <p className="mt-2 text-xs tracking-[0.25em] text-slate-300 uppercase">
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
                const changed = !hadKey || asJson(previousValue) !== asJson(value);
                const changeState = !hadKey ? "new" : changed ? "updated" : "stable";

                return (
              <div
                key={key}
                className={`rounded-2xl border p-3 transition-all duration-300 ${
                  changed
                    ? "var-card-updated border-emerald-300/30 bg-emerald-400/10"
                    : "border-yellow-300/10 bg-[#0b1020]"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-white">{key}</p>
                  {changeState !== "stable" && (
                    <span className="rounded-full border border-yellow-300/20 bg-yellow-400/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-yellow-100">
                      {changeState}
                    </span>
                  )}
                </div>
                {hadKey && changed && (
                  <div className="mt-2 rounded-xl border border-yellow-300/10 bg-black/20 p-2 text-[11px] text-slate-300">
                    <p className="uppercase tracking-[0.2em] text-yellow-100/60">before</p>
                    <pre className="mt-1 overflow-x-auto text-xs text-slate-300">
                      {renderValue(previousValue)}
                    </pre>
                  </div>
                )}
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
        <div className="border-t border-yellow-300/15 p-4">
          <h4 className="mb-3 text-sm font-semibold uppercase tracking-[0.25em] text-yellow-100">
            Call Stack
          </h4>
          <div className="space-y-2">
            {step.callStack.map((frame: CallFrameInfo, idx: number) => (
              <div
                key={idx}
                className={`rounded-2xl border px-3 py-2 text-sm text-slate-200 ${
                  idx === step.callStack.length - 1
                    ? "border-yellow-300/30 bg-yellow-500/10"
                    : "border-indigo-400/20 bg-[#0b1020]"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span>{frame.functionName || JSON.stringify(frame)}</span>
                  {idx === step.callStack.length - 1 && (
                    <span className="rounded-full border border-yellow-300/20 bg-yellow-500/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-yellow-100">
                      current
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
