'use client';

/**
 * Employee query interface with streaming responses
 * Main chat interface for employees to query policy documents
 */

import { useState, useRef, useEffect } from 'react';
import { useChatStream } from '@/lib/chat/use-chat-stream';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { MessageList } from './message-list';
import { SuggestedQueries } from './suggested-queries';
import { Send, StopCircle, Trash2, AlertCircle } from 'lucide-react';

interface QueryInterfaceProps {
  /** Optional initial query to pre-populate */
  initialQuery?: string;
  /** Optional document IDs to restrict search to */
  documentIds?: string[];
}

export function QueryInterface({
  initialQuery = '',
}: QueryInterfaceProps) {
  const [inputValue, setInputValue] = useState(initialQuery);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { messages, isStreaming, error, sendMessage, cancelStream, clearMessages } =
    useChatStream({
      onError: (err) => {
        console.error('Chat error:', err);
      },
      onComplete: (response) => {
        console.log('Chat complete:', response);
      },
    });

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [inputValue]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedQuery = inputValue.trim();
    if (!trimmedQuery || isStreaming) {
      return;
    }

    // Send the message
    await sendMessage(trimmedQuery);

    // Clear input
    setInputValue('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Submit on Enter (without Shift)
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleSuggestedQuery = (query: string) => {
    setInputValue(query);
    textareaRef.current?.focus();
  };

  const handleClearChat = () => {
    if (confirm('Clear all messages? This cannot be undone.')) {
      clearMessages();
      setInputValue('');
    }
  };

  const showSuggestions = messages.length === 0 && !inputValue;

  return (
    <div className="flex flex-col h-full max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div>
          <h1 className="text-2xl font-semibold">Policy Assistant</h1>
          <p className="text-sm text-muted-foreground">
            Ask questions about your workplace policies
          </p>
        </div>
        {messages.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearChat}
            disabled={isStreaming}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Clear
          </Button>
        )}
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Error Alert */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {error.message || 'An error occurred. Please try again.'}
            </AlertDescription>
          </Alert>
        )}

        {/* Suggested Queries (shown when no messages) */}
        {showSuggestions && (
          <SuggestedQueries onSelectQuery={handleSuggestedQuery} />
        )}

        {/* Message List */}
        {messages.length > 0 && <MessageList messages={messages} />}

        {/* Auto-scroll anchor */}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="border-t p-4">
        <form onSubmit={handleSubmit} className="space-y-2">
          <div className="relative">
            <Textarea
              ref={textareaRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask a question about your workplace policies..."
              className="min-h-[60px] max-h-[200px] resize-none pr-12"
              disabled={isStreaming}
              rows={1}
            />
            <div className="absolute bottom-2 right-2">
              {isStreaming ? (
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  onClick={cancelStream}
                  title="Stop generating"
                >
                  <StopCircle className="h-5 w-5" />
                </Button>
              ) : (
                <Button
                  type="submit"
                  size="icon"
                  disabled={!inputValue.trim() || isStreaming}
                  title="Send message"
                >
                  <Send className="h-5 w-5" />
                </Button>
              )}
            </div>
          </div>

          <p className="text-xs text-muted-foreground">
            Press <kbd className="px-1 py-0.5 bg-muted rounded">Enter</kbd> to
            send, <kbd className="px-1 py-0.5 bg-muted rounded">Shift+Enter</kbd>{' '}
            for new line
          </p>
        </form>
      </div>
    </div>
  );
}
