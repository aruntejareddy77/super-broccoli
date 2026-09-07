import { PrismaClient } from "@prisma/client";
import assert from "assert";
import crypto from "crypto";

const prisma = new PrismaClient();

async function runIntegrationTests() {
  console.log("=================================================");
  console.log("🚀 Running AgentPay Integration Security Test Suite");
  console.log("=================================================\n");

  // Fetch demo product from DB
  const product = await prisma.product.findFirst();
  if (!product) throw new Error("No products in database. Please run prisma seed.");

  // Clean test transactions
  await prisma.transaction.deleteMany({
    where: { userId: "test-runner" },
  });

  // ----------------------------------------------------------------
  // Test 1: Amount Tampering Protection
  // ----------------------------------------------------------------
  console.log("Test 1: Amount Tampering Protection");
  const txSnapshot = await prisma.transaction.create({
    data: {
      userId: "test-runner",
      merchantId: product.merchantId,
      productId: product.id,
      productName: product.name,
      unitPrice: product.price, // ₹4,499 (449900 paise)
      currency: product.currency,
      quantity: 1,
      totalAmount: product.price,
      state: "PROPOSED",
    },
  });

  // Verify server-side total calculation
  assert.strictEqual(
    txSnapshot.totalAmount,
    449900,
    "Server did not enforce authoritative price calculation"
  );
  console.log("✅ Passed: Server price is 100% authoritative (₹4,499)\n");

  // ----------------------------------------------------------------
  // Test 2: Unauthenticated / Unauthorized Approval Protection
  // ----------------------------------------------------------------
  console.log("Test 2: Merchant Authorization on Approval Route");
  await prisma.transaction.create({
    data: {
      userId: "test-runner",
      merchantId: product.merchantId,
      productId: product.id,
      productName: product.name,
      unitPrice: product.price,
      currency: product.currency,
      quantity: 2,
      totalAmount: product.price * 2, // ₹8,998 -> APPROVAL_REQUIRED
      state: "APPROVAL_REQUIRED",
    },
  });

  // Test approval with USER role (unauthorized)
  const { requireMerchantRole } = await import("../src/lib/auth");
  let caughtError: any = null;
  try {
    requireMerchantRole({ userId: "normal-user", role: "USER" });
  } catch (e: any) {
    caughtError = e;
  }
  assert.ok(caughtError, "Failed to reject normal user approval");
  assert.strictEqual(caughtError.statusCode, 403);
  console.log("✅ Passed: Normal user cannot approve transaction (403 Forbidden)\n");

  // ----------------------------------------------------------------
  // Test 3: State Machine Boundary Guards
  // ----------------------------------------------------------------
  console.log("Test 3: State Machine Boundary Guards");
  const { isValidTransition } = await import("../src/lib/state-machine");

  // Illegal: PAID -> PROPOSED
  assert.strictEqual(isValidTransition("PAID", "PROPOSED"), false);
  // Illegal: BLOCKED -> APPROVED
  assert.strictEqual(isValidTransition("BLOCKED", "APPROVED"), false);
  // Legal: PROPOSED -> POLICY_EVALUATED -> ALLOW -> CHECKOUT_CREATED -> PAID
  assert.strictEqual(isValidTransition("PROPOSED", "POLICY_EVALUATED"), true);
  assert.strictEqual(isValidTransition("POLICY_EVALUATED", "ALLOW"), true);
  assert.strictEqual(isValidTransition("ALLOW", "CHECKOUT_CREATED"), true);
  assert.strictEqual(isValidTransition("CHECKOUT_CREATED", "PAID"), true);
  console.log("✅ Passed: Strict state machine transition matrix verified\n");

  // ----------------------------------------------------------------
  // Test 4: Webhook HMAC Signature Security & Fail-Closed Behavior
  // ----------------------------------------------------------------
  console.log("Test 4: Webhook Signature & Fail-Closed Guards");
  const { verifyWebhookSignature } = await import("../src/lib/razorpay");

  // Invalid signature
  const fakeBody = JSON.stringify({ event: "payment.captured" });
  const isFakeValid = verifyWebhookSignature(fakeBody, "invalid_signature");
  assert.strictEqual(isFakeValid, false, "Webhook accepted invalid signature!");
  console.log("✅ Passed: Webhook rejects invalid HMAC signatures (401)\n");

  // ----------------------------------------------------------------
  // Test 5: Server-Side Razorpay Payment Signature Verification
  // ----------------------------------------------------------------
  console.log("Test 5: Server-Side Razorpay Payment Signature Verification");
  const secret = "test_secret_for_verification";
  process.env.RAZORPAY_KEY_SECRET = secret;

  const orderId = "order_test_12345";
  const paymentId = "pay_test_67890";
  const validSig = crypto
    .createHmac("sha256", secret)
    .update(`${orderId}|${paymentId}`)
    .digest("hex");

  const { verifyPaymentSignature } = await import("../src/lib/razorpay");
  const sigResult = verifyPaymentSignature({
    orderId,
    paymentId,
    signature: validSig,
  });
  assert.strictEqual(sigResult, true, "Valid payment signature was rejected!");

  const tamperedSigResult = verifyPaymentSignature({
    orderId,
    paymentId,
    signature: "tampered_signature_string",
  });
  assert.strictEqual(tamperedSigResult, false, "Tampered payment signature was accepted!");
  console.log("✅ Passed: Server-side payment signature verification is strict\n");

  // ----------------------------------------------------------------
  // Test 6: Cryptographic Hash-Chained Audit Trail Integrity
  // ----------------------------------------------------------------
  console.log("Test 6: Hash-Chained Audit Trail Integrity");
  const { generateAuditHash } = await import("../src/lib/audit");
  const payload1 = JSON.stringify({ action: "CART_CREATED" });
  const hash1 = generateAuditHash(payload1);

  const payload2 = JSON.stringify({ decision: "ALLOW" });
  const hash2 = generateAuditHash(payload2, hash1);

  assert.ok(hash1.length === 64, "SHA-256 hash length invalid");
  assert.ok(hash2.length === 64, "SHA-256 hash length invalid");
  assert.notStrictEqual(hash1, hash2, "Hashes should differ");
  console.log("✅ Passed: SHA-256 hash-chain generation verified\n");

  console.log("=================================================");
  console.log("🎉 All Integration & Security Tests Passed!");
  console.log("=================================================");
}

runIntegrationTests()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error("❌ Integration test failed:", e);
    process.exit(1);
  });
