/**
 * User and persona-related type definitions
 */

/**
 * User profile
 */
export interface User {
  /** Unique user identifier */
  id: string;
  /** User email */
  email: string;
  /** User display name */
  name: string;
  /** Organization identifier */
  organizationId: string;
  /** Account creation timestamp (ISO 8601) */
  createdAt: string;
  /** Last login timestamp (ISO 8601) */
  lastLoginAt?: string;
}

/**
 * Organization information
 */
export interface Organization {
  /** Unique organization identifier */
  id: string;
  /** Organization name */
  name: string;
  /** Number of employees */
  employeeCount?: number;
  /** Number of uploaded documents */
  documentCount?: number;
  /** Account creation timestamp (ISO 8601) */
  createdAt: string;
}

/**
 * Session information
 */
export interface Session {
  /** User information */
  user: User;
  /** Session token */
  token: string;
  /** Session expiration timestamp (ISO 8601) */
  expiresAt: string;
}

/**
 * Anonymized user identifier for query logs
 */
export interface AnonymizedUser {
  /** Hashed user identifier */
  anonymizedId: string;
  /** Organization identifier */
  organizationId: string;
}
