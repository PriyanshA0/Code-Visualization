"use client";

import React, { useEffect, useMemo, useRef } from "react";
import { ExecutionTrace } from "@/lib/codeExecution/types";
import VariablesPanel from "./visualizers/VariablesPanel";
import ObjectMotionPanel from "./visualizers/ObjectMotionPanel";

interface VisualizerProps {
  code: string;
  language: "javascript" | "python" | "java" | "cpp";
  executionTrace: ExecutionTrace | null;
  currentStepIndex: number;
  speed: number;
  isRunning: boolean;
  onStep: (step: number) => void;
}

function StepControlRow({
  isRunning,
  currentStep,
  totalSteps,
  onStep,
}: {
  isRunning: boolean;
  currentStep: number;
  totalSteps: number;
  onStep: (step: number) => void;
}) {
  const canMove = totalSteps > 0;

  return (
    <div className="mt-3 flex flex-wrap gap-2">
      <button
        onClick={() => onStep(0)}
        disabled={isRunning || !canMove || currentStep === 0}
        className="rounded-xl border border-white/8 bg-white/5 px-3 py-1.5 text-xs font-medium text-slate-200 transition hover:bg-white/10 disabled:opacity-50"
        title="Start"
      >
        Start
      </button>
      <button
        onClick={() => onStep(Math.max(0, currentStep - 1))}
        disabled={isRunning || !canMove || currentStep === 0}
        className="rounded-xl border border-white/8 bg-white/5 px-3 py-1.5 text-xs font-medium text-slate-200 transition hover:bg-white/10 disabled:opacity-50"
        title="Previous"
      >
        Prev
      </button>
      <button
        onClick={() => onStep(Math.min(totalSteps - 1, currentStep + 1))}
        disabled={isRunning || !canMove || currentStep >= totalSteps - 1}
        className="rounded-xl bg-gradient-to-r from-indigo-500 to-violet-500 px-3 py-1.5 text-xs font-medium text-white shadow-lg shadow-indigo-500/25 transition hover:brightness-110 disabled:opacity-50"
        title="Next"
      >
        Next
      </button>
      <button
        onClick={() => onStep(Math.max(totalSteps - 1, 0))}
        disabled={isRunning || !canMove || currentStep >= totalSteps - 1}
        className="rounded-xl border border-white/8 bg-white/5 px-3 py-1.5 text-xs font-medium text-slate-200 transition hover:bg-white/10 disabled:opacity-50"
        title="End"
      >
        End
      </button>
      <span className="w-full pt-1 text-right text-[10px] uppercase tracking-[0.16em] text-slate-500 sm:ml-auto sm:w-auto sm:pt-0 sm:tracking-[0.2em]">
        Step {totalSteps > 0 ? currentStep + 1 : 0}/{totalSteps}
      </span>
    </div>
  );
}

export default function Visualizer({
  code,
  language,
  executionTrace,
  currentStepIndex,
  speed,
  isRunning,
  onStep,
}: VisualizerProps) {
  const codeContainerRef = useRef<HTMLDivElement | null>(null);

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
  const lines = useMemo(() => code.split("\n"), [code]);

  const visitedLineHits = useMemo(() => {
    if (!executionTrace || executionTrace.steps.length === 0) {
      return new Map<number, number>();
    }

    const hits = new Map<number, number>();
    const maxIndex = Math.min(currentStepIndex, executionTrace.steps.length - 1);

    for (let i = 0; i <= maxIndex; i++) {
      const step = executionTrace.steps[i];
      if (!step?.line) continue;
      hits.set(step.line, (hits.get(step.line) || 0) + 1);
    }

    return hits;
  }, [executionTrace, currentStepIndex]);

  const progressPercent =
    executionTrace && executionTrace.totalSteps > 0
      ? Math.min(((currentStepIndex + 1) / executionTrace.totalSteps) * 100, 100)
      : 0;

  const relativeTime =
    executionTrace && executionTrace.steps.length > 0 && currentStep
      ? Math.max(currentStep.timestamp - executionTrace.steps[0].timestamp, 0)
      : 0;

  useEffect(() => {
    if (!currentLineNumber || !codeContainerRef.current) {
      return;
    }

    const lineNode = codeContainerRef.current.querySelector(
      `[data-line-number="${currentLineNumber}"]`
    ) as HTMLElement | null;

    if (!lineNode) {
      return;
    }

    const container = codeContainerRef.current;
    const containerRect = container.getBoundingClientRect();
    const lineRect = lineNode.getBoundingClientRect();
    const targetTop =
      container.scrollTop +
      (lineRect.top - containerRect.top) -
      container.clientHeight / 2 +
      lineRect.height / 2;
    container.scrollTo({ top: Math.max(0, targetTop), behavior: "smooth" });
  }, [currentLineNumber]);

  const totalSteps = executionTrace?.totalSteps ?? 0;
  const isCompiledLanguage = language === "java" || language === "cpp";
  const hasNoTrace = Boolean(executionTrace) && totalSteps === 0;

  return (
    <div className="flex h-full min-h-0 flex-col gap-4 overflow-y-auto rounded-[24px] border border-white/8 bg-[#141a2a] p-4 shadow-[0_16px_70px_rgba(0,0,0,0.35)]">
      <div className="rounded-2xl border border-white/6 bg-[#0b1020] p-3 sm:p-4">
        {hasNoTrace && isCompiledLanguage && (
          <div className="mb-3 rounded-xl border border-amber-300/25 bg-amber-400/10 px-3 py-2 text-xs text-amber-100">
            Line-by-line variable tracing is not available for {language.toUpperCase()} yet. You can still run code and inspect output/errors.
          </div>
        )}
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2 text-xs uppercase tracking-[0.2em] text-slate-400 sm:tracking-[0.3em]">
          <span>Live Visualization</span>
          <div className="flex items-center gap-2 text-[11px] tracking-[0.14em] text-slate-500 sm:gap-3 sm:tracking-[0.2em]">
            <span>Speed: {speed.toFixed(1)}x</span>
            <span className="h-1.5 w-16 rounded-full bg-white/10 sm:w-24">
              <span
                className="block h-full rounded-full bg-indigo-500 transition-all duration-300"
                style={{ width: `${speedFill}%` }}
              />
            </span>
          </div>
        </div>
        <div className="mb-3 grid gap-2 sm:grid-cols-[1fr_auto]">
          <div>
            <p className="text-[11px] uppercase tracking-[0.16em] text-slate-500 sm:tracking-[0.28em]">
              Execution Timeline
            </p>
            <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-white/8">
              <span
                className="block h-full rounded-full bg-gradient-to-r from-cyan-400 via-indigo-500 to-violet-500 transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
          <div className="rounded-xl border border-white/8 bg-white/4 px-3 py-2 text-[11px] text-slate-300">
            <span className="font-semibold text-slate-100">Frame</span> {Math.max(currentStepIndex + 1, 0)}
            {executionTrace ? `/${executionTrace.totalSteps}` : "/0"}
            <span className="mx-2 text-slate-500">|</span>
            <span className="font-semibold text-slate-100">t+</span> {relativeTime}ms
          </div>
        </div>
        <div ref={codeContainerRef} className="max-h-[380px] overflow-y-auto rounded-xl border border-white/6 bg-[#11182b] sm:max-h-[470px]">
          <div className="font-mono text-sm text-slate-200">
            {lines.map((line, index) => {
              const lineNumber = index + 1;
              const isCurrentLine = lineNumber === currentLineNumber;
              const hitCount = visitedLineHits.get(lineNumber) || 0;
              const isVisited = hitCount > 0;
              const isFutureLine = currentLineNumber > 0 && lineNumber > currentLineNumber;

              return (
                <div
                  key={index}
                  data-line-number={lineNumber}
                  className={`flex ${
                    isCurrentLine
                      ? "line-focus-active bg-indigo-500/20 text-white"
                      : isVisited
                      ? "bg-cyan-400/6 text-slate-100"
                      : isFutureLine
                      ? "text-slate-400"
                      : "hover:bg-white/5"
                  } transition-all duration-200`}
                >
                  <div
                    className={`w-12 text-right pr-4 py-1 ${
                      isCurrentLine
                        ? "bg-indigo-500/35 text-indigo-100"
                        : isVisited
                        ? "bg-cyan-500/14 text-cyan-200"
                        : "bg-[#0b1020] text-slate-500"
                    } border-r border-white/6 transition-colors duration-200`}
                  >
                    {lineNumber}
                  </div>
                  <div className="flex min-w-0 flex-1 items-center gap-3 px-4 py-1 whitespace-pre-wrap break-words transition-transform duration-200">
                    {isVisited && (
                      <span
                        className={`inline-flex min-w-8 items-center justify-center rounded-full border px-1.5 py-0.5 text-[10px] font-bold tracking-[0.1em] ${
                          isCurrentLine
                            ? "border-indigo-200/30 bg-indigo-300/20 text-indigo-100"
                            : "border-cyan-300/20 bg-cyan-400/15 text-cyan-200"
                        }`}
                        title="Execution count on this line"
                      >
                        {hitCount}x
                      </span>
                    )}
                    {isCurrentLine && (
                      <span
                        className="line-caret-live h-4 w-1 rounded-full bg-indigo-300"
                        aria-hidden="true"
                      />
                    )}
                    {line}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        <StepControlRow
          isRunning={isRunning}
          currentStep={currentStepIndex}
          totalSteps={totalSteps}
          onStep={onStep}
        />
      </div>

      <ObjectMotionPanel
        code={code}
        executionTrace={executionTrace}
        step={currentStep}
        previousStep={previousStep}
        currentStepIndex={currentStepIndex}
        speed={speed}
        isRunning={isRunning}
        onStep={onStep}
      />

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
