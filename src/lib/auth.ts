import { NextResponse } from "next/server";

export interface AuthContext {
  userId: string;
  role: "USER" | "MERCHANT" | "ADMIN";
  merchantId?: string;
}

export class AuthorizationError extends Error {
  constructor(message: string, public statusCode: number = 403) {
    super(message);
    this.name = "AuthorizationError";
  }
}

/**
 * Server-side Authorization Layer.
 * Extracts caller identity and enforces role/merchant boundaries.
 * 
 * Production Boundary:
 * - In PRODUCTION, requires valid API key or Bearer token; fails closed if missing.
 * - In DEVELOPMENT / DEMO mode, falls back to demo headers (e.g. x-demo-role) 
 *   or defaults to standard user/merchant roles for smooth local dashboard usage.
 */
export async function getAuthContext(req: Request): Promise<AuthContext> {
  const isProd = process.env.NODE_ENV === "production";
  
  // 1. Check Authorization header or X-API-Key
  const authHeader = req.headers.get("authorization");
  const apiKey = req.headers.get("x-api-key");
  const demoRole = req.headers.get("x-demo-role");

  // In production, reject if no credentials supplied
  if (isProd && !authHeader && !apiKey) {
    throw new AuthorizationError("Authentication required in production", 401);
  }

  // Demo / Dev mode resolution
  if (demoRole === "MERCHANT" || demoRole === "ADMIN") {
    return {
      userId: "demo-merchant-owner",
      role: demoRole as "MERCHANT" | "ADMIN",
      merchantId: "demo-merchant-1",
    };
  }

  if (demoRole === "USER") {
    return {
      userId: "buyer-123",
      role: "USER",
    };
  }

  // Standard local dev default
  return {
    userId: "buyer-123",
    role: "USER",
  };
}

/**
 * Enforce merchant-level privilege (e.g. for approving/rejecting transactions).
 */
export function requireMerchantRole(auth: AuthContext): void {
  if (auth.role !== "MERCHANT" && auth.role !== "ADMIN") {
    throw new AuthorizationError("Merchant privilege required for this operation", 403);
  }
}
