# Chat Service Client Utilities

Client-side utilities for streaming chat interactions with the Lambda Function URL backend.

## Overview

This module provides:
- **`streamChatQuery`**: Low-level streaming client for Lambda Function URL
- **`sendChatQuery`**: Simple non-streaming fallback
- **`useChatStream`**: React hook for managing chat state and streaming
- **`validateChatConfig`**: Environment validation helper

## Architecture

The chat service connects directly to a Lambda Function URL (not API Gateway) to enable:
- **Response streaming**: Token-by-token streaming from Claude 3.5 Sonnet
- **No timeout limits**: Bypasses the 29-second API Gateway timeout
- **Chain-of-Thought**: Full CoT reasoning without interruption

## Usage

### React Hook (Recommended)

```tsx
import { useChatStream } from '@/lib/chat';

function ChatInterface() {
  const { messages, isStreaming, error, sendMessage, clearMessages } = useChatStream({
    onComplete: (response) => {
      console.log('Stream complete:', response);
    },
    onError: (err) => {
      console.error('Stream error:', err);
    },
  });

  const handleSubmit = async (query: string) => {
    await sendMessage(query);
  };

  return (
    <div>
      {messages.map((msg) => (
        <div key={msg.id}>
          <strong>{msg.role}:</strong> {msg.content}
          {msg.citations && msg.citations.length > 0 && (
            <div>
              <strong>Citations:</strong>
              {msg.citations.map((citation, i) => (
                <div key={i}>
                  {citation.document_title} (p. {citation.page_number})
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
      {isStreaming && <div>Streaming...</div>}
      {error && <div>Error: {error.message}</div>}
    </div>
  );
}
```

### Low-Level Client

```typescript
import { streamChatQuery, validateChatConfig } from '@/lib/chat';

const functionUrl = validateChatConfig();

await streamChatQuery('What is the vacation policy?', null, {
  functionUrl,
  onChunk: (chunk) => {
    if (chunk.type === 'content') {
      console.log('Token:', chunk.content);
    } else if (chunk.type === 'citation') {
      console.log('Citation:', chunk.citation);
    }
  },
  onComplete: (response) => {
    console.log('Full response:', response.answer);
    console.log('All citations:', response.citations);
  },
  onError: (error) => {
    console.error('Error:', error);
  },
});
```

## Environment Configuration

Set the Lambda Function URL in your environment:

```bash
NEXT_PUBLIC_CHAT_LAMBDA_FUNCTION_URL=https://your-function-url.lambda-url.us-east-1.on.aws/
```

## Stream Format

The Lambda Function URL returns server-sent events in this format:

```
data: {"type": "content", "content": "The"}
data: {"type": "content", "content": " vacation"}
data: {"type": "content", "content": " policy"}
data: {"type": "citation", "citation": {"document_id": "...", "page_number": 5}}
data: {"type": "metadata", "metadata": {"conversation_id": "...", "query_id": "..."}}
data: [DONE]
```

### Chunk Types

- **`content`**: A token from the streaming response
- **`citation`**: A source citation with document reference
- **`metadata`**: Query metadata (conversation ID, query ID, retrieval count)
- **`error`**: An error occurred during processing

## Features

- **Automatic conversation tracking**: Conversation IDs are stored and sent with follow-up queries
- **Abort support**: Cancel in-flight requests with `cancelStream()`
- **Error handling**: Graceful error states with message status tracking
- **Type-safe**: Full TypeScript support with strict types
- **Citation tracking**: Citations are accumulated and attached to messages

## Message Status

Messages have the following status values:
- **`sending`**: User message being sent
- **`streaming`**: Assistant response is streaming
- **`complete`**: Message fully received
- **`error`**: An error occurred

## Best Practices

1. **Always validate config**: Call `validateChatConfig()` before making requests
2. **Handle errors gracefully**: Provide user feedback for network/API errors
3. **Show streaming state**: Display loading indicators during streaming
4. **Display citations**: Always show source citations for transparency
5. **Implement abort**: Allow users to cancel long-running queries
6. **Preserve conversation context**: Use conversation IDs for multi-turn conversations
