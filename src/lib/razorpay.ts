import Razorpay from "razorpay";
import crypto from "crypto";

export function getRazorpayInstance(): Razorpay {
  const key_id = process.env.RAZORPAY_KEY_ID;
  const key_secret = process.env.RAZORPAY_KEY_SECRET;

  if (!key_id || !key_secret || key_id.includes("dummy") || key_secret.includes("dummy")) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("CRITICAL: Production Razorpay credentials missing or set to dummy.");
    }
  }

  return new Razorpay({
    key_id: key_id || "rzp_test_placeholder",
    key_secret: key_secret || "rzp_secret_placeholder",
  });
}

/**
 * Timing-safe string comparison that handles unequal lengths without throwing.
 */
function safeEqual(a: string, b: string): boolean {
  if (typeof a !== "string" || typeof b !== "string") return false;
  const bufA = Buffer.from(a, "utf-8");
  const bufB = Buffer.from(b, "utf-8");

  if (bufA.length !== bufB.length) {
    return false;
  }

  return crypto.timingSafeEqual(bufA, bufB);
}

/**
 * Verify Razorpay Checkout Payment Signature
 * Formula: HMAC-SHA256(order_id + "|" + payment_id, secret) == signature
 */
export function verifyPaymentSignature(params: {
  orderId: string;
  paymentId: string;
  signature: string;
}): boolean {
  const secret = process.env.RAZORPAY_KEY_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("Razorpay key secret is not configured.");
    }
    return false;
  }

  const body = `${params.orderId}|${params.paymentId}`;
  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(body)
    .digest("hex");

  return safeEqual(expectedSignature, params.signature);
}

/**
 * Verify Razorpay Webhook HMAC Signature
 */
export function verifyWebhookSignature(bodyText: string, signature: string | null): boolean {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;

  // FAIL CLOSED: Never allow webhooks if secret is missing or empty
  if (!secret || secret.trim() === "") {
    console.error("CRITICAL: Webhook rejected — RAZORPAY_WEBHOOK_SECRET is missing or empty.");
    return false;
  }

  if (!signature) {
    return false;
  }

  try {
    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(bodyText)
      .digest("hex");

    return safeEqual(expectedSignature, signature);
  } catch {
    return false;
  }
}
