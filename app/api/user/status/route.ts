import { NextRequest, NextResponse } from "next/server";
import { connectToDB } from "@/lib/mongodb";
import User from "@/lib/models/User";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const email = searchParams.get("email");

    if (!email) {
      return NextResponse.json(
        { error: "Email parameter is required" },
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

    // Find user by email
    const normalizedEmail = email.toLowerCase();
    const user = await User.findOne({
      email: normalizedEmail,
    }).exec();

    if (!user) {
      await User.updateOne(
        { email: normalizedEmail },
        {
          $setOnInsert: {
            email: normalizedEmail,
            isPro: false,
          },
        },
        { upsert: true }
      );

      // Return default response if user not found
      return NextResponse.json(
        {
          isPro: false,
          email: normalizedEmail,
          found: false,
        },
        { status: 200 }
      );
    }

    return NextResponse.json(
      {
        isPro: user.isPro,
        email: user.email,
        found: true,
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
