/**
 * Chat service client utilities
 * Exports streaming client and React hooks for Lambda Function URL integration
 */

export {
  streamChatQuery,
  sendChatQuery,
  validateChatConfig,
} from './client';

export { useChatStream } from './use-chat-stream';
