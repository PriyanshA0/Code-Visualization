import { NextRequest, NextResponse } from "next/server";
import { WebhookVerificationError, validateEvent } from "@polar-sh/sdk/webhooks";
import { connectToDB } from "@/lib/mongodb";
import User from "@/lib/models/User";

type PolarWebhookPayload = {
  type?: string;
  id?: string;
  data?: {
    id?: string;
    status?: string;
    customer_id?: string;
    customer_email?: string;
    metadata?: Record<string, any>;
  };
};

/**
 * Log webhook payload for debugging
 */
function logWebhookPayload(payload: PolarWebhookPayload) {
  console.log("[Polar Webhook] Received event:", {
    eventType: payload.type,
    eventId: payload.id,
    timestamp: new Date().toISOString(),
    customerEmail: payload.data?.customer_email,
  });
}

/**
 * Extract email from webhook payload
 */
function extractEmail(payload: PolarWebhookPayload): string | null {
  return payload.data?.customer_email || null;
}

/**
 * Check if event type is a successful payment
 */
function isPaymentSuccessEvent(eventType?: string): boolean {
  if (!eventType) return false;
  const loweredType = eventType.toLowerCase();
  return loweredType === "order.paid";
}

export async function POST(request: NextRequest) {
  try {
    // Verify request method
    if (request.method !== "POST") {
      return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
    }

    // Get webhook secret from environment
    const webhookSecret = process.env.POLAR_WEBHOOK_SECRET;
    if (!webhookSecret) {
      console.error("[Polar Webhook] Missing POLAR_WEBHOOK_SECRET");
      return NextResponse.json(
        { error: "Webhook secret is not configured" },
        { status: 503 }
      );
    }

    // Get raw body for verification
    const rawBody = await request.text();
    if (!rawBody) {
      return NextResponse.json(
        { error: "Invalid webhook payload" },
        { status: 400 }
      );
    }

    // Validate webhook signature
    let body: PolarWebhookPayload;
    try {
      const event = validateEvent(
        rawBody,
        Object.fromEntries(request.headers.entries()),
        webhookSecret
      );
      body = event as PolarWebhookPayload;
    } catch (error) {
      if (error instanceof WebhookVerificationError) {
        console.error("[Polar Webhook] Invalid webhook signature");
        return NextResponse.json(
          { error: "Invalid webhook signature" },
          { status: 403 }
        );
      }
      console.error("[Polar Webhook] Validation failed:", error);
      return NextResponse.json(
        { error: "Webhook validation failed" },
        { status: 400 }
      );
    }

    // Log full payload for debugging
    logWebhookPayload(body);

    // Check if event type is payment success
    if (!isPaymentSuccessEvent(body.type)) {
      console.log("[Polar Webhook] Ignoring event type:", body.type);
      return NextResponse.json(
        {
          received: true,
          ignored: true,
          reason: "Event is not order.paid",
        },
        { status: 202 }
      );
    }

    // Extract user email
    const email = extractEmail(body);
    if (!email) {
      console.error("[Polar Webhook] Missing customer_email in payload");
      return NextResponse.json(
        {
          received: true,
          ignored: true,
          reason: "Missing customer_email",
        },
        { status: 202 }
      );
    }

    // Connect to database
    const connection = await connectToDB();
    if (!connection) {
      console.error("[Polar Webhook] Database unavailable");
      return NextResponse.json(
        {
          received: true,
          ignored: true,
          reason: "Database unavailable",
        },
        { status: 202 }
      );
    }

    // Find user by email and upgrade to Pro
    const user = await User.findOneAndUpdate(
      { email: email.toLowerCase() },
      {
        $set: {
          email: email.toLowerCase(),
          isPro: true,
        },
      },
      { new: true, upsert: true }
    ).exec();

    console.log("[Polar Webhook] User upgraded to Pro:", {
      email,
      userId: user._id,
      isPro: user.isPro,
    });

    return NextResponse.json(
      {
        received: true,
        synced: true,
        email,
        userId: user._id,
        isPro: user.isPro,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[Polar Webhook] Unhandled error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
