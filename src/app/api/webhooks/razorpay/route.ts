import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyWebhookSignature } from "@/lib/razorpay";
import { transitionTransactionState } from "@/lib/state-machine";
import { logger } from "@/lib/logger";

export async function POST(req: Request) {
  const startTime = Date.now();
  try {
    const bodyText = await req.text();
    const signature = req.headers.get("x-razorpay-signature");

    // FAIL CLOSED: Verify HMAC Signature with strict secret check
    if (!verifyWebhookSignature(bodyText, signature)) {
      logger.warn("Webhook rejected — invalid signature or missing secret");
      return NextResponse.json({ error: "Invalid signature or unconfigured webhook secret" }, { status: 401 });
    }

    let event: any;
    try {
      event = JSON.parse(bodyText);
    } catch {
      return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
    }

    const orderId = event.payload?.payment?.entity?.order_id;
    const paymentId = event.payload?.payment?.entity?.id;
    const eventName = event.event;

    if (!orderId) {
      return NextResponse.json({ received: true });
    }

    // Find transaction by orderId
    const transaction = await prisma.transaction.findFirst({
      where: { razorpayOrderId: orderId },
    });

    if (!transaction) {
      logger.warn(`Webhook received for unknown order ${orderId}`);
      return NextResponse.json({ received: true });
    }

    let nextState: "PAID" | "PAYMENT_FAILED" | null = null;
    if (eventName === "payment.captured" || eventName === "payment.authorized") {
      nextState = "PAID";
    } else if (eventName === "payment.failed") {
      nextState = "PAYMENT_FAILED";
    }

    if (!nextState) {
      return NextResponse.json({ received: true });
    }

    // Idempotency: if transaction is already in target state, return 200
    if (transaction.state === nextState) {
      return NextResponse.json({ received: true, status: "already_processed" });
    }

    // Perform atomic state transition and audit logging in a single DB transaction
    await transitionTransactionState(
      transaction.id,
      transaction.state as any,
      nextState,
      "razorpay",
      {
        action: `WEBHOOK_${eventName.toUpperCase()}`,
        event_name: eventName,
        razorpay_order_id: orderId,
        razorpay_payment_id: paymentId,
      },
      {
        razorpayPaymentId: paymentId,
      }
    );

    logger.info("Webhook processed successfully", {
      transactionId: transaction.id,
      eventName,
      nextState,
      durationMs: Date.now() - startTime,
    });

    return NextResponse.json({ received: true, state: nextState });
  } catch (error) {
    logger.error("Webhook processing error", { error: String(error) });
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}
