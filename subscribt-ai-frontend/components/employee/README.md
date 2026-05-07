# Employee Components

Employee-facing UI components for querying policy documents with streaming AI responses.

## Components

### `QueryInterface`
Main chat interface for employees to query policy documents.

**Features:**
- Real-time streaming responses from Claude 3.5 Sonnet
- Auto-scrolling message list
- Auto-resizing textarea input
- Keyboard shortcuts (Enter to send, Shift+Enter for new line)
- Clear chat functionality
- Error handling with user-friendly messages

**Usage:**
```tsx
import { QueryInterface } from '@/components/employee';

export default function QueryPage() {
  return <QueryInterface />;
}
```

**Props:**
- `initialQuery?: string` - Pre-populate the input with a query
- `documentIds?: string[]` - Restrict search to specific documents

---

### `MessageList`
Displays a list of chat messages.

**Usage:**
```tsx
import { MessageList } from '@/components/employee';

<MessageList messages={messages} />
```

---

### `MessageBubble`
Individual message bubble with role-based styling and citations.

**Features:**
- User vs Assistant styling
- Streaming indicator
- Error state display
- Citation display
- Metadata (query ID, retrieval count)
- Timestamp

**Usage:**
```tsx
import { MessageBubble } from '@/components/employee';

<MessageBubble message={message} />
```

---

### `CitationList`
Displays source citations with expandable details.

**Features:**
- Expandable/collapsible citation cards
- Snippet preview
- Relevance score visualization
- Page number and section heading
- Hierarchical path display
- Link to view in document (placeholder)

**Usage:**
```tsx
import { CitationList } from '@/components/employee';

<CitationList citations={citations} />
```

---

### `SuggestedQueries`
Welcome screen with example queries to help users get started.

**Features:**
- 6 pre-defined example queries across common categories
- Click to populate input
- Strict grounding guarantee explanation

**Usage:**
```tsx
import { SuggestedQueries } from '@/components/employee';

<SuggestedQueries onSelectQuery={(query) => console.log(query)} />
```

---

## Streaming Architecture

The employee query interface uses the `useChatStream` hook to handle streaming responses from the Lambda Function URL:

1. **User submits query** → `sendMessage()` called
2. **User message added** to message list immediately
3. **Assistant message placeholder** created with `status: 'streaming'`
4. **Stream chunks received** → message content updated in real-time
5. **Citations received** → added to message as they arrive
6. **Stream completes** → message status set to `complete`

### Stream Chunk Types

- `content` - Text tokens from Claude
- `citation` - Source citation with snippet, page number, relevance score
- `metadata` - Query ID, conversation ID, retrieval count
- `error` - Error message from backend

---

## Strict Grounding

All AI responses are grounded in retrieved document chunks. If no relevant information is found, the response will state:

> "Not addressed in the provided policy."

This logic is enforced in the backend prompt layer, not the UI.

---

## Environment Variables

Required:
```bash
NEXT_PUBLIC_CHAT_LAMBDA_FUNCTION_URL=https://your-function-url.lambda-url.us-east-1.on.aws/
```

---

## Keyboard Shortcuts

- `Enter` - Send message
- `Shift + Enter` - New line in input
- `Escape` - Cancel streaming (when focused on stop button)

---

## Accessibility

- Semantic HTML structure
- ARIA labels on interactive elements
- Keyboard navigation support
- Focus management
- Screen reader friendly message announcements

---

## Future Enhancements

- [ ] Document viewer integration (click citation to view in PDF)
- [ ] Export conversation as PDF/Markdown
- [ ] Share conversation link
- [ ] Voice input support
- [ ] Multi-language support
- [ ] Conversation history sidebar
- [ ] Bookmark/favorite queries
- [ ] Feedback mechanism (thumbs up/down on responses)
