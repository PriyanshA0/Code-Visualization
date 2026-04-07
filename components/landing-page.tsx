import React from "react";
import { AuthButtons } from "@/components/auth-buttons";

const highlights = [
  "JavaScript + Python execution",
  "Step-by-step runtime trace",
  "Flow + Variables + Array visualizer tabs",
  "Snippet library with cloud persistence",
  "2 free monthly runs with upgrade flow",
  "Clerk auth + protected API routes",
];

const algorithmCards = [
  {
    title: "Arrays + Sorting",
    description: "Watch compare/swap motion with step counters and value transitions.",
    tag: "BUBBLE / MERGE / QUICK",
  },
  {
    title: "Recursion + Call Stack",
    description: "Inspect nested calls with frame-by-frame stack evolution.",
    tag: "TRACE FRAMES",
  },
  {
    title: "Graph Traversal",
    description: "Visualize BFS/DFS node visits and frontier movement.",
    tag: "BFS / DFS",
  },
  {
    title: "Branching Logic",
    description: "Follow if/else and loop paths using flow edges and hit counts.",
    tag: "CONTROL FLOW",
  },
];

const capabilityCards = [
  {
    title: "Live Code Execution",
    description:
      "Run JavaScript and Python from the same workspace with trace capture, console output collection, and timeout safety.",
    tag: "JS + PY",
    accent: "from-cyan-400/35 to-indigo-500/15",
  },
  {
    title: "Frame-Accurate Debug View",
    description:
      "Follow execution line by line with active line focus, previous state comparison, and temporal step navigation controls.",
    tag: "TRACE",
    accent: "from-indigo-400/30 to-violet-500/20",
  },
  {
    title: "Visual Panels That Explain State",
    description:
      "Use dedicated views for flow graph, variable timeline, array movement, and execution logs so behavior is readable at a glance.",
    tag: "PANELS",
    accent: "from-emerald-400/35 to-teal-500/20",
  },
  {
    title: "Snippet Workspace",
    description:
      "Save, load, and manage reusable snippets with user ownership and fast retrieval across sessions.",
    tag: "SNIPPETS",
    accent: "from-amber-400/35 to-orange-500/20",
  },
  {
    title: "Quota + Monetization Ready",
    description:
      "Built-in monthly free quota, upgrade prompt on limit breach, and Polar checkout/webhook hooks for production billing.",
    tag: "SAAS",
    accent: "from-pink-400/35 to-rose-500/20",
  },
  {
    title: "Secure By Default",
    description:
      "Authentication gates visualizer + sensitive APIs, and user data is isolated through Mongo-backed subscription and usage records.",
    tag: "SECURE",
    accent: "from-sky-400/30 to-blue-500/20",
  },
];

const workflow = [
  {
    step: "01",
    title: "Write or Paste Code",
    description:
      "Use editor controls to switch language, load snippets, and prepare test inputs quickly.",
  },
  {
    step: "02",
    title: "Execute In Sandbox",
    description:
      "Execution engine instruments runtime to collect line progress, variables, call stack, and output.",
  },
  {
    step: "03",
    title: "Inspect Runtime Behavior",
    description:
      "Navigate frames with timeline controls and debug logic using synchronized visual panels.",
  },
  {
    step: "04",
    title: "Store and Reuse",
    description:
      "Save snippets and continue from past experiments without rebuilding setup each time.",
  },
];

const benchmarkRows = [
  { item: "Execution APIs", detail: "POST /api/execute/javascript and /api/execute/python" },
  { item: "Quota Control", detail: "GET /api/usage/quota with monthly free run tracking" },
  { item: "Billing Integration", detail: "Polar checkout + webhook sync for plan state" },
  { item: "Storage Layer", detail: "Mongo models for snippets, usage, and subscriptions" },
  { item: "Route Security", detail: "Auth-protected visualizer and execution/snippet routes" },
  { item: "UI Tooling", detail: "Code editor, flow map, variable state, and execution logs" },
];

export function LandingPage() {
  return (
    <main className="min-h-screen bg-[#050910] text-slate-100">
      <header className="sticky top-0 z-30 border-b border-white/6 bg-[#060812]/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-[1440px] items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="text-lg font-extrabold tracking-tight text-indigo-300">
            TalkSy.code.visualization
          </div>
          <nav className="hidden items-center gap-8 text-sm font-medium text-slate-300 md:flex">
            <a className="text-white" href="/visualizer">
              Explorer
            </a>
            <a className="transition hover:text-white" href="#docs">
              Docs
            </a>
            <a className="transition hover:text-white" href="#benchmarks">
              Benchmarks
            </a>
          </nav>
          <AuthButtons />
        </div>
      </header>

      <section className="relative overflow-hidden border-b border-white/6">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,_rgba(99,102,241,0.2),_transparent_34%),linear-gradient(180deg,#020616_0%,#040b1d_75%,#050910_100%)]" />
        <div className="relative mx-auto max-w-[1440px] px-4 pb-10 pt-14 sm:px-6 sm:pb-12 sm:pt-20 lg:px-8 lg:pb-16 lg:pt-24">
          <div className="mx-auto max-w-4xl text-center">
            <h1 className="text-balance text-4xl font-black tracking-tight text-white sm:text-6xl lg:text-7xl">
              See your code
              <br className="hidden sm:block" />
              <span className="sm:pl-2">come to life</span>
            </h1>
            <p className="mx-auto mt-5 max-w-3xl text-base leading-7 text-slate-300 sm:text-xl sm:leading-9">
              Visualize algorithms step by step with real-time animations. Transform abstract logic into spatial reality.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <a
                href="/visualizer"
                className="rounded-2xl bg-gradient-to-r from-indigo-500 to-violet-500 px-8 py-3 text-sm font-semibold text-white shadow-[0_10px_30px_rgba(99,102,241,0.4)] transition hover:brightness-110"
              >
                Launch Editor
              </a>
              <a
                href="#docs"
                className="rounded-2xl border border-white/12 bg-white/5 px-8 py-3 text-sm font-semibold text-slate-100 transition hover:bg-white/10"
              >
                View Sandbox
              </a>
            </div>
          </div>

          <div className="mt-10 grid gap-5 lg:grid-cols-2">
            <div className="rounded-2xl border border-white/8 bg-[#111a31]/70 p-5 shadow-[0_18px_70px_rgba(0,0,0,0.42)]">
              <div className="mb-3 flex items-center gap-2 text-[11px] font-semibold tracking-[0.28em] text-slate-500">
                <span className="h-2.5 w-2.5 rounded-full bg-slate-500" />
                BINARY_SEARCH.PY
              </div>
              <div className="rounded-xl border border-white/6 bg-[#050b1b] p-4 font-mono text-[11px] leading-6 text-slate-300">
                <p><span className="text-sky-300">def</span> <span className="text-amber-300">binary_search</span>(arr, target):</p>
                <p>&nbsp;&nbsp;low = 0</p>
                <p>&nbsp;&nbsp;high = len(arr) - 1</p>
                <p className="rounded bg-white/5 pl-3 text-white">&nbsp;&nbsp;while low &lt;= high:</p>
                <p>&nbsp;&nbsp;&nbsp;&nbsp;mid = (low + high) // 2</p>
                <p>&nbsp;&nbsp;&nbsp;&nbsp;<span className="text-pink-300">if</span> arr[mid] == target:</p>
                <p>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;return mid</p>
                <p>&nbsp;&nbsp;&nbsp;&nbsp;<span className="text-pink-300">elif</span> arr[mid] &gt; target:</p>
                <p>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;high = mid - 1</p>
                <p>&nbsp;&nbsp;&nbsp;&nbsp;<span className="text-pink-300">else</span>:</p>
                <p>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;low = mid + 1</p>
                <p>&nbsp;&nbsp;return -1</p>
              </div>
            </div>

            <div className="rounded-2xl border border-white/8 bg-[#10182e]/70 p-5 shadow-[0_18px_70px_rgba(0,0,0,0.42)]">
              <div className="relative flex min-h-[310px] items-center justify-center overflow-hidden rounded-xl border border-white/6 bg-[radial-gradient(circle,_rgba(255,255,255,0.03)_0%,_transparent_75%)] p-6">
                <div className="relative h-[220px] w-full max-w-[420px]">
                  <div className="absolute left-1/2 top-0 flex h-14 w-14 -translate-x-1/2 items-center justify-center rounded-full bg-indigo-400 text-lg font-extrabold text-[#101427] shadow-[0_10px_30px_rgba(99,102,241,0.45)]">
                    42
                  </div>
                  <div className="absolute left-[28%] top-[36%] h-px w-[24%] origin-right rotate-[34deg] bg-indigo-300/70" />
                  <div className="absolute right-[28%] top-[36%] h-px w-[24%] origin-left -rotate-[34deg] bg-indigo-300/70" />
                  <div className="absolute left-[16%] top-[56%] flex h-11 w-11 items-center justify-center rounded-full border border-white/12 bg-white/10 text-sm text-slate-200">
                    21
                  </div>
                  <div className="absolute right-[16%] top-[56%] flex h-11 w-11 items-center justify-center rounded-full border border-indigo-300/70 bg-[#0b1224] text-sm text-slate-100">
                    64
                  </div>
                </div>
                <div className="absolute bottom-3 right-3 rounded-full border border-emerald-300/30 bg-emerald-500/10 px-3 py-1 text-[10px] font-bold tracking-[0.2em] text-emerald-200">
                  EXECUTION LIVE
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_16%_10%,_rgba(14,165,233,0.22),_transparent_30%),radial-gradient(circle_at_84%_8%,_rgba(16,185,129,0.18),_transparent_24%),linear-gradient(180deg,rgba(5,9,16,0.1)_0%,rgba(5,9,16,1)_92%)]" />
        <div className="mx-auto grid max-w-[1440px] gap-6 px-4 pb-12 pt-16 sm:px-6 sm:pt-20 lg:grid-cols-[1.1fr_0.9fr] lg:gap-8 lg:px-8 lg:pb-24 lg:pt-28">
          <div className="relative z-10">
            <p className="inline-flex items-center rounded-full border border-cyan-300/30 bg-cyan-400/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-cyan-200 sm:text-[11px] sm:tracking-[0.24em]">
              Runtime Intelligence Platform
            </p>
            <h1 className="mt-4 max-w-3xl text-balance text-4xl font-black tracking-tight text-white sm:mt-5 sm:text-5xl lg:text-7xl">
              Understand code behavior, not just code syntax
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-300 sm:mt-5 sm:text-base sm:leading-7 lg:text-lg">
              TalkSy.code.visualization converts execution into a guided visual narrative: run code, inspect each line, compare variable changes, and map control flow instantly.
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-3 sm:mt-8 sm:gap-4">
              <AuthButtons compact />
              <a
                href="/visualizer"
                className="rounded-xl border border-white/12 bg-white/5 px-4 py-2 text-sm font-semibold text-slate-100 transition hover:bg-white/10"
              >
                Open Explorer
              </a>
            </div>

            <div className="mt-6 grid gap-2 sm:mt-8 sm:grid-cols-2">
              {highlights.map((point) => (
                <div key={point} className="rounded-xl border border-white/10 bg-[#0b1324]/85 px-3 py-2 text-xs text-slate-200 sm:text-sm">
                  {point}
                </div>
              ))}
            </div>
          </div>

          <div className="relative z-10">
            <div className="rounded-2xl border border-white/10 bg-[#0b1324]/90 p-5 shadow-[0_18px_70px_rgba(0,0,0,0.4)]">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-[11px] font-semibold uppercase tracking-[0.25em] text-slate-400">Execution Snapshot</span>
                <span className="rounded-full border border-emerald-300/30 bg-emerald-400/10 px-2 py-0.5 text-[10px] font-semibold tracking-[0.18em] text-emerald-200">LIVE TRACE</span>
              </div>
              <div className="space-y-3 rounded-xl border border-white/10 bg-[#060c1a] p-4 font-mono text-xs text-slate-300">
                <div className="rounded-lg bg-cyan-500/10 px-3 py-2 text-cyan-100">line 12: if (arr[j] &gt; arr[j + 1])</div>
                <div className="grid grid-cols-3 gap-2">
                  <div className="rounded-lg border border-white/10 bg-white/5 px-2 py-2">i: 0</div>
                  <div className="rounded-lg border border-white/10 bg-white/5 px-2 py-2">j: 4</div>
                  <div className="rounded-lg border border-emerald-400/30 bg-emerald-500/10 px-2 py-2 text-emerald-200">swap: true</div>
                </div>
                <div className="rounded-lg border border-indigo-400/30 bg-indigo-500/10 px-3 py-2 text-indigo-200">flow: loop -&gt; compare -&gt; mutate</div>
              </div>
              <div className="mt-4 grid grid-cols-3 gap-2 text-center text-[11px] text-slate-300">
                <div className="rounded-lg border border-white/10 bg-black/20 px-2 py-2">Frame 47</div>
                <div className="rounded-lg border border-white/10 bg-black/20 px-2 py-2">2.1x Speed</div>
                <div className="rounded-lg border border-white/10 bg-black/20 px-2 py-2">JS Runtime</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1440px] px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-black tracking-tight text-white sm:text-3xl">See exactly what users will visualize</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
              Live-style preview blocks for both control flow and graph traversal.
            </p>
          </div>
        </div>

        <div className="grid gap-5 lg:grid-cols-2">
          <article className="rounded-2xl border border-white/10 bg-[#0b1324] p-5 shadow-[0_16px_50px_rgba(0,0,0,0.22)]">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-xs font-bold uppercase tracking-[0.24em] text-slate-400">Flow Example</p>
              <span className="rounded-full border border-cyan-300/30 bg-cyan-500/10 px-2 py-0.5 text-[10px] font-semibold text-cyan-200">STEP 7 / 18</span>
            </div>
            <div className="overflow-x-auto pb-2">
              <div className="relative min-w-[640px] rounded-xl border border-white/8 bg-[#060d1d] p-5">
                <div className="absolute inset-0 opacity-20" style={{
                  backgroundImage: "radial-gradient(circle, rgba(148,163,184,0.25) 1px, transparent 1px)",
                  backgroundSize: "20px 20px",
                }} />
                <div className="relative flex items-center gap-4">
                  <div className="rounded-xl border border-white/12 bg-white/5 px-4 py-3 text-sm text-slate-300">for i loop</div>
                  <span className="text-cyan-300">-&gt;</span>
                  <div className="rounded-2xl border-2 border-amber-300/70 bg-amber-500/10 px-5 py-4 text-sm font-semibold text-amber-100 shadow-[0_0_30px_rgba(245,158,11,0.25)]">
                    if (arr[j] &gt; arr[j + 1])
                  </div>
                  <span className="text-cyan-300">-&gt;</span>
                  <div className="rounded-xl border border-white/12 bg-white/5 px-4 py-3 text-sm text-slate-300">swap values</div>
                </div>
              </div>
            </div>
          </article>

          <article className="rounded-2xl border border-white/10 bg-[#0b1324] p-5 shadow-[0_16px_50px_rgba(0,0,0,0.22)]">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-xs font-bold uppercase tracking-[0.24em] text-slate-400">Graph Example</p>
              <span className="rounded-full border border-emerald-300/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-200">BFS FRONTIER</span>
            </div>
            <div className="relative h-[220px] rounded-xl border border-white/8 bg-[#060d1d] p-4">
              <div className="absolute inset-0 opacity-20" style={{
                backgroundImage: "radial-gradient(circle, rgba(148,163,184,0.25) 1px, transparent 1px)",
                backgroundSize: "20px 20px",
              }} />
              <svg className="absolute inset-0 h-full w-full">
                <line x1="80" y1="70" x2="170" y2="45" stroke="rgba(125,211,252,0.6)" />
                <line x1="80" y1="70" x2="165" y2="135" stroke="rgba(125,211,252,0.6)" />
                <line x1="170" y1="45" x2="260" y2="95" stroke="rgba(125,211,252,0.6)" />
                <line x1="165" y1="135" x2="260" y2="95" stroke="rgba(125,211,252,0.6)" />
              </svg>
              <div className="absolute left-[52px] top-[55px] flex h-14 w-14 items-center justify-center rounded-full border border-emerald-300/60 bg-emerald-500/20 text-sm font-bold text-emerald-100">A</div>
              <div className="absolute left-[145px] top-[28px] flex h-12 w-12 items-center justify-center rounded-full border border-white/20 bg-white/10 text-xs font-semibold text-slate-200">B</div>
              <div className="absolute left-[140px] top-[118px] flex h-12 w-12 items-center justify-center rounded-full border border-cyan-300/60 bg-cyan-500/20 text-xs font-semibold text-cyan-100">C</div>
              <div className="absolute left-[240px] top-[78px] flex h-14 w-14 items-center justify-center rounded-full border border-white/20 bg-white/10 text-sm font-bold text-slate-200">D</div>
            </div>
          </article>
        </div>
      </section>

      <section id="docs" className="mx-auto max-w-[1440px] px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <h2 className="text-3xl font-black tracking-tight text-white sm:text-4xl">Everything the product already does</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
              This landing page maps directly to shipped capabilities in the current stack, not aspirational placeholders.
            </p>
          </div>
        </div>

        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {capabilityCards.map((card) => (
            <article key={card.title} className="rounded-2xl border border-white/10 bg-[#0b1324] p-5 shadow-[0_16px_50px_rgba(0,0,0,0.22)]">
              <div className="mb-4 flex items-center justify-between">
                <div className={`h-10 w-10 rounded-xl border border-white/10 bg-gradient-to-br ${card.accent}`} />
                <span className="rounded-full border border-white/12 bg-white/5 px-2 py-0.5 text-[10px] font-semibold tracking-[0.2em] text-slate-300">{card.tag}</span>
              </div>
              <h3 className="text-xl font-semibold text-white">{card.title}</h3>
              <p className="mt-3 text-sm leading-6 text-slate-300">{card.description}</p>
            </article>
          ))}
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {algorithmCards.map((item) => (
            <article key={item.title} className="rounded-2xl border border-white/10 bg-[#11192b] p-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-indigo-300">{item.tag}</p>
              <h3 className="mt-2 text-base font-semibold text-white">{item.title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-300">{item.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="border-y border-white/6 bg-[#08101f]">
        <div className="mx-auto max-w-[1440px] px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
          <div className="mb-10 text-center">
            <h2 className="text-3xl font-black text-white sm:text-4xl">How execution becomes understanding</h2>
            <p className="mt-3 text-sm text-slate-400">A practical runtime workflow designed for debugging, teaching, and onboarding.</p>
          </div>
          <div className="grid gap-4 lg:grid-cols-4">
            {workflow.map((item) => (
              <article key={item.step} className="rounded-2xl border border-white/10 bg-[#11192b] p-5">
                <p className="text-xs font-bold uppercase tracking-[0.3em] text-cyan-300">{item.step}</p>
                <h3 className="mt-3 text-lg font-semibold text-white">{item.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-300">{item.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="benchmarks" className="mx-auto max-w-[1440px] px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
        <div className="grid gap-8 lg:grid-cols-[1fr_1.2fr]">
          <div className="rounded-2xl border border-white/10 bg-[#0b1324] p-6">
            <h2 className="text-3xl font-black text-white">Production-oriented foundations</h2>
            <p className="mt-4 text-sm leading-7 text-slate-300">
              Beyond visualization, the platform includes the operational building blocks required for SaaS rollout: auth boundaries, quota logic, payment hooks, and persistent data models.
            </p>
            <div className="mt-6 grid grid-cols-2 gap-3 text-xs">
              <div className="rounded-xl border border-white/10 bg-black/20 px-3 py-3 text-slate-200">Protected routes</div>
              <div className="rounded-xl border border-white/10 bg-black/20 px-3 py-3 text-slate-200">Usage tracking</div>
              <div className="rounded-xl border border-white/10 bg-black/20 px-3 py-3 text-slate-200">Billing webhook</div>
              <div className="rounded-xl border border-white/10 bg-black/20 px-3 py-3 text-slate-200">Mongo persistence</div>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-[#0f182b] p-6">
            <p className="mb-4 text-xs font-bold uppercase tracking-[0.24em] text-slate-400">Shipped capabilities matrix</p>
            <div className="space-y-2">
              {benchmarkRows.map((row) => (
                <div key={row.item} className="flex flex-col gap-1 rounded-xl border border-white/10 bg-black/20 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                  <span className="text-sm font-semibold text-white">{row.item}</span>
                  <span className="text-xs text-slate-300">{row.detail}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1440px] px-4 pb-16 sm:px-6 lg:px-8 lg:pb-24">
        <div className="rounded-[2rem] border border-cyan-300/15 bg-[linear-gradient(125deg,rgba(3,15,30,0.96),rgba(16,30,45,0.9))] p-8 text-center shadow-[0_20px_90px_rgba(0,0,0,0.45)] sm:p-10">
          <h2 className="text-3xl font-black text-white sm:text-4xl">Ready to turn execution into insight?</h2>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-6 text-slate-300 sm:text-base">
            Start with free attempts, inspect your code path by path, and scale to paid usage only when your team needs more runtime capacity.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <AuthButtons compact />
            <a
              href="/visualizer"
              className="rounded-xl border border-white/12 bg-white/5 px-4 py-2 text-sm font-semibold text-slate-100 transition hover:bg-white/10"
            >
              Try Visualizer
            </a>
          </div>
        </div>
      </section>

      <footer className="mx-auto flex max-w-[1440px] flex-col items-start justify-between gap-4 border-t border-white/6 px-4 py-6 text-xs uppercase tracking-[0.25em] text-slate-500 sm:flex-row sm:items-center sm:px-6 lg:px-8">
        <span>© 2026 TalkSy.code.visualization. built for precision.</span>
        <div className="flex flex-wrap gap-4 sm:gap-6">
          <span>Privacy</span>
          <span>Terms</span>
          <span>Changelog</span>
          <span>API</span>
        </div>
      </footer>
    </main>
  );
}
