import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { PolicyEvaluationSchema } from "@/lib/validation";
import { transitionTransactionState } from "@/lib/state-machine";
import { logger } from "@/lib/logger";

export async function POST(req: Request) {
  const startTime = Date.now();
  try {
    const body = await req.json();
    const parseResult = PolicyEvaluationSchema.safeParse(body);

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

    if (transaction.state !== "PROPOSED") {
      return NextResponse.json({ error: "Invalid state transition for policy evaluation" }, { status: 400 });
    }

    // Fetch merchant policies
    const policy = await prisma.policy.findFirst({
      where: { merchantId: transaction.merchantId },
    });

    if (!policy) {
      return NextResponse.json({ error: "Merchant policy not found" }, { status: 500 });
    }

    let decision: "ALLOW" | "APPROVAL_REQUIRED" | "BLOCK" = "ALLOW";
    let reasons: string[] = [];
    let requires_approval = false;
    let nextState: "ALLOW" | "APPROVAL_REQUIRED" | "BLOCKED" = "ALLOW";

    const rules_evaluated = [
      { rule: "Autonomous Limit", value: policy.autonomousLimit, check: transaction.totalAmount <= policy.autonomousLimit },
      { rule: "Approval Threshold", value: policy.approvalThreshold, check: transaction.totalAmount > policy.approvalThreshold && transaction.totalAmount <= policy.maxAmount },
      { rule: "Max Amount", value: policy.maxAmount, check: transaction.totalAmount > policy.maxAmount },
      { rule: "Max Quantity", value: policy.maxQuantity, check: transaction.quantity > policy.maxQuantity },
    ];

    // Rule 4: Quantity limit
    if (transaction.quantity > policy.maxQuantity) {
      decision = "BLOCK";
      nextState = "BLOCKED";
      reasons.push("Transaction exceeds maximum permitted quantity");
    }
    // Rule 3: Max amount cap
    else if (transaction.totalAmount > policy.maxAmount) {
      decision = "BLOCK";
      nextState = "BLOCKED";
      reasons.push("Transaction exceeds maximum permitted amount");
    }
    // Rule 2: Exceeds autonomous threshold -> Approval Required
    else if (transaction.totalAmount > policy.approvalThreshold && transaction.totalAmount <= policy.maxAmount) {
      decision = "APPROVAL_REQUIRED";
      nextState = "APPROVAL_REQUIRED";
      requires_approval = true;
      reasons.push("Transaction exceeds autonomous spending limit");
    }
    // Rule 1: Within limit -> ALLOW
    else {
      decision = "ALLOW";
      nextState = "ALLOW";
      reasons.push("Transaction is within autonomous limits");
    }

    // Atomically transition state and record audit log via state machine
    await transitionTransactionState(
      transaction_id,
      "PROPOSED",
      nextState,
      "system",
      {
        decision,
        reasons,
        requires_approval,
        rules_evaluated,
        authoritativeTotal: transaction.totalAmount,
      }
    );

    logger.info("Policy evaluated successfully", {
      transactionId: transaction_id,
      decision,
      nextState,
      durationMs: Date.now() - startTime,
    });

    return NextResponse.json({
      decision,
      reasons,
      rules_evaluated,
      requires_approval,
      state: nextState,
    });
  } catch (error) {
    logger.error("Error evaluating policy", { error: String(error) });
    return NextResponse.json({ error: "Policy engine failed" }, { status: 500 });
  }
}
