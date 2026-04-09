"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { CheckCircle2, Download } from "lucide-react";

interface UserData {
  isPro: boolean;
  email: string;
}

export default function BillingSuccessPage() {
  const { user } = useUser();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchUserData() {
      try {
        if (!user?.primaryEmailAddress?.emailAddress) {
          setError("No email found");
          setLoading(false);
          return;
        }

        const email = user.primaryEmailAddress.emailAddress;

        // Fetch user data from API to check isPro status
        const response = await fetch(`/api/user/status?email=${encodeURIComponent(email)}`);

        if (!response.ok) {
          throw new Error("Failed to fetch user status");
        }

        const data = await response.json();
        setUserData({
          isPro: data.isPro,
          email: data.email,
        });
      } catch (err) {
        console.error("Error fetching user data:", err);
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    }

    fetchUserData();
  }, [user]);

  const now = new Date();
  const billDate = now.toLocaleDateString("en-GB");
  const billTime = now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
  const transactionId = `TXN${Date.now().toString().slice(-8)}`;

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 px-4 py-12 lg:px-6">
      <div className="mx-auto w-full max-w-md">
        {loading ? (
          <div className="rounded-2xl bg-white p-8 shadow-lg text-center">
            <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 mb-4">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-300 border-t-emerald-500"></div>
            </div>
            <h1 className="text-2xl font-bold text-slate-900">Processing</h1>
            <p className="mt-2 text-slate-600">Verifying your payment...</p>
          </div>
        ) : error ? (
          <div className="rounded-2xl bg-white p-8 shadow-lg text-center">
            <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-red-50 mb-4">
              <span className="text-2xl">⚠️</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900">Error</h1>
            <p className="mt-2 text-sm text-slate-600">{error}</p>
            <p className="mt-1 text-sm text-slate-500">Please contact support if this persists.</p>
          </div>
        ) : userData?.isPro ? (
          <div className="rounded-2xl bg-white p-8 shadow-lg">
            {/* Success Header */}
            <div className="mb-8 text-center">
              <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 mb-4">
                <CheckCircle2 className="h-8 w-8 text-emerald-500" />
              </div>
              <h1 className="text-2xl font-bold text-slate-900">Upgrade successfully</h1>
              <p className="mt-2 text-sm text-slate-600">Thank you! Your Pro plan is ready.</p>
            </div>

            {/* Divider */}
            <div className="mb-6 border-t border-slate-200"></div>

            {/* Receipt Details */}
            <div className="space-y-4 mb-6">
              {/* Transaction ID */}
              <div className="flex justify-between">
                <span className="text-sm text-slate-600">Transaction ID:</span>
                <span className="text-sm font-semibold text-slate-900">{transactionId}</span>
              </div>

              {/* Date and Time */}
              <div className="flex justify-between">
                <span className="text-sm text-slate-600">Date and Time:</span>
                <span className="text-sm font-semibold text-slate-900">
                  {billDate} {billTime}
                </span>
              </div>

              {/* Plan */}
              <div className="flex justify-between">
                <span className="text-sm text-slate-600">Plan:</span>
                <span className="text-sm font-semibold text-slate-900">Pro Plan</span>
              </div>

              {/* Customer Email */}
              <div className="flex justify-between">
                <span className="text-sm text-slate-600">Customer Email:</span>
                <span className="text-sm font-semibold text-slate-900">{userData.email}</span>
              </div>

              {/* Customer Name */}
              <div className="flex justify-between">
                <span className="text-sm text-slate-600">Customer Name:</span>
                <span className="text-sm font-semibold text-slate-900">
                  {user?.firstName} {user?.lastName}
                </span>
              </div>

              {/* Payment Amount */}
              <div className="flex justify-between pt-2 border-t border-slate-200">
                <span className="text-sm font-semibold text-slate-900">Payment Amount:</span>
                <span className="text-sm font-bold text-emerald-600">Free Trial</span>
              </div>
            </div>

            {/* Divider */}
            <div className="mb-6 border-t border-slate-200"></div>

            {/* Company Info */}
            <div className="mb-6 rounded-lg bg-slate-50 p-4">
              <p className="text-xs text-slate-600 mb-1">
                <strong>Talksy Code Visualizer</strong>
              </p>
              <p className="text-xs text-slate-500">
                Premium code execution and visualization platform
              </p>
            </div>

            {/* Actions */}
            <div className="space-y-3">
              <Link
                href="/visualizer"
                className="flex items-center justify-center gap-2 w-full rounded-lg bg-emerald-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-600"
              >
                Start Visualizing
              </Link>
              <button
                onClick={() => window.print()}
                className="flex items-center justify-center gap-2 w-full rounded-lg border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                <Download className="h-4 w-4" />
                Download Receipt
              </button>
            </div>
          </div>
        ) : (
          <div className="rounded-2xl bg-white p-8 shadow-lg">
            {/* Success Header */}
            <div className="mb-8 text-center">
              <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 mb-4">
                <CheckCircle2 className="h-8 w-8 text-emerald-500" />
              </div>
              <h1 className="text-2xl font-bold text-slate-900">Payment successful</h1>
              <p className="mt-2 text-sm text-slate-600">Thank you! Your wallet is ready.</p>
            </div>

            {/* Divider */}
            <div className="mb-6 border-t border-slate-200"></div>

            {/* Receipt Details */}
            <div className="space-y-4 mb-6">
              {/* Transaction ID */}
              <div className="flex justify-between">
                <span className="text-sm text-slate-600">Transaction ID:</span>
                <span className="text-sm font-semibold text-slate-900">{transactionId}</span>
              </div>

              {/* Date and Time */}
              <div className="flex justify-between">
                <span className="text-sm text-slate-600">Date and Time:</span>
                <span className="text-sm font-semibold text-slate-900">
                  {billDate} {billTime}
                </span>
              </div>

              {/* Customer Email */}
              <div className="flex justify-between">
                <span className="text-sm text-slate-600">Customer Email:</span>
                <span className="text-sm font-semibold text-slate-900">{userData.email}</span>
              </div>

              {/* Customer Name */}
              <div className="flex justify-between">
                <span className="text-sm text-slate-600">Customer Name:</span>
                <span className="text-sm font-semibold text-slate-900">
                  {user?.firstName} {user?.lastName}
                </span>
              </div>

              {/* Status */}
              <div className="flex justify-between pt-2 border-t border-slate-200">
                <span className="text-sm font-semibold text-slate-900">Status:</span>
                <span className="inline-flex items-center gap-1 text-sm font-semibold text-emerald-600">
                  <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
                  Completed
                </span>
              </div>
            </div>

            {/* Divider */}
            <div className="mb-6 border-t border-slate-200"></div>

            {/* Company Info */}
            <div className="mb-6 rounded-lg bg-slate-50 p-4">
              <p className="text-xs text-slate-600 mb-1">
                <strong>Talksy Code Visualizer</strong>
              </p>
              <p className="text-xs text-slate-500">
                Professional code execution and visualization platform
              </p>
            </div>

            {/* Actions */}
            <div className="space-y-3">
              <Link
                href="/visualizer"
                className="flex items-center justify-center gap-2 w-full rounded-lg bg-emerald-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-600"
              >
                Continue Visualizing
              </Link>
              <button
                onClick={() => window.print()}
                className="flex items-center justify-center gap-2 w-full rounded-lg border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                <Download className="h-4 w-4" />
                Download Receipt
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
