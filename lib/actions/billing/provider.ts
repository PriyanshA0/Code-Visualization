
import { Polar } from "@polar-sh/sdk";

export interface CheckoutPayload {
  userId: string;
  returnUrl: string;
  email?: string;
}

export interface CheckoutResult {
  checkoutUrl?: string;
  provider: "polar";
  placeholder: boolean;
  configured: boolean;
  message?: string;
}

function getBaseUrl() {
  return (
    process.env.APP_BASE_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    "http://localhost:3000"
  );
}

function toAbsoluteUrl(pathOrUrl: string) {
  if (pathOrUrl.startsWith("http://") || pathOrUrl.startsWith("https://")) {
    return pathOrUrl;
  }

  const baseUrl = getBaseUrl();
  return new URL(pathOrUrl, baseUrl).toString();
}

export async function createCheckoutSession(payload: CheckoutPayload): Promise<CheckoutResult> {
  const accessToken = process.env.POLAR_ACCESS_TOKEN;
  const productId = process.env.POLAR_PRODUCT_ID;
  const apiBase = process.env.POLAR_API_BASE_URL || "https://api.polar.sh";

  if (!accessToken || !productId) {
    return {
      provider: "polar",
      placeholder: true,
      configured: false,
      message:
        "Payment processing is not configured. Please contact support.",
    };
  }

  try {
    const successUrl = toAbsoluteUrl(payload.returnUrl || "/visualizer");
    const polar = new Polar({
      accessToken,
      serverURL: apiBase,
    });

    const checkout = await polar.checkouts.create({
      products: [productId],
      successUrl,
      returnUrl: successUrl,
      metadata: {
        clerkUserId: payload.userId,
        ...(payload.email ? { email: payload.email } : {}),
      },
    });

    const checkoutUrl = checkout.url || (checkout as { checkout_url?: string }).checkout_url;
    if (!checkoutUrl) {
      return {
        provider: "polar",
        placeholder: true,
        configured: true,
        message: "Unable to process checkout. Please try again later or contact support.",
      };
    }

    return {
      checkoutUrl,
      provider: "polar",
      placeholder: false,
      configured: true,
    };
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Unable to process payment. Please try again or contact support.";

    return {
      provider: "polar",
      placeholder: true,
      configured: true,
      message,
    };
  }
}