/**
 * Error handling components - centralized exports
 */

// Error boundaries
export { ErrorBoundary, MinimalErrorFallback } from '../error-boundary';
export {
  NetworkErrorBoundary,
  useNetworkStatus,
  NetworkStatusIndicator,
} from '../network-error-boundary';

// Error display components
export {
  ErrorMessage,
  FieldError,
  ErrorEmptyState,
} from '../error-message';

export {
  ErrorRetry,
  InlineErrorRetry,
} from '../error-retry';

export {
  LoadingErrorState,
  LoadingSpinner,
  InlineLoadingSpinner,
} from '../loading-error-state';

// Provider
export { ErrorProvider } from '../providers/error-provider';

// Re-export error utilities
export {
  AppError,
  parseAPIError,
  getUserFriendlyMessage,
  isRetryableError,
  isAuthError,
  logError,
  normalizeError,
} from '@/lib/errors';

// Re-export hooks
export { useErrorHandler, useAsyncError } from '@/hooks/use-error-handler';

// Re-export types and enums
export { ErrorCode, HTTPStatus } from '@/types/api';
