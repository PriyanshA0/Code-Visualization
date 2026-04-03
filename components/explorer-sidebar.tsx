import React from "react";

const categories = [
  "Sorting",
  "Graphs",
  "Trees",
  "Dynamic Programming",
  "Backtracking",
];

export function ExplorerSidebar() {
  return (
    <aside className="flex h-full w-[260px] flex-col border-r border-white/6 bg-[#0b1020] px-4 py-4 text-slate-200">
      <div className="rounded-2xl border border-white/8 bg-white/4 p-4 shadow-[0_12px_40px_rgba(0,0,0,0.25)]">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-indigo-400 to-violet-500 text-sm font-bold text-white shadow-lg shadow-indigo-500/30">
            A
          </div>
          <div>
            <p className="text-[15px] font-semibold text-white">Architect</p>
            <p className="text-xs text-slate-400">Pro Plan</p>
          </div>
        </div>
      </div>

      <div className="mt-6">
        <p className="mb-3 text-[10px] uppercase tracking-[0.35em] text-slate-500">
          Categories
        </p>
        <div className="space-y-2">
          {categories.map((item, index) => (
            <button
              key={item}
              className={`flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm transition ${
                index === 0
                  ? "bg-[#1a1f36] text-white shadow-inner shadow-indigo-500/10"
                  : "text-slate-400 hover:bg-white/5 hover:text-slate-100"
              }`}
            >
              <span className="h-2 w-2 rounded-full bg-indigo-400/90" />
              <span>{item}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="mt-auto space-y-3 pt-6">
        <button className="w-full rounded-2xl bg-gradient-to-r from-indigo-500 to-violet-500 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30 transition hover:brightness-110">
          Upgrade Power
        </button>
        <div className="space-y-2 text-sm text-slate-500">
          <div className="rounded-xl px-3 py-2 hover:bg-white/5">Settings</div>
          <div className="rounded-xl px-3 py-2 hover:bg-white/5">Terminal</div>
        </div>
      </div>
    </aside>
  );
}
