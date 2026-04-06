import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { executePython } from "@/lib/codeExecution/pythonExecutor";
import { CodeExecutionRequest } from "@/lib/codeExecution/types";
import { checkAndConsumeExecutionQuota } from "@/lib/actions/codeExecution/quota";

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
      return NextResponse.json(
        { error: "Invalid code provided" },
        { status: 400 }
      );
    }

    const quota = await checkAndConsumeExecutionQuota(userId);
    if (!quota.allowed) {
      return NextResponse.json(
        {
          error: "Free monthly attempt limit reached. Upgrade required.",
          requiresPayment: true,
          checkoutPath: "/api/billing/checkout",
          quota,
        },
        { status: 402 }
      );
    }

    const result = await executePython(code, timeout);

    return NextResponse.json({ ...result, quota });
  } catch (error) {
    console.error("Python execution error:", error);
    return NextResponse.json(
      { error: "Failed to execute code" },
      { status: 500 }
    );
  }
}
