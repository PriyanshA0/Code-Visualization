import { NextRequest, NextResponse } from "next/server";
import { WebhookVerificationError, validateEvent } from "@polar-sh/sdk/webhooks";
import { connectToDB } from "@/lib/mongodb";
import UserSubscription from "@/lib/models/UserSubscription";

const CREDIT_PACK_SIZE = 10;

type PolarWebhookPayload = {
  type?: string;
  id?: string;
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

function shouldProcessEvent(eventType: string) {
  const loweredType = eventType.toLowerCase();
  return loweredType.startsWith("order.") || loweredType.startsWith("checkout.");
}

function resolveEventId(payload: PolarWebhookPayload) {
  return payload.id || payload.data?.id;
}

export async function POST(request: NextRequest) {
  const webhookSecret = process.env.POLAR_WEBHOOK_SECRET;
  if (!webhookSecret) {
    return NextResponse.json({ error: "Webhook secret is not configured" }, { status: 503 });
  }

  const rawBody = await request.text();
  if (!rawBody) {
    return NextResponse.json({ error: "Invalid webhook payload" }, { status: 400 });
  }

  let body: PolarWebhookPayload;
  try {
    const event = validateEvent(rawBody, Object.fromEntries(request.headers.entries()), webhookSecret);
    body = event as PolarWebhookPayload;
  } catch (error) {
    if (error instanceof WebhookVerificationError) {
      return NextResponse.json({ error: "Invalid webhook signature" }, { status: 403 });
    }

    return NextResponse.json({ error: "Webhook validation failed" }, { status: 400 });
  }

  if (!body?.type) {
    return NextResponse.json({ error: "Invalid webhook payload" }, { status: 400 });
  }

  if (!shouldProcessEvent(body.type)) {
    return NextResponse.json(
      {
        received: true,
        ignored: true,
        reason: "Unhandled event type",
      },
      { status: 202 }
    );
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
  if (paidState !== true) {
    return NextResponse.json(
      {
        received: true,
        ignored: true,
        reason: "Event is not a completed paid state",
      },
      { status: 202 }
    );
  }

  const eventId = resolveEventId(body);

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

  if (eventId) {
    const existing = await UserSubscription.findOne(
      { userId },
      { lastProcessedPolarEventId: 1 }
    ).exec();
    if (existing?.lastProcessedPolarEventId === eventId) {
      return NextResponse.json(
        {
          received: true,
          ignored: true,
          reason: "Duplicate event",
          userId,
        },
        { status: 200 }
      );
    }
  }

  await UserSubscription.updateOne(
    { userId },
    {
      $set: {
        userId,
        planType: "pro",
        isPaid: true,
        paymentProvider: "polar",
        providerCustomerId: body.data?.customer_id || body.data?.id,
        ...(eventId ? { lastProcessedPolarEventId: eventId } : {}),
        resetAt,
      },
      $inc: {
        paidCreditsTotal: CREDIT_PACK_SIZE,
        paidCreditsRemaining: CREDIT_PACK_SIZE,
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