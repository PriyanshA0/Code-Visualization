"use client";

import React, { useEffect, useRef, useState } from "react";
import Editor from "@monaco-editor/react";

interface CodeEditorProps {
  language: "javascript" | "python";
  onLanguageChange: (language: "javascript" | "python") => void;
  onRun: (code: string) => void;
  isRunning: boolean;
  initialCode?: string;
}

export default function CodeEditor({
  language,
  onLanguageChange,
  onRun,
  isRunning,
  initialCode,
}: CodeEditorProps) {
  const [code, setCode] = useState<string>(
    initialCode ||
      (language === "javascript"
        ? "// Write your JavaScript code here\nconsole.log('Hello, World!');"
        : "# Write your Python code here\nprint('Hello, World!')")
  );

  const editorRef = useRef<any>(null);

  useEffect(() => {
    if (initialCode) {
      setCode(initialCode);
    }
  }, [initialCode]);

  const handleRun = () => {
    onRun(code);
  };

  return (
    <div className="flex h-full min-h-0 w-full flex-col overflow-hidden rounded-[20px] border border-white/6 bg-[#0b1020]">
      <div className="flex items-center justify-between border-b border-white/6 bg-[#141a2a] px-4 py-3">
        <div className="flex items-center gap-2 text-xs font-semibold tracking-[0.35em] text-slate-400">
          <span className="h-2.5 w-2.5 rounded-full bg-orange-400" />
          BUBBLE_SORT.JS
        </div>

        <div className="flex items-center gap-2 text-slate-300">
          <button
            onClick={() => onLanguageChange("javascript")}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
              language === "javascript" ? "bg-white/8 text-white" : "bg-white/0 text-slate-400 hover:bg-white/5"
            }`}
          >
            JS
          </button>
          <button
            onClick={() => onLanguageChange("python")}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
              language === "python" ? "bg-white/8 text-white" : "bg-white/0 text-slate-400 hover:bg-white/5"
            }`}
          >
            PY
          </button>
          <button
            onClick={handleRun}
            disabled={isRunning}
            className="ml-2 rounded-lg bg-emerald-500 px-4 py-1.5 text-xs font-semibold text-white shadow-lg shadow-emerald-500/25 transition hover:brightness-110 disabled:opacity-50"
          >
            {isRunning ? "Running..." : "Run"}
          </button>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-hidden">
        <Editor
          height="100%"
          language={language === "javascript" ? "javascript" : "python"}
          value={code}
          onChange={(value) => setCode(value || "")}
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
          onMount={(editor) => {
            editorRef.current = editor;
          }}
        />
      </div>
    </div>
  );
}
