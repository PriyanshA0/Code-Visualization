import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createCheckoutSession } from "@/lib/actions/billing/provider";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const { userId, sessionClaims } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json().catch(() => ({}))) as { returnUrl?: string };
    const returnUrl = body.returnUrl || "/visualizer";

    const emailAddress = (sessionClaims?.email || "") as string;

    let finalReturnUrl = returnUrl;
    if (emailAddress && returnUrl.includes("/billing-success")) {
      try {
        const baseUrl = process.env.APP_BASE_URL || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
        const parsed = returnUrl.startsWith("http://") || returnUrl.startsWith("https://")
          ? new URL(returnUrl)
          : new URL(returnUrl, baseUrl);

        parsed.searchParams.set("email", emailAddress);
        finalReturnUrl = parsed.pathname + parsed.search + parsed.hash;
      } catch {
        // Keep original returnUrl if parsing fails.
      }
    }

    const session = await createCheckoutSession({
      userId,
      returnUrl: finalReturnUrl,
      email: emailAddress,
    });

    if (session.checkoutUrl) {
      return NextResponse.json({ ...session }, { status: 200 });
    }

    return NextResponse.json(
      {
        ...session,
        message:
          session.message ||
          "Polar checkout is not available right now. Configure billing environment variables.",
      },
      { status: 503 }
    );
  } catch (error) {
    console.error("Billing checkout auth/runtime error:", error);
    return NextResponse.json(
      {
        error:
          "Authentication service is unavailable. Verify Clerk keys in deployment environment.",
      },
      { status: 503 }
    );
  }
}