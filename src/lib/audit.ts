import crypto from "crypto";
import { Prisma } from "@prisma/client";

/**
 * Generate SHA-256 hash for hash-chained audit trails.
 */
export function generateAuditHash(payload: string, previousHash?: string | null): string {
  const data = previousHash ? `${previousHash}${payload}` : payload;
  return crypto.createHash("sha256").update(data).digest("hex");
}

/**
 * Creates an AuditEvent record inside a Prisma transaction or client.
 */
export async function createAuditEvent(
  tx: Prisma.TransactionClient,
  data: {
    transactionId: string;
    eventType: string;
    actor: "system" | "user" | "merchant" | "razorpay" | "agent";
    payload: Record<string, unknown>;
  }
) {
  // Fetch latest audit event for hash chaining
  const latestEvent = await tx.auditEvent.findFirst({
    where: { transactionId: data.transactionId },
    orderBy: { createdAt: "desc" },
    select: { hash: true },
  });

  const previousHash = latestEvent?.hash || null;
  const eventPayload = JSON.stringify(data.payload);
  const hash = generateAuditHash(eventPayload, previousHash);

  return tx.auditEvent.create({
    data: {
      transactionId: data.transactionId,
      eventType: data.eventType,
      actor: data.actor,
      payload: eventPayload,
      previousHash,
      hash,
    },
  });
}
