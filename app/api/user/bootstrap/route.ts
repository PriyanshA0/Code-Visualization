import { NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { connectToDB } from "@/lib/mongodb";
import User from "@/lib/models/User";
import UserSubscription from "@/lib/models/UserSubscription";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await currentUser();
    const email = user?.emailAddresses?.[0]?.emailAddress?.toLowerCase() || null;

    const connection = await connectToDB();
    if (!connection) {
      return NextResponse.json(
        { error: "Database unavailable", connected: false },
        { status: 503 }
      );
    }

    if (email) {
      await User.updateOne(
        {
          $or: [{ clerkId: userId }, { email }],
        },
        {
          $set: {
            email,
            clerkId: userId,
          },
          $setOnInsert: {
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

    return NextResponse.json(
      {
        connected: true,
        userId,
        email,
        userSynced: Boolean(email),
        bootstrapped: true,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("User bootstrap error:", error);
    return NextResponse.json(
      { error: "Failed to bootstrap user record" },
      { status: 500 }
    );
  }
}