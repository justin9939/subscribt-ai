/**
 * API request/response and error handling type definitions
 */

/**
 * Standard API error response
 */
export interface APIError {
  /** Error code */
  code: string;
  /** Human-readable error message */
  message: string;
  /** Additional error details */
  details?: Record<string, unknown>;
  /** Request ID for debugging */
  requestId?: string;
  /** Timestamp (ISO 8601) */
  timestamp: string;
}

/**
 * Standard API success response wrapper
 */
export interface APIResponse<T> {
  /** Whether the request was successful */
  success: boolean;
  /** Response data */
  data?: T;
  /** Error information (if success is false) */
  error?: APIError;
  /** Request ID for debugging */
  requestId: string;
  /** Timestamp (ISO 8601) */
  timestamp: string;
}

/**
 * Pagination parameters
 */
export interface PaginationParams {
  /** Page size (number of items per page) */
  limit?: number;
  /** Pagination token from previous response */
  nextToken?: string;
}

/**
 * Paginated response wrapper
 */
export interface PaginatedResponse<T> {
  /** Array of items */
  items: T[];
  /** Total count of items */
  totalCount: number;
  /** Next page token (if more items available) */
  nextToken?: string;
  /** Whether there are more items */
  hasMore: boolean;
}

/**
 * Common error codes
 */
export enum ErrorCode {
  // Authentication & Authorization
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  INVALID_TOKEN = 'INVALID_TOKEN',
  
  // Validation
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  INVALID_INPUT = 'INVALID_INPUT',
  MISSING_REQUIRED_FIELD = 'MISSING_REQUIRED_FIELD',
  
  // Document errors
  DOCUMENT_NOT_FOUND = 'DOCUMENT_NOT_FOUND',
  DOCUMENT_TOO_LARGE = 'DOCUMENT_TOO_LARGE',
  INVALID_DOCUMENT_FORMAT = 'INVALID_DOCUMENT_FORMAT',
  DOCUMENT_PROCESSING_FAILED = 'DOCUMENT_PROCESSING_FAILED',
  
  // Query errors
  QUERY_TOO_LONG = 'QUERY_TOO_LONG',
  NO_DOCUMENTS_AVAILABLE = 'NO_DOCUMENTS_AVAILABLE',
  QUERY_PROCESSING_FAILED = 'QUERY_PROCESSING_FAILED',
  
  // System errors
  INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
  TIMEOUT = 'TIMEOUT',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  
  // Resource errors
  RESOURCE_NOT_FOUND = 'RESOURCE_NOT_FOUND',
  RESOURCE_ALREADY_EXISTS = 'RESOURCE_ALREADY_EXISTS',
  RESOURCE_CONFLICT = 'RESOURCE_CONFLICT',
}

/**
 * HTTP status codes
 */
export enum HTTPStatus {
  OK = 200,
  CREATED = 201,
  NO_CONTENT = 204,
  BAD_REQUEST = 400,
  UNAUTHORIZED = 401,
  FORBIDDEN = 403,
  NOT_FOUND = 404,
  CONFLICT = 409,
  PAYLOAD_TOO_LARGE = 413,
  TOO_MANY_REQUESTS = 429,
  INTERNAL_SERVER_ERROR = 500,
  SERVICE_UNAVAILABLE = 503,
  GATEWAY_TIMEOUT = 504,
}

/**
 * Request metadata for logging and tracing
 */
export interface RequestMetadata {
  /** Unique request identifier */
  requestId: string;
  /** User identifier */
  userId?: string;
  /** Organization identifier */
  organizationId?: string;
  /** Timestamp (ISO 8601) */
  timestamp: string;
  /** User agent */
  userAgent?: string;
  /** Client IP address (anonymized) */
  clientIp?: string;
}

/**
 * Health check response
 */
export interface HealthCheckResponse {
  /** Service status */
  status: 'healthy' | 'degraded' | 'unhealthy';
  /** Service version */
  version: string;
  /** Timestamp (ISO 8601) */
  timestamp: string;
  /** Component health statuses */
  components?: {
    database?: 'healthy' | 'unhealthy';
    vectorStore?: 'healthy' | 'unhealthy';
    bedrock?: 'healthy' | 'unhealthy';
    s3?: 'healthy' | 'unhealthy';
  };
}
