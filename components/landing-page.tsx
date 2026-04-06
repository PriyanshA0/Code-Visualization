import React from "react";
import { AuthButtons } from "@/components/auth-buttons";

const features = [
  {
    title: "Real-time Feedback",
    description:
      "Every keystroke updates the visualization pipeline. See variables mutate and pointers shift as you type your logic.",
    accent: "from-indigo-500/30 to-violet-500/10",
  },
  {
    title: "Interactive Animations",
    description:
      "Scrub through execution history with a frame-by-frame timeline. Perfect for debugging complex recursive trees.",
    accent: "from-emerald-500/30 to-cyan-500/10",
  },
  {
    title: "Beginner Friendly",
    description:
      "Built-in presets for classic data structures. Learn everything from simple sorts to advanced graph algorithms.",
    accent: "from-amber-500/30 to-orange-500/10",
  },
  {
    title: "Full Control",
    description:
      "Inject custom inputs and watch your edge cases break the structure. Get the microscope to see why.",
    accent: "from-fuchsia-500/30 to-pink-500/10",
  },
];

const steps = [
  {
    title: "Write Your Logic",
    description:
      "Paste code or use our editor with syntax highlighting for Python, JS, and C++.",
  },
  {
    title: "Parse & Map",
    description:
      "Our engine parses the AST and maps memory allocations to high-fidelity visual components automatically.",
  },
  {
    title: "Visualize Execution",
    description:
      "Press play to step through the execution and watch the data move, expand, and transform in real time.",
  },
];

const algorithmCards = [
  {
    title: "Arrays & Strings",
    description:
      "Foundational building blocks. Learn how data is stored in contiguous memory and optimized for fast access.",
    tag: "O(1) ACCESS",
  },
  {
    title: "Linked Lists",
    description:
      "Dynamic memory structures. Understand how pointers create fluid paths for non-contiguous data storage.",
    tag: "DYNAMIC SIZE",
  },
  {
    title: "Trees & BSTs",
    description:
      "Hierarchical logic models. Master recursive traversal and balanced search algorithms for O(log n) efficiency.",
    tag: "O(LOG N) SEARCH",
  },
  {
    title: "Graph Theory",
    description:
      "Networks and connectivity. Visualize BFS, DFS, and Dijkstra's algorithm in complex, interconnected maps.",
    tag: "CONNECTIVITY",
  },
  {
    title: "Sorting Algorithms",
    description:
      "Ordering chaos. Watch Merge Sort, Quick Sort, and Bubble Sort rearrange data structures in real time.",
    tag: "O(N LOG N)",
  },
  {
    title: "New: AI Pathfinding",
    description:
      "Explore A* and neural networks through the lens of modern visualization tech.",
    tag: "LAUNCH LAB",
  },
];

export function LandingPage() {
  return (
    <main className="min-h-screen bg-[#060812] text-slate-100">
      <header className="sticky top-0 z-30 border-b border-white/6 bg-[#060812]/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-[1440px] items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="text-lg font-extrabold tracking-tight text-indigo-300">
            talksy.code.visualizer
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

      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(99,102,241,0.18),_transparent_32%),radial-gradient(circle_at_70%_20%,_rgba(45,212,191,0.08),_transparent_24%),linear-gradient(180deg,rgba(9,12,24,0)_0%,rgba(6,8,18,1)_100%)]" />
        <div className="mx-auto max-w-[1440px] px-4 pb-16 pt-20 sm:px-6 lg:px-8 lg:pb-24 lg:pt-28">
          <div className="mx-auto max-w-4xl text-center">
            <h1 className="text-balance text-5xl font-black tracking-tight text-white sm:text-6xl lg:text-7xl">
              See your code come to life
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-slate-300 sm:text-lg">
              Visualize algorithms step by step with real-time animations.
              Transform abstract logic into spatial reality.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
              <AuthButtons compact />
            </div>
          </div>

          <div className="mt-12 grid gap-5 lg:grid-cols-[1.05fr_1.4fr]">
            <div className="rounded-2xl border border-white/8 bg-[#1d2234] p-5 shadow-[0_18px_70px_rgba(0,0,0,0.45)]">
              <div className="mb-3 flex items-center gap-2 text-[11px] font-semibold tracking-[0.3em] text-slate-400">
                <span className="h-3 w-3 rounded-full bg-[#9b9b9b]" />
                BINARY_SEARCH.PY
              </div>
              <div className="rounded-xl bg-[#0b1020] p-4 font-mono text-[11px] leading-5 text-slate-300">
                <p><span className="text-sky-300">def</span> <span className="text-amber-300">binary_search</span>(arr, target):</p>
                <p>&nbsp;&nbsp;low = 0</p>
                <p>&nbsp;&nbsp;high = len(arr) - 1</p>
                <p className="bg-white/5 pl-3 text-white">&nbsp;&nbsp;while low &lt;= high:</p>
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

            <div className="rounded-2xl border border-white/8 bg-[#171c2c] p-5 shadow-[0_18px_70px_rgba(0,0,0,0.45)]">
              <div className="flex h-full min-h-[360px] items-center justify-center rounded-xl border border-white/6 bg-[radial-gradient(circle,_rgba(255,255,255,0.02)_0%,_transparent_72%)] p-6">
                <div className="relative flex h-[250px] w-full max-w-[430px] items-center justify-center">
                  <div className="absolute left-1/2 top-0 flex h-14 w-14 -translate-x-1/2 items-center justify-center rounded-full bg-indigo-400 text-lg font-bold text-[#121424] shadow-lg shadow-indigo-500/30">
                    42
                  </div>
                  <div className="absolute left-[26%] top-[42%] h-px w-[26%] origin-right rotate-[34deg] bg-indigo-300/70" />
                  <div className="absolute right-[26%] top-[42%] h-px w-[26%] origin-left -rotate-[34deg] bg-indigo-300/70" />
                  <div className="absolute left-[16%] top-[60%] flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/8 text-sm text-slate-300">
                    21
                  </div>
                  <div className="absolute right-[16%] top-[60%] flex h-11 w-11 items-center justify-center rounded-full border border-indigo-300/80 bg-[#11182b] text-sm text-slate-100">
                    64
                  </div>
                  <div className="absolute bottom-3 right-3 rounded-full border border-emerald-400/30 bg-emerald-500/10 px-3 py-1 text-[10px] font-bold tracking-[0.25em] text-emerald-300">
                    EXECUTION LIVE
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1440px] px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        <div className="mb-6 flex items-end justify-between gap-6">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
              Precision Architecture
            </h2>
            <div className="mt-2 h-1 w-16 rounded-full bg-indigo-500" />
          </div>
        </div>

        <div className="grid gap-5 lg:grid-cols-4">
          {features.map((feature, index) => (
            <article
              key={feature.title}
              className={`rounded-2xl border border-white/8 bg-[#141a2a] p-5 shadow-[0_16px_50px_rgba(0,0,0,0.24)] ${
                index < 2 ? "lg:col-span-2" : ""
              }`}
            >
              <div className={`mb-4 h-10 w-10 rounded-xl bg-gradient-to-br ${feature.accent} border border-white/8`} />
              <h3 className="text-xl font-semibold text-white">{feature.title}</h3>
              <p className="mt-3 max-w-md text-sm leading-6 text-slate-300">
                {feature.description}
              </p>
              {index === 0 && (
                <div className="mt-10 grid grid-cols-3 gap-3 text-center text-[11px] text-emerald-300">
                  <div className="rounded-xl border border-emerald-500/20 bg-black/20 px-3 py-4">arr[0] = 5</div>
                  <div className="rounded-xl border border-white/10 bg-black/20 px-3 py-4 opacity-70">arr[1] = 12</div>
                  <div className="rounded-xl border border-white/10 bg-black/20 px-3 py-4 opacity-50">arr[2] = 8</div>
                </div>
              )}
            </article>
          ))}
        </div>
      </section>

      <section className="border-y border-white/6 bg-[#0a0d17]">
        <div className="mx-auto max-w-[1440px] px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-white sm:text-4xl">
              The Visualization Engine
            </h2>
            <p className="mt-3 text-sm text-slate-400">
              Three steps to algorithmic mastery.
            </p>
          </div>
          <div className="mt-14 grid gap-10 lg:grid-cols-3">
            {steps.map((step, index) => (
              <div key={step.title} className="text-center lg:text-left">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-white/8 bg-[#141a2a] text-xl text-indigo-300 lg:mx-0">
                  {index + 1}
                </div>
                <h3 className="mt-5 text-xl font-semibold text-white">{step.title}</h3>
                <p className="mt-3 text-sm leading-6 text-slate-300">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1440px] px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
        <div className="mx-auto max-w-3xl rounded-[2rem] border border-white/8 bg-[linear-gradient(135deg,rgba(30,41,59,0.95),rgba(17,24,39,0.95))] p-8 text-center shadow-[0_18px_70px_rgba(0,0,0,0.45)]">
          <h2 className="text-3xl font-black text-white sm:text-4xl">
            Ready to master logic?
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-6 text-slate-300 sm:text-base">
            Join developers who use talksy.code.visualizer to debug, learn, and document their architectural patterns.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <AuthButtons compact />
          </div>
        </div>
      </section>

      <footer className="mx-auto flex max-w-[1440px] items-center justify-between border-t border-white/6 px-4 py-6 text-xs uppercase tracking-[0.25em] text-slate-500 sm:px-6 lg:px-8">
        <span>© 2026 talksy.code.visualizer. built for precision.</span>
        <div className="flex gap-6">
          <span>Privacy</span>
          <span>Terms</span>
          <span>Changelog</span>
          <span>API</span>
        </div>
      </footer>
    </main>
  );
}
