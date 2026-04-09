import { NextRequest, NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { createCheckoutSession } from "@/lib/actions/billing/provider";
import { connectToDB } from "@/lib/mongodb";
import User from "@/lib/models/User";
import UserSubscription from "@/lib/models/UserSubscription";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const { userId, sessionClaims } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const clerkUser = await currentUser();
    const emailAddress =
      (sessionClaims?.email || clerkUser?.emailAddresses?.[0]?.emailAddress || "") as string;

    const connection = await connectToDB();
    if (connection) {
      if (emailAddress) {
        await User.updateOne(
          { email: emailAddress.toLowerCase() },
          {
            $set: {
              email: emailAddress.toLowerCase(),
              clerkId: userId,
              isPro: false,
            },
          },
          { upsert: true }
        );
      }

      await UserSubscription.updateOne(
        { userId },
        {
          $setOnInsert: {
            userId,
            planType: "free",
            monthlyFreeLimit: 2,
            monthlyFreeUsed: 0,
            paidCreditsTotal: 0,
            paidCreditsRemaining: 0,
            resetAt: new Date(Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth() + 1, 1, 0, 0, 0)),
            isPaid: false,
          },
        },
        { upsert: true }
      );
    }

    const body = (await request.json().catch(() => ({}))) as { returnUrl?: string };
    const returnUrl = body.returnUrl || "/visualizer";

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