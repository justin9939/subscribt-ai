/**
 * Central export file for all TypeScript type definitions
 * 
 * This file re-exports all types from individual type modules,
 * providing a single import point for the entire application.
 * 
 * Usage:
 *   import type { Document, QueryRequest, Citation } from '@/types';
 */

// Document types
export type {
  DocumentStatus,
  Document,
  DocumentChunk,
  DocumentUploadRequest,
  DocumentUploadResponse,
  DocumentDeleteRequest,
  DocumentDeleteResponse,
  DocumentListFilter,
  DocumentListResponse,
} from './document';

// Query and RAG types
export type {
  Citation,
  QueryRequest,
  QueryResponse,
  StreamChunk,
  QueryLog,
  RetrievedChunk,
  RAGContext,
} from './query';

// Analytics types
export type {
  TimePeriod,
  QueryStats,
  TopicFrequency,
  TrendData,
  TimeSeriesDataPoint,
  GapAnalysisEntry,
  MarkGapAddressedRequest,
  MarkGapAddressedResponse,
  AnalyticsFilter,
  AnalyticsDashboardData,
  DocumentStatistics,
} from './analytics';

// User types
export type {
  Persona,
  User,
  Organization,
  Session,
  AnonymizedUser,
} from './user';

// API types
export type {
  APIError,
  APIResponse,
  PaginationParams,
  PaginatedResponse,
  RequestMetadata,
  HealthCheckResponse,
} from './api';

export { ErrorCode, HTTPStatus } from './api';

// Chat types
export type {
  MessageRole,
  MessageStatus,
  ChatMessage,
  ChatSession,
  StreamingCallbacks,
  ChatServiceConfig,
  SendMessageRequest,
  SendMessageResponse,
  ChatUIState,
  SuggestedQuery,
} from './chat';

// UI types
export type {
  ToastType,
  Toast,
  LoadingState,
  ModalState,
  TableSort,
  TableFilter,
  TableState,
  FileUploadState,
  NavItem,
  BreadcrumbItem,
  ChartDataPoint,
  ChartConfig,
  EmptyState,
  FieldError,
  FormState,
} from './ui';

// Type guards and utilities
export {
  isDocumentStatus,
  isDocument,
  isCitation,
  isQueryResponse,
  isStreamChunk,
  isPersona,
  isMessageRole,
  isAPIError,
  isValidTimestamp,
  isValidUUID,
  isValidEmail,
  assertType,
  parseJSON,
  isArrayOf,
  isNonEmptyString,
  isPositiveNumber,
  isInRange,
} from './guards';
