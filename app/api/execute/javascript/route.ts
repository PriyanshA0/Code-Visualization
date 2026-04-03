import { NextRequest, NextResponse } from "next/server";
import { executeJavaScript } from "@/lib/codeExecution/jsExecutor";
import { CodeExecutionRequest } from "@/lib/codeExecution/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body: CodeExecutionRequest = await request.json();
    const { code, timeout = 5000 } = body;

    if (!code || typeof code !== "string") {
      return NextResponse.json(
        { error: "Invalid code provided" },
        { status: 400 }
      );
    }

    const result = await executeJavaScript(code, timeout);

    return NextResponse.json(result);
  } catch (error) {
    console.error("JavaScript execution error:", error);
    return NextResponse.json(
      { error: "Failed to execute code" },
      { status: 500 }
    );
  }
}
