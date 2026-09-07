import prisma from "@/lib/prisma";
import { createAuditEvent } from "@/lib/audit";

export type TransactionState =
  | "PROPOSED"
  | "POLICY_EVALUATED"
  | "ALLOW"
  | "APPROVAL_REQUIRED"
  | "APPROVED"
  | "REJECTED"
  | "BLOCKED"
  | "CHECKOUT_CREATED"
  | "PAYMENT_PENDING"
  | "PAID"
  | "PAYMENT_FAILED"
  | "CANCELLED"
  | "EXPIRED";

// Defined valid state transition matrix
const VALID_TRANSITIONS: Record<TransactionState, TransactionState[]> = {
  PROPOSED: ["ALLOW", "APPROVAL_REQUIRED", "BLOCKED", "POLICY_EVALUATED", "CANCELLED"],
  POLICY_EVALUATED: ["ALLOW", "APPROVAL_REQUIRED", "BLOCKED"],
  ALLOW: ["CHECKOUT_CREATED", "APPROVAL_REQUIRED", "BLOCKED", "CANCELLED", "EXPIRED"],
  APPROVAL_REQUIRED: ["APPROVED", "REJECTED", "CANCELLED", "EXPIRED"],
  APPROVED: ["CHECKOUT_CREATED", "CANCELLED"],
  REJECTED: [], // Terminal
  BLOCKED: [], // Terminal
  CHECKOUT_CREATED: ["PAYMENT_PENDING", "PAID", "PAYMENT_FAILED", "CANCELLED", "EXPIRED"],
  PAYMENT_PENDING: ["PAID", "PAYMENT_FAILED", "CANCELLED"],
  PAID: [], // Terminal
  PAYMENT_FAILED: ["PAYMENT_PENDING", "PAID", "CANCELLED"],
  CANCELLED: [], // Terminal
  EXPIRED: [], // Terminal
};

export class InvalidStateTransitionError extends Error {
  constructor(public fromState: TransactionState, public toState: TransactionState) {
    super(`Invalid state transition from '${fromState}' to '${toState}'`);
    this.name = "InvalidStateTransitionError";
  }
}

export class StaleStateTransitionError extends Error {
  constructor(public transactionId: string, public expectedState: TransactionState) {
    super(`Transaction ${transactionId} state changed concurrently; expected '${expectedState}'`);
    this.name = "StaleStateTransitionError";
  }
}

/**
 * Validates whether a state transition is legal according to business rules.
 */
export function isValidTransition(from: TransactionState, to: TransactionState): boolean {
  if (from === to) return true; // Idempotent check
  return VALID_TRANSITIONS[from]?.includes(to) ?? false;
}

/**
 * Transition transaction state atomically using compare-and-swap (CAS)
 * and create an audit log inside the same Prisma transaction.
 */
export async function transitionTransactionState(
  transactionId: string,
  expectedFromState: TransactionState,
  targetState: TransactionState,
  actor: "system" | "user" | "merchant" | "razorpay" | "agent",
  auditPayload: Record<string, unknown>,
  additionalUpdates?: {
    razorpayOrderId?: string;
    razorpayPaymentId?: string;
  }
) {
  if (!isValidTransition(expectedFromState, targetState)) {
    throw new InvalidStateTransitionError(expectedFromState, targetState);
  }

  return prisma.$transaction(async (tx) => {
    // Atomic Compare-And-Swap update
    const updated = await tx.transaction.updateMany({
      where: {
        id: transactionId,
        state: expectedFromState,
      },
      data: {
        state: targetState,
        ...(additionalUpdates?.razorpayOrderId ? { razorpayOrderId: additionalUpdates.razorpayOrderId } : {}),
        ...(additionalUpdates?.razorpayPaymentId ? { razorpayPaymentId: additionalUpdates.razorpayPaymentId } : {}),
      },
    });

    if (updated.count === 0) {
      // Check current transaction state to give accurate error
      const current = await tx.transaction.findUnique({
        where: { id: transactionId },
        select: { state: true },
      });

      if (current?.state === targetState) {
        // Idempotent re-entry
        return tx.transaction.findUnique({ where: { id: transactionId } });
      }

      throw new StaleStateTransitionError(transactionId, expectedFromState);
    }

    // Record hash-chained audit event atomically inside the same transaction
    await createAuditEvent(tx, {
      transactionId,
      eventType: targetState,
      actor,
      payload: {
        fromState: expectedFromState,
        toState: targetState,
        ...auditPayload,
      },
    });

    return tx.transaction.findUnique({ where: { id: transactionId } });
  });
}
