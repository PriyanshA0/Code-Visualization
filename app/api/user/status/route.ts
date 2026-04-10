import { NextRequest, NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { connectToDB } from "@/lib/mongodb";
import User from "@/lib/models/User";
import UserSubscription from "@/lib/models/UserSubscription";

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    const clerkUser = userId ? await currentUser() : null;

    const searchParams = request.nextUrl.searchParams;
    const emailParam = searchParams.get("email");
    const emailFromClerk = clerkUser?.emailAddresses?.[0]?.emailAddress || null;
    const normalizedEmail = (emailFromClerk || emailParam || "").toLowerCase() || null;

    if (!userId && !normalizedEmail) {
      return NextResponse.json(
        { error: "A signed-in user or email parameter is required" },
        { status: 400 }
      );
    }

    // Connect to database
    const connection = await connectToDB();
    if (!connection) {
      return NextResponse.json(
        { error: "Database unavailable" },
        { status: 503 }
      );
    }

    const userQuery = {
      $or: [
        ...(userId ? [{ clerkId: userId }] : []),
        ...(normalizedEmail ? [{ email: normalizedEmail }] : []),
      ],
    };

    let user = await User.findOne(userQuery).exec();

    if (!user && userId && normalizedEmail) {
      user = await User.findOneAndUpdate(
        userQuery,
        {
          $set: {
            clerkId: userId,
            email: normalizedEmail,
          },
          $setOnInsert: {
            isPro: false,
          },
        },
        { new: true, upsert: true }
      ).exec();
    }

    const subscription = userId
      ? await UserSubscription.findOne({ userId }, { planType: 1, isPaid: 1, paidCreditsRemaining: 1 }).exec()
      : null;

    const isProFromSubscription = Boolean(
      subscription &&
      (subscription.isPaid || subscription.planType === "pro" || subscription.paidCreditsRemaining > 0)
    );

    const isPro = Boolean(user?.isPro || isProFromSubscription);

    if (!user) {
      return NextResponse.json(
        {
          isPro,
          email: normalizedEmail,
          clerkId: userId || null,
          found: false,
          source: isProFromSubscription ? "subscription" : "none",
        },
        { status: 200 }
      );
    }

    return NextResponse.json(
      {
        isPro,
        email: user.email,
        clerkId: user.clerkId || userId || null,
        found: true,
        source: user.isPro ? "user" : isProFromSubscription ? "subscription" : "user",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[User Status] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
