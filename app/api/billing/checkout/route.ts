import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createCheckoutSession } from "@/lib/actions/billing/provider";

export async function POST(request: NextRequest) {
  const { userId, sessionClaims } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json().catch(() => ({}))) as { returnUrl?: string };
  const returnUrl = body.returnUrl || "/visualizer";

  // Get user email from sessionClaims
  const emailAddress = (sessionClaims?.email || "") as string;

  const session = await createCheckoutSession({
    userId,
    returnUrl,
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
}