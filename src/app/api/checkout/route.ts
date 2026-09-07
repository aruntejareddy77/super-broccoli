import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { CheckoutSchema } from "@/lib/validation";
import { getRazorpayInstance } from "@/lib/razorpay";
import { transitionTransactionState } from "@/lib/state-machine";
import { getAuthContext } from "@/lib/auth";
import { logger } from "@/lib/logger";

export async function POST(req: Request) {
  const startTime = Date.now();
  try {
    const auth = await getAuthContext(req);
    const body = await req.json();

    const parseResult = CheckoutSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parseResult.error.flatten() },
        { status: 400 }
      );
    }

    const { transaction_id } = parseResult.data;

    const transaction = await prisma.transaction.findUnique({
      where: { id: transaction_id },
    });

    if (!transaction) {
      return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
    }

    // 1. State Boundary Enforcement
    if (transaction.state === "BLOCKED") {
      return NextResponse.json({ error: "Cannot checkout a blocked transaction" }, { status: 403 });
    }

    if (transaction.state === "APPROVAL_REQUIRED" || transaction.state === "REJECTED") {
      return NextResponse.json({ error: "Transaction requires approval or was rejected" }, { status: 403 });
    }

    if (
      transaction.state !== "ALLOW" &&
      transaction.state !== "APPROVED" &&
      transaction.state !== "CHECKOUT_CREATED"
    ) {
      return NextResponse.json({ error: "Invalid state for checkout" }, { status: 400 });
    }

    const keyId = process.env.RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;

    // 2. Idempotency Check
    if (transaction.razorpayOrderId) {
      return NextResponse.json({
        orderId: transaction.razorpayOrderId,
        amount: transaction.totalAmount,
        keyId,
      });
    }

    // 3. Create Razorpay Order using server-calculated amount
    const options = {
      amount: transaction.totalAmount, // Amount in minor units (paise)
      currency: transaction.currency,
      receipt: transaction.id,
    };

    const razorpay = getRazorpayInstance();
    const order = await razorpay.orders.create(options);

    // 4. Atomic state transition and audit logging
    await transitionTransactionState(
      transaction.id,
      transaction.state as any,
      "CHECKOUT_CREATED",
      "system",
      {
        action: "RAZORPAY_ORDER_CREATED",
        razorpay_order_id: order.id,
        authoritative_amount: transaction.totalAmount,
      },
      {
        razorpayOrderId: order.id,
      }
    );

    logger.info("Checkout order created successfully", {
      transactionId: transaction.id,
      orderId: order.id,
      userId: auth.userId,
      durationMs: Date.now() - startTime,
    });

    return NextResponse.json({
      orderId: order.id,
      amount: transaction.totalAmount,
      keyId,
    });
  } catch (error) {
    logger.error("Checkout error", { error: String(error) });
    return NextResponse.json({ error: "Checkout failed" }, { status: 500 });
  }
}
