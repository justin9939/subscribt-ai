'use client';

/**
 * Message list component
 * Displays chat messages with streaming support
 */

import { ChatMessage } from '@/types/chat';
import { MessageBubble } from './message-bubble';

interface MessageListProps {
  messages: ChatMessage[];
}

export function MessageList({ messages }: MessageListProps) {
  return (
    <div className="space-y-6">
      {messages.map((message) => (
        <MessageBubble key={message.id} message={message} />
      ))}
    </div>
  );
}
