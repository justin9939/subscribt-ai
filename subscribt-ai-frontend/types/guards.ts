/**
 * Type guards and utility functions for runtime type checking
 * 
 * These functions provide runtime validation to complement TypeScript's
 * compile-time type checking, especially useful when dealing with
 * external data sources (API responses, user input, etc.)
 */

import type {
  Document,
  DocumentStatus,
  Citation,
  QueryResponse,
  StreamChunk,
  Persona,
  APIError,
  MessageRole,
} from './index';

/**
 * Type guard for DocumentStatus
 */
export function isDocumentStatus(value: unknown): value is DocumentStatus {
  return (
    typeof value === 'string' &&
    ['uploading', 'processing', 'ready', 'failed'].includes(value)
  );
}

/**
 * Type guard for Document
 */
export function isDocument(value: unknown): value is Document {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const obj = value as Record<string, unknown>;

  return (
    typeof obj.id === 'string' &&
    typeof obj.filename === 'string' &&
    typeof obj.uploadedAt === 'string' &&
    typeof obj.uploadedBy === 'string' &&
    isDocumentStatus(obj.status) &&
    typeof obj.s3Key === 'string' &&
    typeof obj.fileSize === 'number' &&
    typeof obj.updatedAt === 'string'
  );
}

/**
 * Type guard for Citation
 */
export function isCitation(value: unknown): value is Citation {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const obj = value as Record<string, unknown>;

  return (
    typeof obj.id === 'string' &&
    typeof obj.documentId === 'string' &&
    typeof obj.chunkId === 'string' &&
    typeof obj.snippet === 'string' &&
    typeof obj.pageNumber === 'number' &&
    typeof obj.sectionHeading === 'string' &&
    typeof obj.hierarchyPath === 'string' &&
    typeof obj.relevanceScore === 'number'
  );
}

/**
 * Type guard for QueryResponse
 */
export function isQueryResponse(value: unknown): value is QueryResponse {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const obj = value as Record<string, unknown>;

  return (
    typeof obj.queryId === 'string' &&
    typeof obj.response === 'string' &&
    Array.isArray(obj.citations) &&
    obj.citations.every(isCitation) &&
    typeof obj.isAnswered === 'boolean' &&
    typeof obj.timestamp === 'string' &&
    typeof obj.processingTimeMs === 'number'
  );
}

/**
 * Type guard for StreamChunk
 */
export function isStreamChunk(value: unknown): value is StreamChunk {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const obj = value as Record<string, unknown>;

  if (typeof obj.type !== 'string') {
    return false;
  }

  switch (obj.type) {
    case 'token':
      return typeof obj.token === 'string';
    case 'citation':
      return isCitation(obj.citation);
    case 'metadata':
      return (
        typeof obj.metadata === 'object' &&
        obj.metadata !== null &&
        typeof (obj.metadata as Record<string, unknown>).queryId === 'string' &&
        typeof (obj.metadata as Record<string, unknown>).timestamp === 'string'
      );
    case 'error':
      return typeof obj.error === 'string';
    case 'done':
      return true;
    default:
      return false;
  }
}

/**
 * Type guard for Persona
 */
export function isPersona(value: unknown): value is Persona {
  return value === 'hr_manager' || value === 'employee';
}

/**
 * Type guard for MessageRole
 */
export function isMessageRole(value: unknown): value is MessageRole {
  return (
    typeof value === 'string' &&
    ['user', 'assistant', 'system'].includes(value)
  );
}

/**
 * Type guard for APIError
 */
export function isAPIError(value: unknown): value is APIError {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const obj = value as Record<string, unknown>;

  return (
    typeof obj.code === 'string' &&
    typeof obj.message === 'string' &&
    typeof obj.timestamp === 'string'
  );
}

/**
 * Validates ISO 8601 timestamp string
 */
export function isValidTimestamp(value: unknown): value is string {
  if (typeof value !== 'string') {
    return false;
  }

  const date = new Date(value);
  return !isNaN(date.getTime());
}

/**
 * Validates UUID string format
 */
export function isValidUUID(value: unknown): value is string {
  if (typeof value !== 'string') {
    return false;
  }

  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(value);
}

/**
 * Validates email format
 */
export function isValidEmail(value: unknown): value is string {
  if (typeof value !== 'string') {
    return false;
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(value);
}

/**
 * Type assertion helper that throws if validation fails
 */
export function assertType<T>(
  value: unknown,
  guard: (value: unknown) => value is T,
  errorMessage: string
): asserts value is T {
  if (!guard(value)) {
    throw new TypeError(errorMessage);
  }
}

/**
 * Safe JSON parse with type validation
 */
export function parseJSON<T>(
  json: string,
  guard: (value: unknown) => value is T
): T | null {
  try {
    const parsed = JSON.parse(json);
    return guard(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

/**
 * Array type guard helper
 */
export function isArrayOf<T>(
  value: unknown,
  guard: (item: unknown) => item is T
): value is T[] {
  return Array.isArray(value) && value.every(guard);
}

/**
 * Validates that a value is a non-empty string
 */
export function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

/**
 * Validates that a value is a positive number
 */
export function isPositiveNumber(value: unknown): value is number {
  return typeof value === 'number' && value > 0 && !isNaN(value);
}

/**
 * Validates that a value is within a numeric range
 */
export function isInRange(
  value: unknown,
  min: number,
  max: number
): value is number {
  return typeof value === 'number' && value >= min && value <= max;
}
