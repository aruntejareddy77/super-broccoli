import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { PaymentVerifySchema } from "@/lib/validation";
import { verifyPaymentSignature } from "@/lib/razorpay";
import { transitionTransactionState } from "@/lib/state-machine";
import { logger } from "@/lib/logger";

export async function POST(req: Request) {
  const startTime = Date.now();
  try {
    const body = await req.json();
    const parseResult = PaymentVerifySchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parseResult.error.flatten() },
        { status: 400 }
      );
    }

    const { transaction_id, razorpay_order_id, razorpay_payment_id, razorpay_signature } =
      parseResult.data;

    // 1. Fetch transaction
    const transaction = await prisma.transaction.findUnique({
      where: { id: transaction_id },
    });

    if (!transaction) {
      return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
    }

    // 2. Verify Razorpay Order ID matches authoritative database snapshot
    if (transaction.razorpayOrderId !== razorpay_order_id) {
      logger.warn("Payment verify order ID mismatch", {
        transactionId: transaction_id,
        expectedOrder: transaction.razorpayOrderId,
        receivedOrder: razorpay_order_id,
      });
      return NextResponse.json({ error: "Order ID mismatch" }, { status: 400 });
    }

    // 3. Idempotent check — if already PAID, return clean
    if (transaction.state === "PAID") {
      return NextResponse.json({
        success: true,
        state: "PAID",
        message: "Payment already verified",
      });
    }

    // 4. Verify HMAC Signature server-side
    const isValid = verifyPaymentSignature({
      orderId: razorpay_order_id,
      paymentId: razorpay_payment_id,
      signature: razorpay_signature,
    });

    if (!isValid) {
      logger.error("Payment signature verification failed", {
        transactionId: transaction_id,
        orderId: razorpay_order_id,
      });
      return NextResponse.json({ error: "Invalid payment signature" }, { status: 400 });
    }

    // 5. Atomically transition state to PAID and record audit event
    const updated = await transitionTransactionState(
      transaction_id,
      transaction.state as any,
      "PAID",
      "user",
      {
        action: "PAYMENT_VERIFIED_CLIENT_SIGNATURE",
        razorpay_order_id,
        razorpay_payment_id,
        verified_amount: transaction.totalAmount,
      },
      {
        razorpayPaymentId: razorpay_payment_id,
      }
    );

    logger.info("Payment signature verified successfully", {
      transactionId: transaction_id,
      paymentId: razorpay_payment_id,
      durationMs: Date.now() - startTime,
    });

    return NextResponse.json({
      success: true,
      state: updated?.state || "PAID",
      transaction: updated,
    });
  } catch (error) {
    logger.error("Payment verification error", { error: String(error) });
    return NextResponse.json({ error: "Payment verification failed" }, { status: 500 });
  }
}
