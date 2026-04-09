import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { checkExecutionQuota } from "@/lib/actions/codeExecution/quota";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const quota = await checkExecutionQuota(userId);
    return NextResponse.json({ quota });
  } catch (error) {
    console.error("Quota API auth/runtime error:", error);
    return NextResponse.json(
      {
        error:
          "Authentication service is unavailable. Verify Clerk keys in deployment environment.",
      },
      { status: 503 }
    );
  }
}
