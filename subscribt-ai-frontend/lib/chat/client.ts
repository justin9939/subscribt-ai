/**
 * Chat service client utilities
 * Handles streaming responses from Lambda Function URL
 */

import { ChatResponse, StreamChunk } from '@/types/chat';

/**
 * Configuration for chat streaming
 */
interface ChatStreamConfig {
  functionUrl: string;
  onChunk?: (chunk: StreamChunk) => void;
  onComplete?: (response: ChatResponse) => void;
  onError?: (error: Error) => void;
  signal?: AbortSignal;
}

/**
 * Send a chat query and handle streaming response
 */
export async function streamChatQuery(
  query: string,
  conversationId: string | null,
  config: ChatStreamConfig
): Promise<void> {
  const { functionUrl, onChunk, onComplete, onError, signal } = config;

  try {
    const response = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query,
        conversation_id: conversationId,
      }),
      signal,
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    if (!response.body) {
      throw new Error('Response body is null');
    }

    // Process the streaming response
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let fullResponse = '';
    let citations: ChatResponse['citations'] = [];
    let metadata: ChatResponse['metadata'] | undefined;

    while (true) {
      const { done, value } = await reader.read();

      if (done) {
        break;
      }

      // Decode the chunk and add to buffer
      buffer += decoder.decode(value, { stream: true });

      // Process complete lines (server-sent events format)
      const lines = buffer.split('\n');
      buffer = lines.pop() || ''; // Keep incomplete line in buffer

      for (const line of lines) {
        if (!line.trim() || line.startsWith(':')) {
          // Skip empty lines and comments
          continue;
        }

        if (line.startsWith('data: ')) {
          const data = line.slice(6); // Remove 'data: ' prefix

          if (data === '[DONE]') {
            // Stream complete
            continue;
          }

          try {
            const chunk: StreamChunk = JSON.parse(data);

            // Handle different chunk types
            switch (chunk.type) {
              case 'content':
                fullResponse += chunk.content;
                onChunk?.(chunk);
                break;

              case 'citation':
                if (chunk.citation) {
                  citations.push(chunk.citation);
                  onChunk?.(chunk);
                }
                break;

              case 'metadata':
                metadata = chunk.metadata;
                onChunk?.(chunk);
                break;

              case 'error':
                throw new Error(chunk.error || 'Unknown error from server');

              default:
                console.warn('Unknown chunk type:', chunk);
            }
          } catch (parseError) {
            console.error('Failed to parse chunk:', data, parseError);
          }
        }
      }
    }

    // Call completion handler with full response
    if (onComplete) {
      onComplete({
        answer: fullResponse,
        citations,
        metadata,
      });
    }
  } catch (error) {
    if (error instanceof Error) {
      onError?.(error);
    } else {
      onError?.(new Error('Unknown error occurred'));
    }
  }
}

/**
 * Simple non-streaming chat query (fallback)
 */
export async function sendChatQuery(
  query: string,
  conversationId: string | null,
  functionUrl: string,
  signal?: AbortSignal
): Promise<ChatResponse> {
  const response = await fetch(functionUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      query,
      conversation_id: conversationId,
    }),
    signal,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`HTTP ${response.status}: ${errorText}`);
  }

  return response.json();
}

/**
 * Validate that the function URL is configured
 */
export function validateChatConfig(): string {
  const functionUrl = process.env.NEXT_PUBLIC_CHAT_LAMBDA_FUNCTION_URL;

  if (!functionUrl) {
    throw new Error(
      'NEXT_PUBLIC_CHAT_LAMBDA_FUNCTION_URL is not configured'
    );
  }

  return functionUrl;
}
