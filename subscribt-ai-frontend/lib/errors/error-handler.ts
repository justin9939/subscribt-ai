/**
 * Centralized error handling utilities
 */

import { APIError, ErrorCode, HTTPStatus } from '@/types/api';

/**
 * Custom error class for application errors
 */
export class AppError extends Error {
  constructor(
    public code: ErrorCode,
    message: string,
    public statusCode: HTTPStatus = HTTPStatus.INTERNAL_SERVER_ERROR,
    public details?: Record<string, unknown>,
    public requestId?: string
  ) {
    super(message);
    this.name = 'AppError';
    Object.setPrototypeOf(this, AppError.prototype);
  }

  toJSON(): APIError {
    return {
      code: this.code,
      message: this.message,
      details: this.details,
      requestId: this.requestId,
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * Parse API error from response
 */
export async function parseAPIError(response: Response): Promise<AppError> {
  let errorData: APIError | null = null;

  try {
    const contentType = response.headers.get('content-type');
    if (contentType?.includes('application/json')) {
      const json = await response.json();
      errorData = json.error || json;
    }
  } catch {
    // Failed to parse JSON, use default error
  }

  const code = errorData?.code || mapStatusToErrorCode(response.status);
  const message = errorData?.message || getDefaultErrorMessage(response.status);

  return new AppError(
    code as ErrorCode,
    message,
    response.status as HTTPStatus,
    errorData?.details,
    errorData?.requestId
  );
}

/**
 * Map HTTP status to error code
 */
function mapStatusToErrorCode(status: number): ErrorCode {
  switch (status) {
    case HTTPStatus.UNAUTHORIZED:
      return ErrorCode.UNAUTHORIZED;
    case HTTPStatus.FORBIDDEN:
      return ErrorCode.FORBIDDEN;
    case HTTPStatus.NOT_FOUND:
      return ErrorCode.RESOURCE_NOT_FOUND;
    case HTTPStatus.CONFLICT:
      return ErrorCode.RESOURCE_CONFLICT;
    case HTTPStatus.PAYLOAD_TOO_LARGE:
      return ErrorCode.DOCUMENT_TOO_LARGE;
    case HTTPStatus.TOO_MANY_REQUESTS:
      return ErrorCode.RATE_LIMIT_EXCEEDED;
    case HTTPStatus.SERVICE_UNAVAILABLE:
      return ErrorCode.SERVICE_UNAVAILABLE;
    case HTTPStatus.GATEWAY_TIMEOUT:
      return ErrorCode.TIMEOUT;
    case HTTPStatus.BAD_REQUEST:
      return ErrorCode.VALIDATION_ERROR;
    default:
      return ErrorCode.INTERNAL_SERVER_ERROR;
  }
}

/**
 * Get default error message for HTTP status
 */
function getDefaultErrorMessage(status: number): string {
  switch (status) {
    case HTTPStatus.UNAUTHORIZED:
      return 'You are not authorized to perform this action.';
    case HTTPStatus.FORBIDDEN:
      return 'Access to this resource is forbidden.';
    case HTTPStatus.NOT_FOUND:
      return 'The requested resource was not found.';
    case HTTPStatus.CONFLICT:
      return 'A conflict occurred with the current state of the resource.';
    case HTTPStatus.PAYLOAD_TOO_LARGE:
      return 'The uploaded file is too large.';
    case HTTPStatus.TOO_MANY_REQUESTS:
      return 'Too many requests. Please try again later.';
    case HTTPStatus.SERVICE_UNAVAILABLE:
      return 'The service is temporarily unavailable. Please try again later.';
    case HTTPStatus.GATEWAY_TIMEOUT:
      return 'The request timed out. Please try again.';
    case HTTPStatus.BAD_REQUEST:
      return 'The request was invalid. Please check your input.';
    default:
      return 'An unexpected error occurred. Please try again.';
  }
}

/**
 * Get user-friendly error message
 */
export function getUserFriendlyMessage(error: Error | AppError): string {
  if (error instanceof AppError) {
    return error.message;
  }

  // Handle network errors
  if (error.message.includes('fetch') || error.message.includes('network')) {
    return 'Network error. Please check your connection and try again.';
  }

  // Handle abort errors
  if (error.name === 'AbortError') {
    return 'Request was cancelled.';
  }

  // Default fallback
  return 'An unexpected error occurred. Please try again.';
}

/**
 * Check if error is retryable
 */
export function isRetryableError(error: Error | AppError): boolean {
  if (error instanceof AppError) {
    return [
      ErrorCode.TIMEOUT,
      ErrorCode.SERVICE_UNAVAILABLE,
      ErrorCode.RATE_LIMIT_EXCEEDED,
    ].includes(error.code);
  }

  // Network errors are retryable
  return error.message.includes('fetch') || error.message.includes('network');
}

/**
 * Check if error requires authentication
 */
export function isAuthError(error: Error | AppError): boolean {
  if (error instanceof AppError) {
    return [
      ErrorCode.UNAUTHORIZED,
      ErrorCode.INVALID_TOKEN,
    ].includes(error.code);
  }
  return false;
}

/**
 * Log error to monitoring service
 */
export function logError(
  error: Error | AppError,
  context?: Record<string, unknown>
): void {
  // In production, this would send to CloudWatch or similar
  console.error('[Error]', {
    error: error instanceof AppError ? error.toJSON() : {
      name: error.name,
      message: error.message,
      stack: error.stack,
    },
    context,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Create error from unknown value
 */
export function normalizeError(error: unknown): Error {
  if (error instanceof Error) {
    return error;
  }

  if (typeof error === 'string') {
    return new Error(error);
  }

  if (error && typeof error === 'object' && 'message' in error) {
    return new Error(String(error.message));
  }

  return new Error('An unknown error occurred');
}
