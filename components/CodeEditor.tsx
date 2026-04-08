"use client";

import React from "react";
import dynamic from "next/dynamic";

const Editor = dynamic(() => import("@monaco-editor/react"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center text-sm text-slate-400">
      Loading editor...
    </div>
  ),
});

interface CodeEditorProps {
  language: "javascript" | "python";
  onLanguageChange: (language: "javascript" | "python") => void;
  onRun: (code: string) => void;
  value: string;
  onChange: (code: string) => void;
  isRunning: boolean;
  title: string;
}

export default function CodeEditor({
  language,
  onLanguageChange,
  onRun,
  value,
  onChange,
  isRunning,
  title,
}: CodeEditorProps) {
  const handleRun = () => {
    onRun(value);
  };

  return (
    <div className="pokemon-panel flex h-full min-h-0 w-full flex-col overflow-hidden rounded-[20px]">
      <div className="pokemon-header flex items-center justify-between border-b border-yellow-300/15 px-4 py-3">
        <div className="flex items-center gap-2 text-xs font-semibold tracking-[0.24em] text-yellow-100 sm:tracking-[0.35em]">
          <span className="screen-electric-pulse h-2.5 w-2.5 rounded-full bg-yellow-300 shadow-[0_0_12px_rgba(250,204,21,0.7)]" />
          {title}
        </div>

        <div className="flex items-center gap-2 text-slate-300">
          <button
            onClick={() => onLanguageChange("javascript")}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
              language === "javascript" ? "bg-yellow-400/20 text-yellow-100" : "bg-white/0 text-slate-400 hover:bg-white/5"
            }`}
          >
            JS
          </button>
          <button
            onClick={() => onLanguageChange("python")}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
              language === "python" ? "bg-sky-400/20 text-sky-100" : "bg-white/0 text-slate-400 hover:bg-white/5"
            }`}
          >
            PY
          </button>
          <button
            onClick={handleRun}
            disabled={isRunning}
            className="ml-2 rounded-lg bg-gradient-to-r from-emerald-400 to-cyan-400 px-4 py-1.5 text-xs font-semibold text-[#04121f] shadow-lg shadow-emerald-500/25 transition hover:brightness-110 disabled:opacity-50"
          >
            {isRunning ? "Running..." : "Run"}
          </button>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-hidden">
        <Editor
          height="100%"
          language={language === "javascript" ? "javascript" : "python"}
          value={value}
          onChange={(nextCode) => onChange(nextCode || "")}
          theme="vs-dark"
          options={{
            minimap: { enabled: false },
            fontSize: 14,
            lineNumbers: "on",
            scrollBeyondLastLine: false,
            automaticLayout: true,
            padding: { top: 18, bottom: 18 },
            renderLineHighlight: "all",
            fontLigatures: true,
            bracketPairColorization: { enabled: true },
          }}
        />
      </div>
    </div>
  );
}
