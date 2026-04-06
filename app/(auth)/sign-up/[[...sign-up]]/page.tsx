import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-12">
      <div className="grid w-full max-w-5xl gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="rounded-[2rem] border border-white/8 bg-[linear-gradient(135deg,rgba(17,24,39,0.95),rgba(6,8,18,0.96))] p-8 shadow-[0_24px_100px_rgba(0,0,0,0.45)]">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-indigo-300">Create account</p>
          <h1 className="mt-4 max-w-lg text-4xl font-black tracking-tight text-white sm:text-5xl">
            Start visualizing code with a persistent workspace.
          </h1>
          <p className="mt-4 max-w-xl text-sm leading-6 text-slate-300 sm:text-base">
            Your account is the anchor for snippets, permissions, and future collaboration features. The app is wired to use your MongoDB database instead of local memory.
          </p>
          <div className="mt-8 grid gap-4 text-sm text-slate-300 sm:grid-cols-2">
            <div className="rounded-2xl border border-white/8 bg-white/5 p-4">Clerk authentication</div>
            <div className="rounded-2xl border border-white/8 bg-white/5 p-4">Authenticated API routes</div>
            <div className="rounded-2xl border border-white/8 bg-white/5 p-4">MongoDB persistence</div>
            <div className="rounded-2xl border border-white/8 bg-white/5 p-4">Reusable visualizer workspace</div>
          </div>
        </section>

        <section className="flex items-center justify-center rounded-[2rem] border border-white/8 bg-[#0b1020] p-4 shadow-[0_24px_100px_rgba(0,0,0,0.45)]">
          <SignUp
            routing="path"
            path="/sign-up"
            signInUrl="/sign-in"
            forceRedirectUrl="/visualizer"
          />
        </section>
      </div>
    </main>
  );
}