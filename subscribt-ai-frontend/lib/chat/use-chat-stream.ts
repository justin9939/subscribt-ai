/**
 * React hook for streaming chat interactions
 */

import { useState, useCallback, useRef } from 'react';
import { ChatMessage, ChatResponse, StreamChunk } from '@/types/chat';
import { streamChatQuery, validateChatConfig } from './client';

interface UseChatStreamOptions {
  onError?: (error: Error) => void;
  onComplete?: (response: ChatResponse) => void;
}

interface UseChatStreamReturn {
  messages: ChatMessage[];
  isStreaming: boolean;
  error: Error | null;
  sendMessage: (query: string) => Promise<void>;
  cancelStream: () => void;
  clearMessages: () => void;
}

/**
 * Hook for managing streaming chat interactions
 */
export function useChatStream(
  options: UseChatStreamOptions = {}
): UseChatStreamReturn {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const conversationIdRef = useRef<string | null>(null);

  const sendMessage = useCallback(
    async (query: string) => {
      if (isStreaming) {
        console.warn('Already streaming, ignoring new message');
        return;
      }

      setError(null);
      setIsStreaming(true);

      // Add user message immediately
      const userMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'user',
        content: query,
        timestamp: new Date().toISOString(),
        status: 'complete',
      };

      setMessages((prev) => [...prev, userMessage]);

      // Prepare assistant message placeholder
      const assistantMessageId = crypto.randomUUID();
      const assistantMessage: ChatMessage = {
        id: assistantMessageId,
        role: 'assistant',
        content: '',
        timestamp: new Date().toISOString(),
        citations: [],
        status: 'streaming',
      };

      setMessages((prev) => [...prev, assistantMessage]);

      // Create abort controller for this request
      abortControllerRef.current = new AbortController();

      try {
        const functionUrl = validateChatConfig();

        await streamChatQuery(query, conversationIdRef.current, {
          functionUrl,
          signal: abortControllerRef.current.signal,
          onChunk: (chunk: StreamChunk) => {
            setMessages((prev) => {
              const updated = [...prev];
              const lastMessage = updated[updated.length - 1];

              if (lastMessage && lastMessage.id === assistantMessageId) {
                if (chunk.type === 'content') {
                  lastMessage.content += chunk.content;
                } else if (chunk.type === 'citation' && chunk.citation) {
                  lastMessage.citations = [
                    ...(lastMessage.citations || []),
                    chunk.citation,
                  ];
                } else if (chunk.type === 'metadata' && chunk.metadata) {
                  lastMessage.metadata = chunk.metadata;
                  // Store conversation ID for follow-up queries
                  if (chunk.metadata.conversation_id) {
                    conversationIdRef.current = chunk.metadata.conversation_id;
                  }
                }
              }

              return updated;
            });
          },
          onComplete: (response: ChatResponse) => {
            // Mark message as complete
            setMessages((prev) => {
              const updated = [...prev];
              const lastMessage = updated[updated.length - 1];
              if (lastMessage && lastMessage.id === assistantMessageId) {
                lastMessage.status = 'complete';
              }
              return updated;
            });
            setIsStreaming(false);
            options.onComplete?.(response);
          },
          onError: (err: Error) => {
            setError(err);
            setIsStreaming(false);
            options.onError?.(err);

            // Mark message as error
            setMessages((prev) => {
              const updated = [...prev];
              const lastMessage = updated[updated.length - 1];
              if (lastMessage && lastMessage.id === assistantMessageId) {
                lastMessage.status = 'error';
                lastMessage.error = err.message;
              }
              return updated;
            });
          },
        });
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Unknown error');
        setError(error);
        setIsStreaming(false);
        options.onError?.(error);

        // Mark message as error
        setMessages((prev) => {
          const updated = [...prev];
          const lastMessage = updated[updated.length - 1];
          if (lastMessage && lastMessage.id === assistantMessageId) {
            lastMessage.status = 'error';
            lastMessage.error = error.message;
          }
          return updated;
        });
      }
    },
    [isStreaming, options]
  );

  const cancelStream = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setIsStreaming(false);
    }
  }, []);

  const clearMessages = useCallback(() => {
    setMessages([]);
    conversationIdRef.current = null;
    setError(null);
  }, []);

  return {
    messages,
    isStreaming,
    error,
    sendMessage,
    cancelStream,
    clearMessages,
  };
}
