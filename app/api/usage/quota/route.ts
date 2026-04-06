import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { checkExecutionQuota } from "@/lib/actions/codeExecution/quota";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const quota = await checkExecutionQuota(userId);
  return NextResponse.json({ quota });
}
