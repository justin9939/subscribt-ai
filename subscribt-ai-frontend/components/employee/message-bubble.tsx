'use client';

/**
 * Message bubble component
 * Displays individual chat messages with citations
 */

import { ChatMessage } from '@/types/chat';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CitationList } from './citation-list';
import { User, Bot, Loader2, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MessageBubbleProps {
  message: ChatMessage;
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === 'user';
  const isStreaming = message.status === 'streaming';
  const isError = message.status === 'error';

  return (
    <div
      className={cn(
        'flex gap-3',
        isUser ? 'justify-end' : 'justify-start'
      )}
    >
      {/* Avatar */}
      {!isUser && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary flex items-center justify-center">
          <Bot className="h-5 w-5 text-primary-foreground" />
        </div>
      )}

      {/* Message Content */}
      <div className={cn('flex flex-col gap-2 max-w-[80%]', isUser && 'items-end')}>
        {/* Message Bubble */}
        <Card
          className={cn(
            'shadow-sm',
            isUser
              ? 'bg-primary text-primary-foreground'
              : 'bg-card',
            isError && 'border-destructive'
          )}
        >
          <CardContent className="p-4">
            {/* Error State */}
            {isError && (
              <Alert variant="destructive" className="mb-2">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {message.error || 'An error occurred'}
                </AlertDescription>
              </Alert>
            )}

            {/* Message Text */}
            <div className="prose prose-sm max-w-none dark:prose-invert">
              {message.content || (
                <span className="text-muted-foreground italic">
                  No content
                </span>
              )}
            </div>

            {/* Streaming Indicator */}
            {isStreaming && (
              <div className="flex items-center gap-2 mt-2 text-muted-foreground">
                <Loader2 className="h-3 w-3 animate-spin" />
                <span className="text-xs">Generating response...</span>
              </div>
            )}

            {/* Metadata */}
            {message.metadata && (
              <div className="mt-3 pt-3 border-t text-xs text-muted-foreground space-y-1">
                {message.metadata.retrieval_count !== undefined && (
                  <div>
                    Retrieved {message.metadata.retrieval_count} relevant{' '}
                    {message.metadata.retrieval_count === 1 ? 'section' : 'sections'}
                  </div>
                )}
                {message.metadata.query_id && (
                  <div className="font-mono text-[10px]">
                    Query ID: {message.metadata.query_id.slice(0, 8)}...
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Citations */}
        {!isUser && message.citations && message.citations.length > 0 && (
          <CitationList citations={message.citations} />
        )}

        {/* Timestamp */}
        <span className="text-xs text-muted-foreground px-1">
          {new Date(message.timestamp).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </span>
      </div>

      {/* User Avatar */}
      {isUser && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
          <User className="h-5 w-5 text-secondary-foreground" />
        </div>
      )}
    </div>
  );
}
