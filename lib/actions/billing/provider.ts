export interface CheckoutPayload {
  userId: string;
  returnUrl: string;
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
        "Polar is not configured. Set POLAR_ACCESS_TOKEN and POLAR_PRODUCT_ID in .env.local.",
    };
  }

  try {
    const successUrl = toAbsoluteUrl(payload.returnUrl || "/visualizer");

    const response = await fetch(`${apiBase}/v1/checkouts`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        products: [productId],
        success_url: successUrl,
        metadata: {
          clerkUserId: payload.userId,
        },
      }),
      cache: "no-store",
    });

    const result = (await response.json().catch(() => null)) as
      | { url?: string; checkout_url?: string; error?: string; detail?: string }
      | null;

    if (!response.ok) {
      return {
        provider: "polar",
        placeholder: true,
        configured: true,
        message:
          result?.detail || result?.error || "Polar checkout request failed. Check API credentials.",
      };
    }

    const checkoutUrl = result?.url || result?.checkout_url;
    if (!checkoutUrl) {
      return {
        provider: "polar",
        placeholder: true,
        configured: true,
        message: "Polar checkout created but no checkout URL was returned.",
      };
    }

    return {
      checkoutUrl,
      provider: "polar",
      placeholder: false,
      configured: true,
    };
  } catch {
    return {
      provider: "polar",
      placeholder: true,
      configured: true,
      message: "Unable to connect to Polar API. Try again or verify POLAR_API_BASE_URL.",
    };
  }
}