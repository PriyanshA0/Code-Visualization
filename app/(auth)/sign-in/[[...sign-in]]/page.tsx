import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-12">
      <div className="grid w-full max-w-5xl gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="rounded-[2rem] border border-white/8 bg-[linear-gradient(135deg,rgba(17,24,39,0.95),rgba(6,8,18,0.96))] p-8 shadow-[0_24px_100px_rgba(0,0,0,0.45)]">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-indigo-300">Talksy Visualizer</p>
          <h1 className="mt-4 max-w-lg text-4xl font-black tracking-tight text-white sm:text-5xl">
            Sign in to save snippets and keep your execution history organized.
          </h1>
          <p className="mt-4 max-w-xl text-sm leading-6 text-slate-300 sm:text-base">
            Use Clerk for secure access, then store code snapshots in MongoDB so your visualizer behaves like a real product instead of a demo shell.
          </p>
          <div className="mt-8 grid gap-4 text-sm text-slate-300 sm:grid-cols-2">
            <div className="rounded-2xl border border-white/8 bg-white/5 p-4">Protected visualizer access</div>
            <div className="rounded-2xl border border-white/8 bg-white/5 p-4">MongoDB-backed snippet storage</div>
            <div className="rounded-2xl border border-white/8 bg-white/5 p-4">JavaScript and Python execution</div>
            <div className="rounded-2xl border border-white/8 bg-white/5 p-4">Step-by-step runtime tracing</div>
          </div>
        </section>

        <section className="flex items-center justify-center rounded-[2rem] border border-white/8 bg-[#0b1020] p-4 shadow-[0_24px_100px_rgba(0,0,0,0.45)]">
          <SignIn
            routing="path"
            path="/sign-in"
            signUpUrl="/sign-up"
            forceRedirectUrl="/visualizer"
          />
        </section>
      </div>
    </main>
  );
}