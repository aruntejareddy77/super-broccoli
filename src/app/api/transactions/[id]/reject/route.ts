import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthContext, requireMerchantRole, AuthorizationError } from "@/lib/auth";
import { transitionTransactionState } from "@/lib/state-machine";
import { logger } from "@/lib/logger";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getAuthContext(request);
    
    // Enforce Merchant Authorization
    requireMerchantRole(auth);

    const { id: transactionId } = await params;

    const transaction = await prisma.transaction.findUnique({
      where: { id: transactionId },
    });

    if (!transaction) {
      return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
    }

    if (transaction.state !== "APPROVAL_REQUIRED") {
      return NextResponse.json({ error: "Transaction is not awaiting approval" }, { status: 400 });
    }

    // Atomic State Transition: APPROVAL_REQUIRED -> REJECTED
    const updated = await transitionTransactionState(
      transactionId,
      "APPROVAL_REQUIRED",
      "REJECTED",
      "merchant",
      {
        action: "MERCHANT_APPROVAL_REJECTED",
        rejectedBy: auth.userId,
      }
    );

    logger.info("Merchant rejected transaction", {
      transactionId,
      rejectedBy: auth.userId,
    });

    return NextResponse.json({ success: true, state: updated?.state || "REJECTED" });
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    logger.error("Error rejecting transaction", { error: String(error) });
    return NextResponse.json({ error: "Failed to reject transaction" }, { status: 500 });
  }
}
