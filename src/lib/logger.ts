export interface LogContext {
  requestId?: string;
  transactionId?: string;
  merchantId?: string;
  userId?: string;
  event?: string;
  status?: number | string;
  durationMs?: number;
  error?: string;
  [key: string]: unknown;
}

/**
 * Lightweight structured logger that avoids logging secrets or sensitive payment data.
 */
export const logger = {
  info(message: string, context?: LogContext) {
    console.log(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        level: "INFO",
        message,
        ...sanitizeContext(context),
      })
    );
  },

  warn(message: string, context?: LogContext) {
    console.warn(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        level: "WARN",
        message,
        ...sanitizeContext(context),
      })
    );
  },

  error(message: string, context?: LogContext) {
    console.error(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        level: "ERROR",
        message,
        ...sanitizeContext(context),
      })
    );
  },
};

/**
 * Ensure secrets and sensitive payload data are never printed to logs.
 */
function sanitizeContext(context?: LogContext): LogContext | undefined {
  if (!context) return undefined;
  const sanitized = { ...context };
  
  const sensitiveKeys = [
    "secret",
    "key",
    "password",
    "signature",
    "razorpay_secret",
    "razorpay_signature",
    "authorization",
  ];

  for (const k of Object.keys(sanitized)) {
    if (sensitiveKeys.some((s) => k.toLowerCase().includes(s))) {
      sanitized[k] = "[REDACTED]";
    }
  }

  return sanitized;
}
