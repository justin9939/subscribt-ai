/**
 * Chat interface and streaming-related type definitions
 */

import type { Citation } from './query';

/**
 * Chat message role
 */
export type MessageRole = 'user' | 'assistant' | 'system';

/**
 * Chat message status
 */
export type MessageStatus = 'sending' | 'streaming' | 'complete' | 'error';

/**
 * Chat message
 */
export interface ChatMessage {
  /** Unique message identifier */
  id: string;
  /** Message role */
  role: MessageRole;
  /** Message content */
  content: string;
  /** Citations (for assistant messages) */
  citations?: Citation[];
  /** Message timestamp (ISO 8601) */
  timestamp: string;
  /** Message status */
  status: MessageStatus;
  /** Error message (if status is 'error') */
  error?: string;
  /** Query ID (for assistant messages) */
  queryId?: string;
  /** Response metadata */
  metadata?: {
    conversation_id?: string;
    query_id?: string;
    timestamp?: string;
    retrieval_count?: number;
  };
}

/**
 * Chat session
 */
export interface ChatSession {
  /** Unique session identifier */
  id: string;
  /** User identifier */
  userId: string;
  /** Messages in the session */
  messages: ChatMessage[];
  /** Session creation timestamp (ISO 8601) */
  createdAt: string;
  /** Last updated timestamp (ISO 8601) */
  updatedAt: string;
  /** Session title (optional) */
  title?: string;
}

/**
 * Streaming response handler callbacks
 */
export interface StreamingCallbacks {
  /** Called when a token is received */
  onToken?: (token: string) => void;
  /** Called when a citation is received */
  onCitation?: (citation: Citation) => void;
  /** Called when metadata is received */
  onMetadata?: (metadata: { queryId: string; timestamp: string }) => void;
  /** Called when an error occurs */
  onError?: (error: string) => void;
  /** Called when streaming is complete */
  onComplete?: () => void;
}

/**
 * Chat service configuration
 */
export interface ChatServiceConfig {
  /** Lambda Function URL for chat streaming */
  functionUrl: string;
  /** Request timeout in milliseconds */
  timeout?: number;
  /** Maximum retries on error */
  maxRetries?: number;
}

/**
 * Request to send a chat message
 */
export interface SendMessageRequest {
  /** User message text */
  message: string;
  /** Optional session ID (for conversation continuity) */
  sessionId?: string;
  /** Optional document IDs to restrict search to */
  documentIds?: string[];
}

/**
 * Response from sending a chat message (non-streaming)
 */
export interface SendMessageResponse {
  /** Message ID */
  messageId: string;
  /** Session ID */
  sessionId: string;
  /** Assistant response */
  response: string;
  /** Citations */
  citations: Citation[];
  /** Whether the query was answered */
  isAnswered: boolean;
  /** Timestamp (ISO 8601) */
  timestamp: string;
}

/**
 * Chat UI state
 */
export interface ChatUIState {
  /** Current session */
  session: ChatSession | null;
  /** Whether a message is being sent */
  isSending: boolean;
  /** Whether a response is streaming */
  isStreaming: boolean;
  /** Current error (if any) */
  error: string | null;
  /** Input text */
  inputText: string;
}

/**
 * Suggested query/prompt
 */
export interface SuggestedQuery {
  /** Unique identifier */
  id: string;
  /** Query text */
  text: string;
  /** Category/topic */
  category: string;
  /** Display order */
  order: number;
}

/**
 * Stream chunk types from Lambda Function URL
 */
export type StreamChunkType = 'content' | 'citation' | 'metadata' | 'error';

/**
 * Stream chunk from Lambda Function URL
 */
export interface StreamChunk {
  /** Chunk type */
  type: StreamChunkType;
  /** Content token (for content chunks) */
  content?: string;
  /** Citation (for citation chunks) */
  citation?: Citation;
  /** Metadata (for metadata chunks) */
  metadata?: {
    conversation_id?: string;
    query_id?: string;
    timestamp?: string;
    retrieval_count?: number;
  };
  /** Error message (for error chunks) */
  error?: string;
}

/**
 * Complete chat response (after streaming completes)
 */
export interface ChatResponse {
  /** Full answer text */
  answer: string;
  /** All citations */
  citations: Citation[];
  /** Response metadata */
  metadata?: {
    conversation_id?: string;
    query_id?: string;
    timestamp?: string;
    retrieval_count?: number;
  };
}
