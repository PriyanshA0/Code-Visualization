import Link from "next/link";

export default function BillingSuccessPage() {
  return (
    <main className="min-h-screen bg-[#060812] px-4 py-8 text-slate-100 lg:px-6">
      <section className="mx-auto w-full max-w-2xl rounded-3xl border border-emerald-400/20 bg-[#10172a] p-8 shadow-[0_24px_80px_rgba(0,0,0,0.45)]">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-emerald-300">Payment Complete</p>
        <h1 className="mt-3 text-3xl font-bold text-emerald-100">Your credit pack was added successfully</h1>
        <p className="mt-4 text-sm leading-7 text-slate-300">
          Thank you for your purchase. Your account has been upgraded with 10 execution credits.
          You can now continue visualizing code in JavaScript or Python.
        </p>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/visualizer"
            className="rounded-xl bg-gradient-to-r from-emerald-400 to-cyan-400 px-5 py-2.5 text-sm font-semibold text-slate-900 transition hover:brightness-110"
          >
            Go to Visualizer
          </Link>
          <Link
            href="/"
            className="rounded-xl border border-white/15 bg-white/5 px-5 py-2.5 text-sm font-semibold text-slate-200 transition hover:bg-white/10"
          >
            Back to Home
          </Link>
        </div>
      </section>
    </main>
  );
}
