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

    // Atomic State Transition: APPROVAL_REQUIRED -> APPROVED
    const updated = await transitionTransactionState(
      transactionId,
      "APPROVAL_REQUIRED",
      "APPROVED",
      "merchant",
      {
        action: "MERCHANT_APPROVAL_GRANTED",
        approvedBy: auth.userId,
      }
    );

    logger.info("Merchant approved transaction", {
      transactionId,
      approvedBy: auth.userId,
    });

    return NextResponse.json({ success: true, state: updated?.state || "APPROVED" });
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    logger.error("Error approving transaction", { error: String(error) });
    return NextResponse.json({ error: "Failed to approve transaction" }, { status: 500 });
  }
}
