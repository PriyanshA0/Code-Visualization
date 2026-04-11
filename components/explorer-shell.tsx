"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { UserButton } from "@clerk/nextjs";
import CodeEditor from "@/components/CodeEditor";
import ExecutionControls from "@/components/ExecutionControls";
import Visualizer from "@/components/Visualizer";
import { ExecutionTrace } from "@/lib/codeExecution/types";
import { SnippetLibrary } from "@/components/snippet-library";

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

const initialPython = `def bubble_sort(arr):
    n = len(arr)
    for i in range(n):
        for j in range(0, n - i - 1):
            if arr[j] > arr[j + 1]:
                arr[j], arr[j + 1] = arr[j + 1], arr[j]
    return arr

data = [12, 24, 68, 42, 88, 15, 33, 57]
print(bubble_sort(data))`;

const initialJava = `import java.util.Arrays;

public class Main {
  static int[] bubbleSort(int[] arr) {
    int n = arr.length;
    for (int i = 0; i < n; i++) {
      for (int j = 0; j < n - i - 1; j++) {
        if (arr[j] > arr[j + 1]) {
          int temp = arr[j];
          arr[j] = arr[j + 1];
          arr[j + 1] = temp;
        }
      }
    }
    return arr;
  }

  public static void main(String[] args) {
    int[] data = {12, 24, 68, 42, 88, 15, 33, 57};
    System.out.println(Arrays.toString(bubbleSort(data)));
  }
}`;

const initialCpp = `#include <iostream>
#include <vector>

using namespace std;

vector<int> bubbleSort(vector<int> arr) {
  int n = static_cast<int>(arr.size());
  for (int i = 0; i < n; i++) {
    for (int j = 0; j < n - i - 1; j++) {
      if (arr[j] > arr[j + 1]) {
        int temp = arr[j];
        arr[j] = arr[j + 1];
        arr[j + 1] = temp;
      }
    }
  }
  return arr;
}

int main() {
  vector<int> data = {12, 24, 68, 42, 88, 15, 33, 57};
  vector<int> sorted = bubbleSort(data);

  for (size_t i = 0; i < sorted.size(); i++) {
    cout << sorted[i] << (i + 1 < sorted.size() ? " " : "\n");
  }

  return 0;
}`;

interface QuotaView {
  planType: "free" | "pro";
  quotaMode: "free" | "paid";
  freeLimit: number;
  freeUsed: number;
  freeRemaining: number;
  paidCreditsTotal: number;
  paidCreditsRemaining: number;
  resetAt: string;
}

function deriveEditorTitle(
  code: string,
  language: "javascript" | "python" | "java" | "cpp"
) {
  const lines = code.split("\n").map((line) => line.trim()).filter(Boolean);
  const firstLine = lines[0] ?? "";

  if (language === "python") {
    const fnMatch = code.match(/^\s*def\s+([A-Za-z_][\w]*)\s*\(/m);
    if (fnMatch) return `${fnMatch[1].toUpperCase()}.PY`;

    const classMatch = code.match(/^\s*class\s+([A-Za-z_][\w]*)\s*(?:\(|:)/m);
    if (classMatch) return `${classMatch[1].toUpperCase()}.PY`;

    return "UNTITLED.PY";
  }

  if (language === "java") {
    const classMatch = code.match(/^\s*public\s+class\s+([A-Za-z_][\w]*)/m);
    if (classMatch) return `${classMatch[1].toUpperCase()}.JAVA`;
    return "MAIN.JAVA";
  }

  if (language === "cpp") {
    const fnMatch = code.match(/^[\w:<>,\s*&]+\s+([A-Za-z_][\w]*)\s*\([^)]*\)\s*\{/m);
    if (fnMatch) return `${fnMatch[1].toUpperCase()}.CPP`;
    return "MAIN.CPP";
  }

  const fnMatch = code.match(/(?:function|const|let|var)\s+([A-Za-z_][\w]*)\s*(?:=\s*function\s*|=\s*\([^)]*\)\s*=>|\()/m);
  if (fnMatch) return `${fnMatch[1].toUpperCase()}.JS`;

  if (/^class\s+([A-Za-z_][\w]*)/m.test(code)) {
    const classMatch = code.match(/^\s*class\s+([A-Za-z_][\w]*)/m);
    if (classMatch) return `${classMatch[1].toUpperCase()}.JS`;
  }

  if (firstLine.startsWith("import ") || firstLine.startsWith("export ")) {
    return "MODULE.JS";
  }

  return "UNTITLED.JS";
}

export function ExplorerShell() {
  const [language, setLanguage] = useState<"javascript" | "python" | "java" | "cpp">("javascript");
  const [executionTrace, setExecutionTrace] = useState<ExecutionTrace | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [code, setCode] = useState(initialJavaScript);
  const [mode, setMode] = useState<"step" | "auto">("step");
  const [speed, setSpeed] = useState(1.5);
  const [quota, setQuota] = useState<QuotaView | null>(null);
  const [paywallMessage, setPaywallMessage] = useState<string | null>(null);
  const [showFreePrompt, setShowFreePrompt] = useState(false);
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);
  const editorTitle = deriveEditorTitle(code, language);

  const starterCodeByLanguage: Record<typeof language, string> = {
    javascript: initialJavaScript,
    python: initialPython,
    java: initialJava,
    cpp: initialCpp,
  };

  useEffect(() => {
    const bootstrapUser = async () => {
      try {
        await fetch("/api/user/bootstrap", {
          method: "POST",
          credentials: "include",
        });
      } catch {
        // Ignore bootstrap errors; quota/snippet routes will still handle access.
      }
    };

    bootstrapUser();

    const loadQuota = async () => {
      try {
        const response = await fetch("/api/usage/quota", {
          method: "GET",
          credentials: "include",
        });

        if (response.status === 401) {
          window.location.href = "/sign-in?redirect_url=%2Fvisualizer";
          return;
        }

        const payload = await response.json().catch(() => null);
        if (!response.ok) {
          return;
        }

        const nextQuota = payload?.quota as QuotaView | undefined;
        if (!nextQuota) {
          return;
        }

        setQuota(nextQuota);

        if (nextQuota.quotaMode === "free" && nextQuota.freeUsed === 0) {
          const promptKey = "talksy-free-attempt-prompt-seen";
          if (!window.sessionStorage.getItem(promptKey)) {
            setShowFreePrompt(true);
            window.sessionStorage.setItem(promptKey, "1");
          }
        }

        if (nextQuota.quotaMode === "free" && nextQuota.freeRemaining <= 0) {
          setPaywallMessage("You used all free attempts for this month. Purchase 10 credits to continue execution.");
          setShowUpgradePrompt(true);
        }

        if (nextQuota.quotaMode === "paid" && nextQuota.paidCreditsRemaining <= 0) {
          setPaywallMessage("You used all purchased credits. Buy 10 more credits to continue execution.");
          setShowUpgradePrompt(true);
        }
      } catch {
        // Do not block visualizer on quota fetch failures.
      }
    };

    loadQuota();
  }, []);

  const handleLanguageChange = (nextLanguage: typeof language) => {
    setLanguage(nextLanguage);
    setCode(starterCodeByLanguage[nextLanguage]);
    setExecutionTrace(null);
    setCurrentStep(0);
    setPaywallMessage(null);
  };

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
    setCode(code);
    setCurrentStep(0);
    setPaywallMessage(null);
    setShowUpgradePrompt(false);

    try {
      const endpoint =
        language === "javascript"
          ? "/api/execute/javascript"
          : language === "python"
          ? "/api/execute/python"
          : language === "java"
          ? "/api/execute/java"
          : "/api/execute/cpp";

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

      if (response.status === 401) {
        window.location.href = "/sign-in?redirect_url=%2Fvisualizer";
        return;
      }

      if (response.status === 402) {
        setQuota(trace?.quota ?? null);
        setPaywallMessage(
          trace?.error ||
            "No attempts remaining. Buy 10 credits to continue execution."
        );
        setShowUpgradePrompt(true);
        setExecutionTrace({
          steps: [],
          output: "",
          errors: trace?.error || "Free usage exhausted",
          totalSteps: 0,
          executionTime: 0,
        });
        return;
      }

      if (!response.ok) {
        throw new Error(trace?.error || "Failed to execute code");
      }

      setQuota(trace?.quota ?? null);

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

  const handleUpgrade = async () => {
    try {
      const response = await fetch("/api/billing/checkout", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ returnUrl: "/billing-success" }),
      });

      const payload = await response.json();
      if (payload?.checkoutUrl) {
        window.location.href = payload.checkoutUrl;
        return;
      }

      setPaywallMessage(payload?.message || "Checkout is not configured yet.");
    } catch {
      setPaywallMessage("Unable to start checkout right now. Please try again.");
    }
  };

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_20%_0%,rgba(250,204,21,0.18),transparent_26%),radial-gradient(circle_at_80%_0%,rgba(59,130,246,0.16),transparent_24%),linear-gradient(180deg,#04112b_0%,#071122_55%,#050911_100%)] px-3 py-3 text-yellow-50 sm:px-4 sm:py-4 lg:px-6 lg:py-6">
      {showFreePrompt && quota && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
          <div className="w-full max-w-md rounded-2xl border border-indigo-400/40 bg-[#10172a] p-6 text-yellow-50 shadow-[0_20px_80px_rgba(0,0,0,0.5)]">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-indigo-300">Free Plan</p>
            <h2 className="mt-3 text-xl font-bold">You have only 2 free attempts</h2>
            <p className="mt-3 text-sm leading-6 text-yellow-100/80">
              Use your executions carefully. After free attempts are finished, you will need to upgrade.
            </p>
            <p className="mt-4 text-sm text-yellow-100">
              Remaining now: <span className="font-semibold">{quota.freeRemaining}</span>
            </p>
            <button
              onClick={() => setShowFreePrompt(false)}
              className="mt-5 rounded-xl bg-gradient-to-r from-indigo-500 to-cyan-500 px-4 py-2 text-sm font-semibold text-white transition hover:brightness-110"
            >
              Continue
            </button>
          </div>
        </div>
      )}

      {showUpgradePrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 px-4">
          <div className="w-full max-w-md rounded-2xl border border-amber-400/35 bg-[#1b1308] p-6 text-yellow-50 shadow-[0_20px_80px_rgba(0,0,0,0.55)]">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-amber-300">Upgrade Required</p>
            <h2 className="mt-3 text-xl font-bold text-yellow-100">Execution attempts are finished</h2>
            <p className="mt-3 text-sm leading-6 text-yellow-100/80">
              {paywallMessage || "You have no attempts left. Buy 10 more credits to continue."}
            </p>
            <p className="mt-2 rounded-lg border border-emerald-300/30 bg-emerald-500/10 px-3 py-2 text-sm font-medium text-emerald-200">
              Message: Get 50% discount with code FREE24.
            </p>
            {quota && (
              <p className="mt-3 text-sm text-yellow-50/90">
                {quota.quotaMode === "paid"
                  ? `Credits remaining: ${quota.paidCreditsRemaining}/${quota.paidCreditsTotal}`
                  : `Used: ${quota.freeUsed}/${quota.freeLimit} · Next reset: ${new Date(quota.resetAt).toLocaleDateString()}`}
              </p>
            )}
            <div className="mt-5 flex gap-3">
              <button
                onClick={handleUpgrade}
                className="rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 px-4 py-2 text-sm font-semibold text-black transition hover:brightness-110"
              >
                Upgrade to Pro
              </button>
              <button
                onClick={() => setShowUpgradePrompt(false)}
                className="rounded-xl border border-amber-200/30 bg-white/5 px-4 py-2 text-sm font-semibold text-yellow-50 transition hover:bg-white/10"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <section className="mx-auto flex w-full max-w-[1700px] flex-col gap-4 screen-pokeball-open">
        <div className="pokemon-header flex flex-wrap items-center justify-between gap-3 rounded-2xl px-3 py-3 sm:px-4">
          <div className="flex min-w-0 flex-wrap items-center gap-2 sm:gap-3">
            <div className="screen-pokeball-ring flex h-10 w-10 items-center justify-center rounded-full bg-[#0b1020] p-1 sm:h-12 sm:w-12">
              <Image src="/pokemon/pokeball.png" alt="Pokeball" width={44} height={44} className="h-8 w-8 object-contain sm:h-10 sm:w-10" />
            </div>
            <div>
            <h1 className="text-xs font-semibold uppercase tracking-[0.14em] text-yellow-100 sm:text-sm sm:tracking-[0.2em]">
              Code Visualization
            </h1>
            <p className="text-[10px] uppercase tracking-[0.26em] text-slate-300">Pokemon runtime arena</p>
            </div>
            <Link
              href="/"
              className="pokemon-chip rounded-lg px-3 py-1.5 text-xs font-semibold transition hover:bg-yellow-400/20"
            >
              Home
            </Link>
            <UserButton />
          </div>
          <div className="flex w-full items-center justify-center gap-2 rounded-xl border border-yellow-300/20 bg-[#121c36]/80 p-1 text-xs sm:w-auto sm:justify-start">
            <button
              className={`rounded-lg px-3 py-1.5 font-semibold transition ${
                mode === "step" ? "bg-yellow-400/20 text-yellow-100" : "text-slate-400"
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

        <div className="grid gap-4 lg:min-h-[calc(100vh-130px)] xl:grid-cols-1">
          <div className="pokemon-panel min-h-0 rounded-[24px] p-3 sm:rounded-[28px] sm:p-4">
            <Visualizer
              code={code}
              language={language}
              executionTrace={executionTrace}
              currentStepIndex={currentStep}
              speed={speed}
              isRunning={isRunning}
              onStep={setCurrentStep}
            />
          </div>

          <aside className="flex min-h-0 flex-col gap-4">
            <div className="pokemon-panel rounded-2xl p-4">
              <div className="mb-2 flex items-center justify-between text-xs uppercase tracking-[0.2em] text-yellow-100">
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

            {quota && (
              <div className="pokemon-panel rounded-2xl p-4 text-sm text-yellow-50">
                <div className="flex items-center justify-between">
                  <span className="text-xs uppercase tracking-[0.2em] text-yellow-100">Plan</span>
                  <span className="pokemon-chip rounded-lg px-2 py-1 text-xs uppercase tracking-[0.2em]">
                    {quota.quotaMode === "paid" ? "credit pack" : quota.planType}
                  </span>
                </div>
                {quota.quotaMode === "paid" ? (
                  <>
                    <p className="mt-3 text-yellow-50">
                      Paid credits remaining: {quota.paidCreditsRemaining}
                    </p>
                    <p className="mt-1 text-yellow-100/80">Total purchased credits: {quota.paidCreditsTotal}</p>
                  </>
                ) : (
                  <>
                    <p className="mt-3 text-yellow-50">
                      Free runs this month: {quota.freeUsed} / {quota.freeLimit}
                    </p>
                    <p className="mt-1 text-yellow-100/80">Remaining: {quota.freeRemaining}</p>
                    <p className="mt-1 text-xs text-yellow-100/70">
                      Reset date: {new Date(quota.resetAt).toLocaleDateString()}
                    </p>
                  </>
                )}
              </div>
            )}

            {paywallMessage && (
              <div className="pokemon-panel rounded-2xl p-4 text-sm text-yellow-50">
                <p className="font-semibold">Upgrade required</p>
                <p className="mt-1 leading-6">{paywallMessage}</p>
                <p className="mt-2 rounded-lg border border-emerald-300/30 bg-emerald-500/10 px-3 py-2 font-medium text-emerald-200">
                  Message: Get 50% discount with code FREE24.
                </p>
                <button
                  onClick={handleUpgrade}
                  className="mt-3 rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 px-4 py-2 text-xs font-semibold text-black transition hover:brightness-110"
                >
                  Upgrade to Pro
                </button>
              </div>
            )}

            <div className="pokemon-panel min-h-[320px] overflow-hidden rounded-[20px] p-2 sm:min-h-[380px] sm:rounded-[24px] sm:p-3">
              <CodeEditor
                language={language}
                onLanguageChange={handleLanguageChange}
                onRun={handleRun}
                value={code}
                onChange={setCode}
                isRunning={isRunning}
                title={editorTitle}
              />
            </div>

            <ExecutionControls
              isRunning={isRunning}
              currentStep={currentStep}
              totalSteps={executionTrace?.totalSteps || 0}
              onStep={setCurrentStep}
              executionTrace={executionTrace}
            />

            <SnippetLibrary
              code={code}
              language={language}
              onLoadSnippet={(snippet) => {
                setCode(snippet.code);
                setLanguage(snippet.language);
                setCurrentStep(0);
                setExecutionTrace(null);
              }}
            />
          </aside>
        </div>
      </section>
    </main>
  );
}
