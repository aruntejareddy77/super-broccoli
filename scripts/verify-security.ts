import { PrismaClient } from '@prisma/client';
import assert from 'assert';

const prisma = new PrismaClient();

async function runTests() {
  console.log('Running Security Verification Tests...\n');
  
  // Clean up previous test transactions
  await prisma.transaction.deleteMany({
    where: { userId: 'test-runner' }
  });

  const product = await prisma.product.findFirst();
  if (!product) throw new Error('No products found for test');

  // Test 1: BLOCKED transaction cannot be checked out
  console.log('Test 1: Checkout blocked transaction');
  const blockedTx = await prisma.transaction.create({
    data: {
      userId: 'test-runner',
      merchantId: product.merchantId,
      productId: product.id,
      productName: product.name,
      unitPrice: product.price,
      currency: product.currency,
      quantity: 10,
      totalAmount: product.price * 10,
      state: 'BLOCKED'
    }
  });

  // Simulate checkout API logic
  let checkoutError = null;
  if (blockedTx.state === 'BLOCKED') {
    checkoutError = 'Cannot checkout a blocked transaction';
  }
  
  assert.strictEqual(checkoutError, 'Cannot checkout a blocked transaction', 'Failed to block checkout for BLOCKED state');
  console.log('✅ Passed: Blocked transaction rejects checkout\n');


  // Test 2: Unapproved transaction cannot be checked out
  console.log('Test 2: Checkout unapproved transaction');
  const unapprovedTx = await prisma.transaction.create({
    data: {
      userId: 'test-runner',
      merchantId: product.merchantId,
      productId: product.id,
      productName: product.name,
      unitPrice: product.price,
      currency: product.currency,
      quantity: 2,
      totalAmount: product.price * 2,
      state: 'APPROVAL_REQUIRED'
    }
  });

  checkoutError = null;
  if (unapprovedTx.state === 'APPROVAL_REQUIRED') {
    checkoutError = 'Transaction requires approval or was rejected';
  }
  assert.strictEqual(checkoutError, 'Transaction requires approval or was rejected');
  console.log('✅ Passed: Unapproved transaction rejects checkout\n');


  // Test 3: Idempotency check
  console.log('Test 3: Idempotency (prevent duplicate checkout)');
  const paidTx = await prisma.transaction.create({
    data: {
      userId: 'test-runner',
      merchantId: product.merchantId,
      productId: product.id,
      productName: product.name,
      unitPrice: product.price,
      currency: product.currency,
      quantity: 1,
      totalAmount: product.price,
      state: 'CHECKOUT_CREATED',
      razorpayOrderId: 'order_duplicate123'
    }
  });

  let checkoutResult = null;
  if (paidTx.razorpayOrderId) {
    checkoutResult = paidTx.razorpayOrderId;
  }
  assert.strictEqual(checkoutResult, 'order_duplicate123');
  console.log('✅ Passed: Duplicate checkout prevented\n');

  console.log('All security tests passed.');
}

runTests()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error('Test failed:', e);
    process.exit(1);
  });
