import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { executeJava } from "@/lib/codeExecution/javaExecutor";
import { CodeExecutionRequest } from "@/lib/codeExecution/types";
import { checkAndConsumeExecutionQuota, checkExecutionQuota } from "@/lib/actions/codeExecution/quota";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body: CodeExecutionRequest = await request.json();
    const { code, timeout = 5000 } = body;

    if (!code || typeof code !== "string") {
      return NextResponse.json({ error: "Invalid code provided" }, { status: 400 });
    }

    const quota =
      process.env.NODE_ENV === "production"
        ? await checkAndConsumeExecutionQuota(userId)
        : await checkExecutionQuota(userId);

    if (process.env.NODE_ENV === "production" && !quota.allowed) {
      const quotaErrorMessage =
        quota.quotaMode === "paid"
          ? "No credits remaining. Purchase 10 more credits to continue execution."
          : "Free monthly attempts are finished. Purchase 10 credits to continue execution.";

      return NextResponse.json(
        {
          error: quotaErrorMessage,
          requiresPayment: true,
          checkoutPath: "/api/billing/checkout",
          quota,
        },
        { status: 402 }
      );
    }

    const result = await executeJava(code, timeout);

    return NextResponse.json({ ...result, quota });
  } catch (error) {
    console.error("Java execution error:", error);
    return NextResponse.json(
      { error: "Failed to execute code" },
      { status: 500 }
    );
  }
}