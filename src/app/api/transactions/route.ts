import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { CreateTransactionSchema } from "@/lib/validation";
import { getAuthContext } from "@/lib/auth";
import { createAuditEvent } from "@/lib/audit";
import { logger } from "@/lib/logger";

export async function POST(req: Request) {
  const startTime = Date.now();
  try {
    const auth = await getAuthContext(req);
    const body = await req.json();

    const parseResult = CreateTransactionSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parseResult.error.flatten() },
        { status: 400 }
      );
    }

    const { product_id, quantity, cart_items } = parseResult.data;

    // 1. Server-Authoritative Price & Inventory Lookup
    const product = await prisma.product.findUnique({
      where: { id: product_id },
      include: { merchant: true },
    });

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    if (product.inventory < quantity) {
      return NextResponse.json({ error: "INVENTORY_UNAVAILABLE" }, { status: 400 });
    }

    // 2. Server-Calculated Authoritative Total — sum ALL cart items with server-side prices
    let totalAmount = product.price * quantity;
    let totalQuantity = quantity;
    const cartItemNames: string[] = [product.name];

    if (cart_items && cart_items.length > 0) {
      for (const item of cart_items) {
        if (item.product_id === product_id) continue; // Already counted above
        const itemProduct = await prisma.product.findUnique({ where: { id: item.product_id } });
        if (itemProduct) {
          totalAmount += itemProduct.price * item.quantity;
          totalQuantity += item.quantity;
          cartItemNames.push(itemProduct.name);
        }
      }
    }

    const productDisplayName = cartItemNames.length > 1
      ? `${cartItemNames[0]} + ${cartItemNames.length - 1} more`
      : product.name;

    // 3. Create Transaction + Audit Event in a single atomic Prisma transaction
    const transaction = await prisma.$transaction(async (tx) => {
      const createdTx = await tx.transaction.create({
        data: {
          userId: auth.userId,
          merchantId: product.merchantId,
          productId: product.id,
          productName: productDisplayName,
          unitPrice: product.price,
          currency: product.currency,
          quantity: totalQuantity,
          totalAmount,
          state: "PROPOSED",
        },
      });

      await createAuditEvent(tx, {
        transactionId: createdTx.id,
        eventType: "PROPOSED",
        actor: "system",
        payload: {
          action: "TRANSACTION_SNAPSHOT_CREATED",
          productId: product.id,
          quantity,
          unitPrice: product.price,
          authoritativeTotal: totalAmount,
          currency: product.currency,
        },
      });

      return createdTx;
    });

    logger.info("Transaction snapshot created", {
      transactionId: transaction.id,
      userId: auth.userId,
      totalAmount,
      durationMs: Date.now() - startTime,
    });

    return NextResponse.json({ transaction });
  } catch (error) {
    logger.error("Error creating transaction", { error: String(error) });
    return NextResponse.json({ error: "Failed to create transaction" }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const auth = await getAuthContext(req);
    
    // Allow either the merchant (viewing dashboard) or the customer (viewing their checkout)
    const url = new URL(req.url);
    const merchantMode = url.searchParams.get("merchant") === "true";
    
    if (merchantMode && auth.role !== "MERCHANT") {
       return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Fetch the most recent active transaction that needs attention or was just processed
    const transaction = await prisma.transaction.findFirst({
      where: merchantMode 
        ? { state: { in: ["APPROVAL_REQUIRED", "APPROVED", "REJECTED", "BLOCKED"] } }
        : { userId: auth.userId },
      orderBy: { createdAt: "desc" },
      include: {
        auditEvents: {
          orderBy: { createdAt: 'asc' }
        }
      }
    });

    return NextResponse.json({ transaction });
  } catch (error) {
    logger.error("Error fetching transactions", { error: String(error) });
    return NextResponse.json({ error: "Failed to fetch transactions" }, { status: 500 });
  }
}
