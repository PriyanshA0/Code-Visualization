import { NextRequest, NextResponse } from "next/server";
import { connectToDB } from "@/lib/mongodb";
import UserSubscription from "@/lib/models/UserSubscription";

type PolarWebhookPayload = {
  type?: string;
  data?: {
    id?: string;
    status?: string;
    customer_id?: string;
    metadata?: {
      clerkUserId?: string;
      userId?: string;
    };
  };
};

function resolveClerkUserId(payload: PolarWebhookPayload) {
  return payload.data?.metadata?.clerkUserId || payload.data?.metadata?.userId;
}

function resolvePaidState(eventType: string, status?: string) {
  const loweredType = eventType.toLowerCase();
  const loweredStatus = (status || "").toLowerCase();

  const activeStatuses = ["active", "trialing", "paid", "completed"];
  const cancelledStatuses = ["canceled", "cancelled", "revoked", "unpaid", "past_due", "failed"];

  if (activeStatuses.includes(loweredStatus)) return true;
  if (cancelledStatuses.includes(loweredStatus)) return false;

  if (loweredType.includes("cancel") || loweredType.includes("revoke") || loweredType.includes("failed")) {
    return false;
  }

  if (loweredType.includes("active") || loweredType.includes("created") || loweredType.includes("paid")) {
    return true;
  }

  return null;
}

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as PolarWebhookPayload | null;
  if (!body?.type) {
    return NextResponse.json({ error: "Invalid webhook payload" }, { status: 400 });
  }

  const userId = resolveClerkUserId(body);
  if (!userId) {
    return NextResponse.json(
      {
        received: true,
        ignored: true,
        reason: "Missing metadata.clerkUserId",
      },
      { status: 202 }
    );
  }

  const paidState = resolvePaidState(body.type, body.data?.status);
  if (paidState === null) {
    return NextResponse.json(
      {
        received: true,
        ignored: true,
        reason: "Unhandled event type/status",
      },
      { status: 202 }
    );
  }

  const connection = await connectToDB();
  if (!connection) {
    return NextResponse.json(
      {
        received: true,
        ignored: true,
        reason: "Database unavailable",
      },
      { status: 202 }
    );
  }

  const now = new Date();
  const resetAt = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1, 0, 0, 0));

  await UserSubscription.updateOne(
    { userId },
    {
      $set: {
        userId,
        planType: paidState ? "pro" : "free",
        isPaid: paidState,
        paymentProvider: "polar",
        providerCustomerId: body.data?.customer_id || body.data?.id,
        resetAt,
      },
      $setOnInsert: {
        monthlyFreeLimit: 2,
        monthlyFreeUsed: 0,
      },
    },
    { upsert: true }
  );

  return NextResponse.json({ received: true, synced: true, userId }, { status: 200 });
}