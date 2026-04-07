"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { ExecutionStep, ExecutionTrace } from "@/lib/codeExecution/types";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface ObjectMotionPanelProps {
  code: string;
  executionTrace: ExecutionTrace | null;
  step: ExecutionStep | null;
  previousStep: ExecutionStep | null;
  currentStepIndex: number;
  speed: number;
  isRunning: boolean;
  onStep: (step: number) => void;
}

type FlowKind =
  | "start" | "end" | "function" | "assign"
  | "logic"  | "io"   | "return"  | "call";

type FlowNode = {
  id: string; label: string; detail: string;
  lineNumber: number | null; kind: FlowKind;
  active: boolean; visited: boolean; hitCount: number;
  x: number; y: number; width: number; height: number;
};

type FlowEdge = {
  id: string; fromId: string; toId: string; label?: string;
  kind: "sequential" | "branch-no" | "loop-back";
  highlighted: boolean; animated: boolean;
};

// ─────────────────────────────────────────────────────────────────────────────
// Utilities
// ─────────────────────────────────────────────────────────────────────────────

function safeStr(value: unknown): string {
  try {
    if (value === null) return "null";
    if (value === undefined) return "undefined";
    if (typeof value === "string") return `"${value}"`;
    if (typeof value === "number" || typeof value === "boolean") return String(value);
    if (Array.isArray(value)) return `[${(value as unknown[]).map(safeStr).join(", ")}]`;
    return JSON.stringify(value);
  } catch { return "?"; }
}

function safeNum(value: unknown): string {
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (typeof value === "string") return value;
  return safeStr(value);
}

function isNumericArray(value: unknown): value is number[] {
  return Array.isArray(value) && value.length > 0 && (value as unknown[]).every((v) => typeof v === "number");
}

function isRenderablePrimArray(value: unknown): boolean {
  return Array.isArray(value) && value.length > 0 &&
    (value as unknown[]).every((v) => typeof v === "number" || typeof v === "string" || typeof v === "boolean" || v === null);
}

function stripQuotes(line: string) {
  return line.replace(/`[^`]*`/g, "").replace(/"([^"\\]|\\.)*"/g, "").replace(/'([^'\\]|\\.)*'/g, "");
}

function braceDelta(line: string) {
  const s = stripQuotes(line);
  return (s.match(/\{/g) || []).length - (s.match(/\}/g) || []).length;
}

function classifyKind(t: string): FlowKind {
  if (/^async\s+function|^function\s+\w/.test(t)) return "function";
  if (/^return\b/.test(t)) return "return";
  if (/^(if|else\s*if|else|switch|for|while|do)\b/.test(t)) return "logic";
  if (/^(console\.|print\b|alert\b)/.test(t)) return "io";
  if (/^(let|const|var)\s+/.test(t) || /\b\w+\s*=/.test(t)) return "assign";
  if (/\w+\s*\(/.test(t)) return "call";
  return "assign";
}

function labelFor(t: string): string {
  const fn = t.match(/^async\s+function\s+(\w+)\s*\(([^)]*)\)/) || t.match(/^function\s+(\w+)\s*\(([^)]*)\)/);
  if (fn) return `fn ${fn[1]}(${fn[2].replace(/\s+/g, " ")})`;

  const decl = t.match(/^(?:let|const|var)\s+(\w+)\s*=\s*(.+)$/);
  if (decl) {
    const rhs = decl[2].replace(/;$/, "");
    if (/^\[/.test(rhs)) return `${decl[1]} = […]`;
    if (/^\{/.test(rhs)) return `${decl[1]} = {…}`;
    if (/\w+\s*\(/.test(rhs)) return `${decl[1]} = call`;
    return `${decl[1]} = ${rhs.slice(0, 20)}`;
  }

  if (/^return\b/.test(t)) return `return ${t.replace(/^return\s*/, "").replace(/;$/, "").slice(0, 22)}`;
  if (/^(console\.|print\b|alert\b)/.test(t)) return "print output";

  if (/^(if|else\s*if|for|while)\b/.test(t)) {
    const kw = t.match(/^(\w+(?:\s+\w+)?)/)?.[1] ?? "";
    const cond = t.match(/\(([^)]{0,22})\)/)?.[1] ?? "";
    return `${kw} (${cond})`;
  }
  if (/^else\b/.test(t)) return "else";
  const call = t.match(/^(\w+)\s*\(/);
  if (call) return `call ${call[1]}()`;
  return t.slice(0, 26);
}

function getExecLines(code: string) {
  return code.split("\n")
    .map((raw, i) => ({ raw, lineNumber: i + 1, trimmed: raw.trim() }))
    .filter(({ trimmed }) =>
      trimmed.length > 0 && !trimmed.startsWith("//") &&
      !/^\{+$/.test(trimmed) && !/^\}+;?$/.test(trimmed));
}

// ─────────────────────────────────────────────────────────────────────────────
// Layout — single horizontal row
// ─────────────────────────────────────────────────────────────────────────────

const N_H = 84; const T_W = 80; const T_H = 32;
const N_MIN_W = 188; const N_MAX_W = 280; const H_GAP = 92;
const ROW_Y = 76; const TERM_Y = ROW_Y + (N_H - T_H) / 2;

function nodeW(label: string) {
  return Math.min(N_MAX_W, Math.max(N_MIN_W, label.length * 7.4 + 42));
}

// ─────────────────────────────────────────────────────────────────────────────
// Graph builder
// ─────────────────────────────────────────────────────────────────────────────

function buildGraph(
  code: string, currentLine: number, prevLine: number | null,
  visitCounts: Map<number, number>, isFirst: boolean, isFinal: boolean
) {
  const lines = getExecLines(code);
  if (!lines.length) return null;

  let depth = 0;
  const depths = lines.map(({ raw }) => {
    const d = Math.max(depth, 0);
    depth += braceDelta(raw);
    depth = Math.max(depth, 0);
    return d;
  });

  let rx = T_W + H_GAP;
  const nodes: FlowNode[] = lines.map((line, idx) => {
    const kind = classifyKind(line.trimmed);
    const label = labelFor(line.trimmed);
    const w = nodeW(label);
    const x = rx; rx += w + H_GAP;
    return {
      id: `L${line.lineNumber}`, label, detail: line.trimmed.slice(0, 38),
      lineNumber: line.lineNumber, kind,
      active: line.lineNumber === currentLine,
      visited: currentLine > 0 && line.lineNumber <= currentLine,
      hitCount: visitCounts.get(line.lineNumber) ?? 0,
      x, y: ROW_Y, width: w, height: N_H,
    };
  });

  const startNode: FlowNode = {
    id: "__start__", label: "START", detail: "", lineNumber: null, kind: "start",
    active: isFirst, visited: currentLine > 0, hitCount: 0,
    x: 0, y: TERM_Y, width: T_W, height: T_H,
  };
  const endNode: FlowNode = {
    id: "__end__", label: "END", detail: "", lineNumber: null, kind: "end",
    active: isFinal, visited: isFinal, hitCount: 0,
    x: rx, y: TERM_Y, width: T_W, height: T_H,
  };
  const all: FlowNode[] = [startNode, ...nodes, endNode];

  function nextAtDepth(from: number, maxD: number): FlowNode | null {
    for (let i = from; i < nodes.length; i++) { if (depths[i] <= maxD) return nodes[i]; }
    return null;
  }

  const edges: FlowEdge[] = [];
  const push = (e: FlowEdge) => edges.push(e);

  push({ id: `s-${nodes[0]?.id}`, fromId: "__start__", toId: nodes[0]?.id ?? "__end__", kind: "sequential", highlighted: false, animated: false });

  for (let i = 0; i < nodes.length; i++) {
    const from = nodes[i];
    const t = lines[i].trimmed;
    const isRet = /^return\b/.test(t);
    const isLast = i === nodes.length - 1;

    if (isRet) {
      push({ id: `${from.id}-exit`, fromId: from.id, toId: "__end__", kind: "sequential", highlighted: false, animated: false });
      continue;
    }
    if (!isLast) {
      push({ id: `${from.id}-${nodes[i + 1].id}`, fromId: from.id, toId: nodes[i + 1].id, kind: "sequential", highlighted: false, animated: false });
    }
    if (/^(if|else\s*if|for|while|switch)\b/.test(t) && !isLast) {
      const skip = nextAtDepth(i + 1, depths[i]);
      const next = nodes[i + 1];
      if (skip && skip.id !== next.id)
        push({ id: `${from.id}-skip-${skip.id}`, fromId: from.id, toId: skip.id, label: "no", kind: "branch-no", highlighted: false, animated: false });
      if (/^(for|while)\b/.test(t)) {
        const body = nextAtDepth(i + 1, depths[i] + 1);
        if (body)
          push({ id: `${body.id}-loop-${from.id}`, fromId: body.id, toId: from.id, label: "↺", kind: "loop-back", highlighted: false, animated: false });
      }
    }
  }

  const lastN = nodes[nodes.length - 1];
  if (lastN && !/^return\b/.test(lines[nodes.length - 1]?.trimmed ?? ""))
    push({ id: `${lastN.id}-end`, fromId: lastN.id, toId: "__end__", kind: "sequential", highlighted: false, animated: false });

  // Highlight exactly one edge
  edges.forEach((e) => { e.highlighted = false; e.animated = false; });
  const activate = (e: FlowEdge | undefined) => { if (e) { e.highlighted = true; e.animated = true; } };

  if (isFirst) activate(edges.find((e) => e.fromId === "__start__"));
  else if (isFinal) activate(edges.find((e) => e.toId === "__end__"));
  else if (prevLine !== null && currentLine !== 0)
    activate(edges.find((e) => {
      const fn = all.find((n) => n.id === e.fromId);
      const tn = all.find((n) => n.id === e.toId);
      return fn?.lineNumber === prevLine && tn?.lineNumber === currentLine;
    }));

  const hasLoop = edges.some((e) => e.kind === "loop-back");
  const hasBranch = edges.some((e) => e.kind === "branch-no");
  const maxX = Math.max(...all.map((n) => n.x + n.width));
  const width = maxX + 60;
  const height = ROW_Y + N_H + (hasLoop ? 110 : 44) + (hasBranch ? 72 : 0);
  const active = all.find((n) => n.lineNumber === currentLine);

  return { nodes: all, edges, width, height, activeLabel: active?.label ?? (isFirst ? "Start" : "End"), hasLoop, hasBranch };
}

// ─────────────────────────────────────────────────────────────────────────────
// Edge SVG paths
// ─────────────────────────────────────────────────────────────────────────────

function edgePath(from: FlowNode, to: FlowNode, kind: FlowEdge["kind"]): string {
  const backward = to.x < from.x || kind === "loop-back";
  const startX = from.x + from.width + 10;
  const endX = to.x - 10;
  const startY = from.y + from.height / 2;
  const endY = to.y + to.height / 2;

  if (backward) {
    const bottomY = Math.max(from.y + from.height, to.y + to.height) + 58;
    return `M ${from.x + from.width / 2} ${from.y + from.height} C ${from.x + from.width / 2} ${bottomY}, ${to.x + to.width / 2} ${bottomY}, ${to.x + to.width / 2} ${to.y + to.height}`;
  }

  const controlX = startX + Math.max(40, (endX - startX) * 0.34);
  const control2X = endX - Math.max(40, (endX - startX) * 0.34);
  return `M ${startX} ${startY} C ${controlX} ${startY}, ${control2X} ${endY}, ${endX} ${endY}`;
}

function edgeMid(from: FlowNode, to: FlowNode, kind: FlowEdge["kind"]) {
  const mx = (from.x + from.width / 2 + to.x + to.width / 2) / 2;
  if (kind === "loop-back") return { x: mx, y: Math.max(from.y + from.height, to.y + to.height) + 30 };
  if (kind === "branch-no") return { x: mx, y: Math.min(from.y, to.y) - 24 };
  return { x: (from.x + from.width + to.x) / 2, y: from.y + from.height / 2 - 14 };
}

// ─────────────────────────────────────────────────────────────────────────────
// Node colour theme
// ─────────────────────────────────────────────────────────────────────────────

function nodeTheme(kind: FlowKind, active: boolean, visited: boolean) {
  if (!active && !visited)
    return { bg: "rgba(255,255,255,0.02)", border: "rgba(255,255,255,0.06)", text: "#374151", glow: "none" };
  const themes: Record<FlowKind, { bg: string; border: string; text: string; glow: string }> = {
    start:    { bg: "rgba(8,145,178,0.18)",   border: "rgba(103,232,249,0.5)",  text: "#cffafe", glow: "0 0 22px rgba(34,211,238,0.25)" },
    end:      { bg: "rgba(8,145,178,0.18)",   border: "rgba(103,232,249,0.5)",  text: "#cffafe", glow: "0 0 22px rgba(34,211,238,0.25)" },
    function: { bg: "rgba(139,92,246,0.16)",  border: "rgba(196,181,253,0.5)",  text: "#ede9fe", glow: "0 0 22px rgba(139,92,246,0.25)" },
    logic:    { bg: "rgba(217,119,6,0.15)",   border: "rgba(252,211,77,0.5)",   text: "#fef3c7", glow: "0 0 22px rgba(234,179,8,0.25)" },
    return:   { bg: "rgba(16,185,129,0.15)",  border: "rgba(110,231,183,0.5)",  text: "#d1fae5", glow: "0 0 22px rgba(16,185,129,0.25)" },
    io:       { bg: "rgba(14,165,233,0.15)",  border: "rgba(125,211,252,0.5)",  text: "#e0f2fe", glow: "0 0 22px rgba(14,165,233,0.25)" },
    assign:   { bg: "rgba(99,102,241,0.14)",  border: "rgba(165,180,252,0.45)", text: "#e0e7ff", glow: "0 0 20px rgba(99,102,241,0.22)" },
    call:     { bg: "rgba(124,58,237,0.15)",  border: "rgba(196,181,253,0.45)", text: "#ede9fe", glow: "0 0 20px rgba(124,58,237,0.22)" },
  };
  const t = themes[kind] ?? themes.assign;
  if (active) return t;
  // dim non-active visited nodes
  return { ...t, bg: t.bg.replace(/[\d.]+\)$/, "0.06)"), border: t.border.replace(/[\d.]+\)$/, "0.18)"), text: "#64748b", glow: "none" };
}

// ─────────────────────────────────────────────────────────────────────────────
// StepRow
// ─────────────────────────────────────────────────────────────────────────────

function StepRow({ isRunning, currentStep, totalSteps, onStep }: {
  isRunning: boolean; currentStep: number; totalSteps: number; onStep: (s: number) => void;
}) {
  const off = isRunning || totalSteps === 0;
  return (
    <div className="flex flex-wrap items-center gap-2">
      <button onClick={() => onStep(0)} disabled={off || currentStep === 0}
        className="rounded-xl border border-white/8 bg-white/5 px-3 py-1.5 text-xs font-semibold text-slate-200 transition hover:bg-white/10 disabled:opacity-40">⏮</button>
      <button onClick={() => onStep(Math.max(0, currentStep - 1))} disabled={off || currentStep === 0}
        className="rounded-xl border border-white/8 bg-white/5 px-3 py-1.5 text-xs font-semibold text-slate-200 transition hover:bg-white/10 disabled:opacity-40">◀ Prev</button>
      <button onClick={() => onStep(Math.min(totalSteps - 1, currentStep + 1))} disabled={off || currentStep >= totalSteps - 1}
        className="rounded-xl bg-gradient-to-r from-indigo-500 to-violet-500 px-4 py-1.5 text-xs font-semibold text-white shadow-md shadow-indigo-500/30 transition hover:brightness-110 disabled:opacity-40">Next ▶</button>
      <button onClick={() => onStep(totalSteps - 1)} disabled={off || currentStep >= totalSteps - 1}
        className="rounded-xl border border-white/8 bg-white/5 px-3 py-1.5 text-xs font-semibold text-slate-200 transition hover:bg-white/10 disabled:opacity-40">⏭</button>
      <span className="ml-auto text-[10px] uppercase tracking-[0.2em] text-slate-500">
        {totalSteps > 0 ? currentStep + 1 : 0} / {totalSteps}
      </span>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ARRAY VISUALIZER  (bar chart + swap arcs + comparison brackets)
// ─────────────────────────────────────────────────────────────────────────────

function ArrayVisualizer({ step, previousStep, currentStepIndex }: {
  step: ExecutionStep | null; previousStep: ExecutionStep | null; currentStepIndex: number;
}) {
  const arrEntry = useMemo(() => {
    if (!step) return null;
    for (const [name, value] of Object.entries(step.variables))
      if (isNumericArray(value)) return { name, values: value };
    for (const [name, value] of Object.entries(step.variables))
      if (isRenderablePrimArray(value)) return { name, values: value as number[] };
    return null;
  }, [step]);

  const prevArrEntry = useMemo(() => {
    if (!previousStep) return null;
    for (const [name, value] of Object.entries(previousStep.variables))
      if (isNumericArray(value)) return { name, values: value };
    for (const [name, value] of Object.entries(previousStep.variables))
      if (isRenderablePrimArray(value)) return { name, values: value as number[] };
    return null;
  }, [previousStep]);

  const loopVars = useMemo(() => {
    if (!step) return { i: null as number | null, j: null as number | null };
    const v = step.variables as Record<string, unknown>;
    return {
      i: typeof v["i"] === "number" ? v["i"] as number : null,
      j: typeof v["j"] === "number" ? v["j"] as number : null,
    };
  }, [step]);

  if (!arrEntry) return (
    <div className="rounded-2xl border border-dashed border-white/10 py-10 text-center">
      <p className="text-sm text-slate-500">No array found at this step</p>
      <p className="mt-1 text-xs text-slate-600">Switch to Flow or Variables tab to inspect state</p>
    </div>
  );

  const vals = arrEntry.values;
  const prevVals = prevArrEntry?.values ?? vals;
  const n = vals.length;

  const changedIdx = new Set<number>();
  for (let k = 0; k < Math.max(vals.length, prevVals.length); k++)
    if (vals[k] !== prevVals[k]) changedIdx.add(k);

  const isSwap = changedIdx.size >= 2;
  const swapPair = isSwap ? (Array.from(changedIdx).slice(0, 2) as [number, number]) : null;

  const BAR_W = Math.max(30, Math.min(56, Math.floor(560 / n) - 8));
  const BAR_GAP = 8;
  const MAX_H = 130;
  const PAD = 24;
  const svgW = n * (BAR_W + BAR_GAP) + PAD * 2;
  const svgH = MAX_H + 70;
  const maxVal = Math.max(...vals.map(Number), 1);

  // Detect sorted suffix
  let sortedFrom = n;
  for (let k = n - 1; k >= 0; k--) {
    const slice = vals.slice(k);
    const sorted = slice.every((_, idx, a) => idx === 0 || Number(a[idx]) >= Number(a[idx - 1]));
    if (!sorted) { sortedFrom = k + 1; break; }
    if (k === 0) sortedFrom = 0;
  }

  const bx = (i: number) => PAD + i * (BAR_W + BAR_GAP);
  const bh = (v: number) => Math.max(8, Math.round((v / maxVal) * MAX_H));

  return (
    <div className="mb-6 rounded-2xl border border-white/8 bg-[#090e1a] p-5 pb-6">
      {/* Header */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-[0.22em] text-slate-400">Array Visualizer</span>
          <span className="rounded-full border border-indigo-400/25 bg-indigo-500/10 px-2 py-0.5 font-mono text-[11px] text-indigo-200">
            {arrEntry.name}[{n}]
          </span>
          <span className="rounded-full border border-white/8 bg-white/5 px-2 py-0.5 text-[11px] text-slate-300">
            step {currentStepIndex + 1}
          </span>
        </div>
        <div className="flex flex-wrap gap-2 text-[11px]">
          {loopVars.i !== null && (
            <span className="rounded-full border border-amber-400/30 bg-amber-500/12 px-2.5 py-0.5 font-mono text-amber-200">i={loopVars.i}</span>
          )}
          {loopVars.j !== null && (
            <span className="rounded-full border border-cyan-400/30 bg-cyan-500/12 px-2.5 py-0.5 font-mono text-cyan-200">j={loopVars.j}</span>
          )}
          {isSwap && (
            <span className="rounded-full border border-rose-400/30 bg-rose-500/12 px-2.5 py-0.5 font-semibold text-rose-200">⇄ SWAP</span>
          )}
          {!isSwap && loopVars.j !== null && (
            <span className="rounded-full border border-amber-400/30 bg-amber-500/12 px-2.5 py-0.5 text-amber-200">CMP [{loopVars.j}]↔[{(loopVars.j as number) + 1}]</span>
          )}
        </div>
      </div>

      {/* Chart */}
      <div className="overflow-x-auto overflow-y-hidden pb-2">
        <svg width={svgW} height={svgH} viewBox={`0 0 ${svgW} ${svgH}`} className="overflow-hidden">
          <defs>
            <linearGradient id="g-norm" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="rgba(99,102,241,0.9)" />
              <stop offset="100%" stopColor="rgba(55,48,163,0.65)" />
            </linearGradient>
            <linearGradient id="g-cmp" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="rgba(251,191,36,1)" />
              <stop offset="100%" stopColor="rgba(180,83,9,0.75)" />
            </linearGradient>
            <linearGradient id="g-swap" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="rgba(248,113,113,1)" />
              <stop offset="100%" stopColor="rgba(185,28,28,0.7)" />
            </linearGradient>
            <linearGradient id="g-sorted" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="rgba(52,211,153,0.9)" />
              <stop offset="100%" stopColor="rgba(6,95,70,0.65)" />
            </linearGradient>
            <filter id="glow-cmp" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="3" result="b" />
              <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
            <filter id="glow-swap" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="4" result="b" />
              <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
            <marker id="ma-swap" markerWidth="7" markerHeight="7" refX="5" refY="3.5" orient="auto">
              <path d="M0,0 L0,7 L6,3.5 z" fill="rgba(248,113,113,0.9)" />
            </marker>
            <marker id="ma-cmp" markerWidth="7" markerHeight="7" refX="5" refY="3.5" orient="auto">
              <path d="M0,0 L0,7 L6,3.5 z" fill="rgba(251,191,36,0.9)" />
            </marker>
          </defs>

          {/* Baseline */}
          <line x1={PAD - 6} y1={MAX_H + 2} x2={svgW - PAD + 6} y2={MAX_H + 2} stroke="rgba(148,163,184,0.12)" strokeWidth="1" />

          {/* Comparison arc */}
          {!isSwap && loopVars.j !== null && (loopVars.j as number) + 1 < n && (() => {
            const j = loopVars.j as number;
            const x1 = bx(j) + BAR_W / 2, x2 = bx(j + 1) + BAR_W / 2;
            const top = -20;
            return (
              <g>
                <path d={`M${x1},4 C${x1},${top} ${x2},${top} ${x2},4`}
                  fill="none" stroke="rgba(251,191,36,0.55)" strokeWidth="1.5" strokeDasharray="4 3" markerEnd="url(#ma-cmp)" />
                <text x={(x1 + x2) / 2} y={top - 5} textAnchor="middle" fontSize="9" fill="rgba(251,191,36,0.8)" letterSpacing=".06em">CMP</text>
              </g>
            );
          })()}

          {/* Swap arcs */}
          {swapPair && (() => {
            const [a, b] = swapPair;
            const x1 = bx(a) + BAR_W / 2, x2 = bx(b) + BAR_W / 2;
            const top = -24;
            return (
              <g>
                <path d={`M${x1},2 C${x1},${top} ${x2},${top} ${x2},2`}
                  fill="none" stroke="rgba(248,113,113,0.8)" strokeWidth="2" markerEnd="url(#ma-swap)" />
                <path d={`M${x2},2 C${x2},${top} ${x1},${top} ${x1},2`}
                  fill="none" stroke="rgba(248,113,113,0.8)" strokeWidth="2" markerEnd="url(#ma-swap)" />
                <text x={(x1 + x2) / 2} y={top - 6} textAnchor="middle" fontSize="9" fontWeight="700" fill="rgba(248,113,113,0.9)" letterSpacing=".06em">SWAP</text>
              </g>
            );
          })()}

          {/* Sorted boundary */}
          {sortedFrom < n && (
            <g>
              <line x1={bx(sortedFrom) - 5} y1={-10} x2={bx(sortedFrom) - 5} y2={MAX_H + 2}
                stroke="rgba(52,211,153,0.3)" strokeWidth="1.5" strokeDasharray="4 3" />
              <text x={bx(sortedFrom) - 9} y={MAX_H / 2} textAnchor="end" fontSize="9" fill="rgba(52,211,153,0.55)">sorted →</text>
            </g>
          )}

          {/* Bars */}
          {vals.map((rawVal, idx) => {
            const v = Number(rawVal);
            const h = bh(v);
            const x = bx(idx), y = MAX_H - h;
            const isSorted = idx >= sortedFrom;
            const isSwapped = swapPair?.includes(idx) ?? false;
            const isCmp = !isSwap && loopVars.j !== null && (idx === loopVars.j || idx === (loopVars.j as number) + 1);

            let fill = "url(#g-norm)";
            let strokeC = "rgba(255,255,255,0.05)";
            let sw = 1;
            let filter: string | undefined;

            if (isSorted && !isSwapped && !isCmp) fill = "url(#g-sorted)";
            if (isCmp) { fill = "url(#g-cmp)"; strokeC = "rgba(251,191,36,0.4)"; sw = 1.5; filter = "url(#glow-cmp)"; }
            if (isSwapped) { fill = "url(#g-swap)"; strokeC = "rgba(248,113,113,0.5)"; sw = 2; filter = "url(#glow-swap)"; }

            return (
              <g key={idx}>
                {/* Shadow */}
                <rect x={x + 2} y={y + 3} width={BAR_W} height={h} rx={4} fill="rgba(0,0,0,0.25)" />
                {/* Bar */}
                <rect x={x} y={y} width={BAR_W} height={h} rx={4}
                  fill={fill} stroke={strokeC} strokeWidth={sw} filter={filter} />
                {/* Value above */}
                <text x={x + BAR_W / 2} y={y - 5} textAnchor="middle"
                  fontSize={BAR_W > 40 ? 11 : 9} fontWeight="700"
                  fill={isSwapped ? "#fca5a5" : isCmp ? "#fde68a" : isSorted ? "#6ee7b7" : "#64748b"}>
                  {rawVal}
                </text>
                {/* Index below */}
                <text x={x + BAR_W / 2} y={MAX_H + 17} textAnchor="middle" fontSize={9}
                  fill={loopVars.j === idx ? "rgba(165,180,252,0.9)" : "rgba(71,85,105,0.7)"}>
                  [{idx}]
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Pill row */}
      <div className="mt-3 flex flex-wrap gap-1.5">
        {vals.map((v, i) => {
          const isSwapped = swapPair?.includes(i) ?? false;
          const isCmp = !isSwap && loopVars.j !== null && (i === loopVars.j || i === (loopVars.j as number) + 1);
          const isSorted = i >= sortedFrom;
          return (
            <span key={i}
              className={`inline-flex min-w-[2rem] items-center justify-center rounded-lg border px-2 py-0.5 font-mono text-xs font-semibold transition-all duration-200 ${
                isSwapped ? "border-rose-400/40 bg-rose-500/15 text-rose-200"
                  : isCmp    ? "border-amber-400/35 bg-amber-500/12 text-amber-200"
                  : isSorted ? "border-emerald-400/25 bg-emerald-500/10 text-emerald-200"
                  : "border-white/8 bg-white/5 text-slate-300"
              }`}>
              {safeNum(v)}
            </span>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-3 flex flex-wrap gap-4 text-[10px] text-slate-600">
        {[
          { c: "bg-amber-400/60", l: "Comparing" },
          { c: "bg-rose-400/60",  l: "Swapped"   },
          { c: "bg-emerald-400/60", l: "Sorted"  },
          { c: "bg-indigo-500/60",  l: "Unsorted" },
        ].map(({ c, l }) => (
          <span key={l} className="flex items-center gap-1.5">
            <span className={`inline-block h-2 w-3 rounded-sm ${c}`} />{l}
          </span>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// VARIABLE WATCH
// ─────────────────────────────────────────────────────────────────────────────

function VariableWatch({ step, previousStep }: { step: ExecutionStep | null; previousStep: ExecutionStep | null }) {
  if (!step) return null;
  const entries = Object.entries(step.variables).slice(0, 16);
  if (!entries.length) return null;

  return (
    <div className="mb-6 rounded-2xl border border-white/8 bg-[#090e1a] p-4 pb-6">
      <p className="mb-3 text-xs font-bold uppercase tracking-[0.22em] text-slate-400">Variable Watch</p>
      <div className="space-y-1.5">
        {entries.map(([key, val]) => {
          const prev = previousStep?.variables?.[key];
          const changed = prev !== undefined && safeStr(prev) !== safeStr(val);
          const isNew = prev === undefined;
          const display = Array.isArray(val)
            ? `[${(val as unknown[]).map(safeNum).join(", ")}]`
            : safeStr(val);
          const truncated = display.length > 42 ? display.slice(0, 42) + "…" : display;

          return (
            <div key={key} className={`flex items-center gap-3 rounded-xl px-3 py-2 text-xs transition-all duration-200 ${
              isNew ? "border border-fuchsia-400/20 bg-fuchsia-500/8"
                : changed ? "border border-cyan-400/20 bg-cyan-500/8"
                : "border border-white/5 bg-white/3"
            }`}>
              <span className={`w-24 shrink-0 font-mono font-semibold ${isNew ? "text-fuchsia-300" : changed ? "text-cyan-300" : "text-slate-300"}`}>
                {key}
              </span>
              <span className="shrink-0 text-slate-600">=</span>
              <span className={`truncate font-mono ${isNew ? "text-fuchsia-200" : changed ? "text-cyan-200" : "text-slate-400"}`} title={display}>
                {truncated}
              </span>
              {(changed || isNew) && (
                <span className={`ml-auto shrink-0 rounded-full px-1.5 py-0.5 text-[9px] uppercase tracking-widest ${
                  isNew ? "bg-fuchsia-500/20 text-fuchsia-300" : "bg-cyan-500/20 text-cyan-300"
                }`}>
                  {isNew ? "new" : "changed"}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// FLOW DIAGRAM
// ─────────────────────────────────────────────────────────────────────────────

function FlowDiagram({ flowGraph, currentStepIndex, totalSteps }: {
  flowGraph: ReturnType<typeof buildGraph>; currentStepIndex: number; totalSteps: number;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const c = scrollRef.current;
    if (!c || !flowGraph) return;
    const active = flowGraph.nodes.find((n) => n.active) ?? flowGraph.nodes[0];
    if (active) c.scrollTo({ left: Math.max(0, active.x + active.width / 2 - c.clientWidth / 2), behavior: "smooth" });
  }, [flowGraph, currentStepIndex]);

  if (!flowGraph) return null;
  const AID = "fd-a", AID_ACT = "fd-aa";

  return (
    <div className="rounded-2xl border border-white/8 bg-[#090e1a] p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <span className="text-xs font-bold uppercase tracking-[0.22em] text-slate-400">Code Flow</span>
        <div className="flex gap-2 text-[11px]">
          <span className="rounded-full border border-white/8 bg-white/5 px-2 py-0.5 text-slate-300">
            {Math.min(currentStepIndex + 1, totalSteps)}/{totalSteps}
          </span>
          <span className="rounded-full border border-cyan-400/20 bg-cyan-500/8 px-2 py-0.5 text-cyan-300">
            {flowGraph.activeLabel}
          </span>
        </div>
      </div>

      <div ref={scrollRef} className="overflow-x-auto overflow-y-hidden pb-2">
        <div className="relative overflow-hidden rounded-xl border border-white/8 bg-[#0d1323]" style={{ width: flowGraph.width, height: flowGraph.height, minWidth: "100%" }}>
          {/* Dot grid */}
          <div className="pointer-events-none absolute inset-0 z-0 opacity-25" style={{
            backgroundImage: "radial-gradient(circle, rgba(148,163,184,0.2) 1px, transparent 1px)",
            backgroundSize: "24px 24px",
          }} />

          {/* SVG edges */}
          <svg className="pointer-events-none absolute inset-0 z-10 overflow-hidden"
            width={flowGraph.width} height={flowGraph.height}
            viewBox={`0 0 ${flowGraph.width} ${flowGraph.height}`}>
            <defs>
              <marker id={AID} markerWidth="9" markerHeight="9" refX="7" refY="4.5" orient="auto" markerUnits="strokeWidth">
                <path d="M0,1 L0,8 L8,4.5 z" fill="rgba(100,116,139,0.45)" />
              </marker>
              <marker id={AID_ACT} markerWidth="9" markerHeight="9" refX="7" refY="4.5" orient="auto" markerUnits="strokeWidth">
                <path d="M0,1 L0,8 L8,4.5 z" fill="#67e8f9" />
              </marker>
            </defs>

            {flowGraph.edges.map((edge) => {
              const fn = flowGraph.nodes.find((n) => n.id === edge.fromId);
              const tn = flowGraph.nodes.find((n) => n.id === edge.toId);
              if (!fn || !tn) return null;
              const d = edgePath(fn, tn, edge.kind);
              const act = edge.highlighted;
              return (
                <path key={edge.id} d={d} fill="none"
                  stroke={act ? "#67e8f9" : edge.kind === "loop-back" ? "rgba(148,163,184,0.14)" : "rgba(148,163,184,0.24)"}
                  strokeWidth={act ? 2.5 : 1.5}
                  strokeDasharray={edge.kind === "loop-back" ? "5 5" : undefined}
                  markerEnd={`url(#${act ? AID_ACT : AID})`}
                  opacity={act ? 1 : 0.65} />
              );
            })}

            
          </svg>

          {/* HTML nodes */}
          {flowGraph.nodes.map((node) => {
            const theme = nodeTheme(node.kind, node.active, node.visited);
            const isTerm = node.kind === "start" || node.kind === "end";
            const label = node.label;
            const detail = node.detail;
            return (
              <div key={node.id}
                className={`absolute z-20 flex flex-col items-center justify-center px-3 select-none transition-all duration-300 ${isTerm ? "rounded-full" : "rounded-2xl"}`}
                style={{
                  left: node.x, top: node.y, width: node.width, height: node.height,
                  background: theme.bg, border: `${node.active ? "2px" : "1px"} solid ${theme.border}`,
                  color: theme.text, boxShadow: node.active ? theme.glow : "none",
                }}>
                {isTerm ? (
                  <span className="text-[11px] font-black uppercase tracking-[0.18em]">{node.label}</span>
                ) : (
                  <>
                    <span className="w-full truncate text-center text-[11px] font-semibold leading-tight" title={node.label}>{label}</span>
                    <span className="mt-0.5 w-full truncate text-center font-mono text-[9px] opacity-50" title={node.detail}>{detail}</span>
                  </>
                )}
                {node.lineNumber && (
                  <span className="absolute -top-2 right-1 z-30 rounded-full px-1.5 py-px text-[9px]"
                    style={{ background: "rgba(9,14,26,0.9)", border: "1px solid rgba(148,163,184,0.15)", color: node.active ? "#c7d2fe" : "#374151" }}>
                    L{node.lineNumber}{node.hitCount > 1 ? ` ×${node.hitCount}` : ""}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="mt-2 flex flex-wrap gap-4 text-[10px] text-slate-600">
        {[
          { c: "bg-indigo-500/50", l: "Active" },
          { c: "bg-white/15", l: "Visited" },
          { c: "bg-amber-500/50", l: "Decision" },
          { c: "bg-emerald-500/50", l: "Return" },
          { c: "bg-violet-500/50", l: "Function" },
        ].map(({ c, l }) => (
          <span key={l} className="flex items-center gap-1.5">
            <span className={`inline-block h-2 w-2 rounded-sm ${c}`} />{l}
          </span>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// EXECUTION LOG
// ─────────────────────────────────────────────────────────────────────────────

function ExecLog({ executionTrace, currentStepIndex }: {
  executionTrace: ExecutionTrace | null; currentStepIndex: number;
}) {
  const lines = useMemo(() => {
    if (!executionTrace) return [];
    return executionTrace.steps.slice(0, currentStepIndex + 1).slice(-20).reverse();
  }, [executionTrace, currentStepIndex]);

  if (!lines.length) return (
    <div className="rounded-2xl border border-white/8 bg-[#090e1a] py-10 text-center">
      <p className="text-sm text-slate-500">No log entries yet</p>
    </div>
  );

  return (
    <div className="rounded-2xl border border-white/8 bg-[#090e1a] p-4">
      <p className="mb-3 text-xs font-bold uppercase tracking-[0.22em] text-slate-400">Execution Log</p>
      <div className="space-y-0.5 font-mono text-[11px]">
        {lines.map((s, idx) => (
          <div key={idx} className={`flex items-start gap-2 rounded-lg px-2 py-1.5 ${idx === 0 ? "bg-indigo-500/10 text-indigo-200" : "text-slate-500"}`}>
            <span className="mt-0.5 shrink-0 rounded border border-white/8 bg-white/5 px-1 text-[9px] text-slate-600">L{s.line}</span>
            <span className="truncate">{s.description ?? `line ${s.line}`}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN
// ─────────────────────────────────────────────────────────────────────────────

type Tab = "array" | "flow" | "vars" | "log";

export default function ObjectMotionPanel({
  code, executionTrace, step, previousStep,
  currentStepIndex, speed, isRunning, onStep,
}: ObjectMotionPanelProps) {
  const [activeTab, setActiveTab] = useState<Tab>("array");

  const currentLine = step?.line ?? 0;
  const prevLine = previousStep?.line ?? null;
  const totalSteps = executionTrace?.totalSteps ?? 0;
  const isFirst = totalSteps > 0 && currentStepIndex === 0;
  const isFinal = totalSteps > 0 && currentStepIndex === totalSteps - 1;

  const visitCounts = useMemo(() => {
    if (!executionTrace) return new Map<number, number>();
    const m = new Map<number, number>();
    const max = Math.min(currentStepIndex, executionTrace.steps.length - 1);
    for (let i = 0; i <= max; i++) {
      const ln = executionTrace.steps[i]?.line;
      if (ln) m.set(ln, (m.get(ln) ?? 0) + 1);
    }
    return m;
  }, [executionTrace, currentStepIndex]);

  const flowGraph = useMemo(
    () => buildGraph(code, currentLine, prevLine, visitCounts, isFirst, isFinal),
    [code, currentLine, prevLine, visitCounts, isFirst, isFinal]
  );

  const progress = totalSteps > 0 ? Math.round(((currentStepIndex + 1) / totalSteps) * 100) : 0;

  const tabs: { id: Tab; icon: string; label: string }[] = [
    { id: "array", icon: "▦", label: "Array" },
    { id: "flow",  icon: "◈", label: "Flow"  },
    { id: "vars",  icon: "⊞", label: "Vars"  },
    { id: "log",   icon: "≡", label: "Log"   },
  ];

  return (
    <div className="flex min-h-0 flex-col gap-3 rounded-[24px] border border-white/8 bg-[#111827] p-4 shadow-[0_20px_80px_rgba(0,0,0,0.45)]">

      {/* ── Top bar ── */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Tab switcher */}
        <div className="flex items-center gap-1 rounded-xl border border-white/8 bg-[#090e1a] p-1">
          {tabs.map((t) => (
            <button key={t.id} onClick={() => setActiveTab(t.id)}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all duration-200 ${
                activeTab === t.id
                  ? "bg-indigo-500 text-white shadow-md shadow-indigo-500/30"
                  : "text-slate-400 hover:text-slate-200"
              }`}>
              <span>{t.icon}</span><span>{t.label}</span>
            </button>
          ))}
        </div>

        {/* Progress + speed */}
        <div className="flex items-center gap-3">
          <div className="hidden items-center gap-2 sm:flex">
            <div className="h-1.5 w-28 overflow-hidden rounded-full bg-white/8">
              <div
                className="h-full rounded-full bg-gradient-to-r from-cyan-400 via-indigo-500 to-violet-500 transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="text-[11px] tabular-nums text-slate-500">{progress}%</span>
          </div>
          <span className="rounded-xl border border-white/8 bg-white/5 px-3 py-1.5 text-[11px] font-semibold text-slate-200">
            {totalSteps > 0 ? currentStepIndex + 1 : 0} / {totalSteps}
          </span>
          <span className="rounded-xl border border-white/8 bg-white/5 px-2 py-1.5 text-[11px] text-slate-500">
            {speed.toFixed(1)}×
          </span>
        </div>
      </div>

      {/* ── Step controls ── */}
      <StepRow isRunning={isRunning} currentStep={currentStepIndex} totalSteps={totalSteps} onStep={onStep} />

      {/* ── Tab content ── */}
      {executionTrace ? (
        <div className="min-h-0">
          {activeTab === "array" && (
            <ArrayVisualizer step={step} previousStep={previousStep} currentStepIndex={currentStepIndex} />
          )}
          {activeTab === "flow" && (
            <FlowDiagram flowGraph={flowGraph} currentStepIndex={currentStepIndex} totalSteps={totalSteps} />
          )}
          {activeTab === "vars" && (
            <VariableWatch step={step} previousStep={previousStep} />
          )}
          {activeTab === "log" && (
            <ExecLog executionTrace={executionTrace} currentStepIndex={currentStepIndex} />
          )}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-white/10 py-14 text-center">
          <div className="text-3xl text-slate-600">▷</div>
          <p className="mt-3 text-sm font-medium text-slate-400">Run your code to start</p>
          <p className="mt-1 text-xs text-slate-600">Try bubble sort — paste an array and watch it animate step by step</p>
        </div>
      )}
    </div>
  );
}