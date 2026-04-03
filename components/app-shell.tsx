"use client";

import React, { ReactNode } from "react";

interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="min-h-screen bg-[#060812] text-slate-100">
      {children}
    </div>
  );
}
