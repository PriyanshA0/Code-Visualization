"use client";

import Link from "next/link";
import { ClerkLoaded, ClerkLoading, UserButton, useAuth } from "@clerk/nextjs";

interface AuthButtonsProps {
  compact?: boolean;
}

export function AuthButtons({ compact = false }: AuthButtonsProps) {
  const { isLoaded, userId } = useAuth();

  return (
    <div className={`flex items-center gap-3 text-sm ${compact ? "flex-wrap justify-center" : ""}`}>
      <ClerkLoading>
        <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 font-semibold text-slate-400">
          Loading...
        </div>
      </ClerkLoading>

      <ClerkLoaded>
        {!isLoaded || !userId ? (
          <>
            <Link
              className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 font-semibold text-slate-100 transition hover:bg-white/10"
              href="/sign-in"
            >
              Sign In
            </Link>
            <Link
              className="rounded-xl bg-gradient-to-r from-indigo-500 to-violet-500 px-4 py-2 font-semibold text-white shadow-lg shadow-indigo-500/30 transition hover:brightness-110"
              href="/sign-up"
            >
              Get Started
            </Link>
          </>
        ) : (
          <>
            <Link
              className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 font-semibold text-slate-100 transition hover:bg-white/10"
              href="/visualizer"
            >
              Open Visualizer
            </Link>
            <UserButton afterSignOutUrl="/" />
          </>
        )}
      </ClerkLoaded>
    </div>
  );
}