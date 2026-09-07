import { z } from "zod";

export const CreateTransactionSchema = z.object({
  product_id: z.string().min(1, "Product ID is required"),
  quantity: z.number().int().min(1, "Quantity must be at least 1"),
  // Optional: additional cart items for multi-item checkout
  cart_items: z.array(z.object({
    product_id: z.string().min(1),
    quantity: z.number().int().min(1),
  })).optional(),
});

export const PolicyEvaluationSchema = z.object({
  transaction_id: z.string().min(1, "Transaction ID is required"),
});

export const CheckoutSchema = z.object({
  transaction_id: z.string().min(1, "Transaction ID is required"),
});

export const PaymentVerifySchema = z.object({
  transaction_id: z.string().min(1, "Transaction ID is required"),
  razorpay_order_id: z.string().min(1, "Razorpay Order ID is required"),
  razorpay_payment_id: z.string().min(1, "Razorpay Payment ID is required"),
  razorpay_signature: z.string().min(1, "Razorpay Signature is required"),
});

export const AgentPromptSchema = z.object({
  prompt: z.string().min(1, "Prompt is required"),
  catalog: z.array(z.record(z.string(), z.unknown())).min(1, "Catalog is required"),
  conversationHistory: z.array(z.object({
    role: z.enum(["user", "agent"]),
    content: z.string(),
    productsMentioned: z.array(z.string()).optional(),
    recommendedProductIds: z.array(z.string()).optional(),
    action: z.string().optional(),
  })).optional(),
  contextState: z.record(z.string(), z.unknown()).nullish(),
  cartItems: z.array(z.object({
    productId: z.string(),
    name: z.string().optional(),
    category: z.string().optional(),
    price: z.number().optional(),
    quantity: z.number().optional(),
  })).optional(),
});
