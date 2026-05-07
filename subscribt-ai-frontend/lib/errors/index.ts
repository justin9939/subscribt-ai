/**
 * Error handling exports
 */

export {
  AppError,
  parseAPIError,
  getUserFriendlyMessage,
  isRetryableError,
  isAuthError,
  logError,
  normalizeError,
} from './error-handler';

export { ErrorCode, HTTPStatus } from '@/types/api';
