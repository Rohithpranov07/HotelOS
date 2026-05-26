export type ErrorCode =
  | 'AUTH_REQUIRED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'VALIDATION_ERROR'
  | 'RATE_LIMITED'
  | 'OTP_EXPIRED'
  | 'OTP_INVALID'
  | 'OTP_MAX_ATTEMPTS'
  | 'TOKEN_INVALID'
  | 'RESERVATION_NOT_ACTIVE'
  | 'KITCHEN_CLOSED'
  | 'KEY_NOT_ACTIVE'
  | 'PAYMENT_FAILED'
  | 'LOYALTY_INSUFFICIENT'
  | 'CONCIERGE_UNAVAILABLE'
  | 'INTERNAL_ERROR';

export class AppError extends Error {
  public readonly code: ErrorCode;
  public readonly statusCode: number;
  public readonly details?: unknown;

  constructor(code: ErrorCode, message: string, statusCode = 400, details?: unknown) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
  }

  toJSON() {
    return {
      error: {
        code: this.code,
        message: this.message,
        ...(this.details !== undefined ? { details: this.details } : {}),
      },
    };
  }
}
