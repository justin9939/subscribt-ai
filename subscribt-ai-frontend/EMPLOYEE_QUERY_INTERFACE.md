# Employee Query Interface - Implementation Guide

## Overview

The employee query interface is a streaming chat application that allows employees to query workplace policy documents using natural language. All responses are grounded in source documents with verifiable citations.

## Architecture

### Component Hierarchy

```
app/(employee)/query/page.tsx
└── QueryInterface
    ├── SuggestedQueries (shown when no messages)
    ├── MessageList
    │   └── MessageBubble (for each message)
    │       └── CitationList (for assistant messages)
    └── Input Area (Textarea + Send/Stop button)
```

### Data Flow

```
User Input
    ↓
useChatStream hook
    ↓
streamChatQuery (lib/chat/client.ts)
    ↓
Lambda Function URL (NEXT_PUBLIC_CHAT_LAMBDA_FUNCTION_URL)
    ↓
Server-Sent Events Stream
    ↓
Stream Chunks (content, citation, metadata, error)
    ↓
Real-time UI Updates
```

## Key Features

### 1. Streaming Responses
- **Real-time token streaming** from Claude 3.5 Sonnet via Lambda Function URL
- **Progressive rendering** of response text as it arrives
- **Streaming indicator** shows generation progress
- **Cancel capability** to abort mid-stream

### 2. Citations
- **Expandable citation cards** with source snippets
- **Page numbers** and section headings for verification
- **Relevance scores** visualized with color-coded progress bars
- **Hierarchical paths** showing document structure
- **View in document** link (placeholder for future PDF viewer integration)

### 3. User Experience
- **Suggested queries** on first load to guide users
- **Auto-scrolling** to latest message
- **Auto-resizing textarea** (60px min, 200px max)
- **Keyboard shortcuts** (Enter to send, Shift+Enter for new line)
- **Clear chat** with confirmation dialog
- **Error handling** with user-friendly messages

### 4. Strict Grounding
- All responses sourced from uploaded policy documents
- If no relevant information found: "Not addressed in the provided policy."
- Citations link every claim to source material

## File Structure

```
subscribt-ai-frontend/
├── app/
│   └── (employee)/
│       ├── layout.tsx              # Employee route group layout
│       └── query/
│           └── page.tsx            # Main query page
├── components/
│   └── employee/
│       ├── query-interface.tsx     # Main chat interface
│       ├── message-list.tsx        # Message list container
│       ├── message-bubble.tsx      # Individual message display
│       ├── citation-list.tsx       # Citation display with expand/collapse
│       ├── suggested-queries.tsx   # Welcome screen with examples
│       ├── index.ts                # Component exports
│       └── README.md               # Component documentation
├── lib/
│   └── chat/
│       ├── client.ts               # Streaming client utilities
│       ├── use-chat-stream.ts      # React hook for chat streaming
│       └── index.ts                # Exports
├── types/
│   ├── chat.ts                     # Chat message and streaming types
│   └── query.ts                    # Citation and query types
└── .env.example                    # Environment variable template
```

## Environment Setup

### Required Environment Variables

Create a `.env.local` file:

```bash
# Lambda Function URL for streaming chat
NEXT_PUBLIC_CHAT_LAMBDA_FUNCTION_URL=https://your-function-url.lambda-url.us-east-1.on.aws/
```

### Why Lambda Function URL?

The chat endpoint uses a **Lambda Function URL with Response Streaming** instead of API Gateway because:

1. **No 29-second timeout** - API Gateway has a hard 29-second limit
2. **True streaming** - Function URLs support `InvokeMode: RESPONSE_STREAM`
3. **Direct invocation** - No gateway overhead
4. **Cost-effective** - No API Gateway charges

## Usage

### Basic Usage

```tsx
import { QueryInterface } from '@/components/employee';

export default function QueryPage() {
  return (
    <div className="h-screen flex flex-col">
      <QueryInterface />
    </div>
  );
}
```

### With Initial Query

```tsx
<QueryInterface initialQuery="What is the remote work policy?" />
```

### With Document Filtering (Future)

```tsx
<QueryInterface documentIds={['doc-123', 'doc-456']} />
```

## Stream Protocol

The Lambda Function URL returns Server-Sent Events (SSE) in this format:

```
data: {"type":"content","content":"The policy states"}
data: {"type":"content","content":" that employees"}
data: {"type":"citation","citation":{...}}
data: {"type":"metadata","metadata":{...}}
data: [DONE]
```

### Chunk Types

| Type | Description | Payload |
|------|-------------|---------|
| `content` | Text token from Claude | `{ content: string }` |
| `citation` | Source citation | `{ citation: Citation }` |
| `metadata` | Query metadata | `{ metadata: { query_id, conversation_id, retrieval_count } }` |
| `error` | Error message | `{ error: string }` |

## Styling

The interface uses:
- **Tailwind CSS** for utility-first styling
- **shadcn/ui** components (Button, Card, Textarea, Alert)
- **Lucide React** icons
- **Dark mode support** via Tailwind's dark mode classes

### Color Coding

- **User messages**: Primary color background
- **Assistant messages**: Card background
- **Error messages**: Destructive variant with red border
- **Streaming indicator**: Animated spinner with muted text
- **Citations**: Primary border accent on left edge

## Accessibility

- ✅ Semantic HTML structure
- ✅ ARIA labels on interactive elements
- ✅ Keyboard navigation (Tab, Enter, Escape)
- ✅ Focus management
- ✅ Screen reader friendly
- ✅ Color contrast compliance (WCAG AA)

## Performance Considerations

### Optimizations

1. **Incremental rendering** - Messages update in place during streaming
2. **Ref-based scrolling** - Auto-scroll uses refs, not state
3. **Abort controller** - Clean cancellation of in-flight requests
4. **Memoization** - Components use React.memo where appropriate (future)

### Bundle Size

- Core components: ~15KB gzipped
- Dependencies: shadcn/ui, Lucide icons
- No heavy dependencies (no Markdown parser, no syntax highlighter yet)

## Testing Checklist

- [ ] Send a query and verify streaming response
- [ ] Verify citations appear and are expandable
- [ ] Test keyboard shortcuts (Enter, Shift+Enter)
- [ ] Test cancel streaming mid-response
- [ ] Test clear chat functionality
- [ ] Test error handling (invalid Function URL)
- [ ] Test suggested queries click-to-populate
- [ ] Test auto-scroll behavior
- [ ] Test textarea auto-resize
- [ ] Test mobile responsiveness

## Future Enhancements

### Short-term
- [ ] Markdown rendering in responses (bold, italic, lists)
- [ ] Code syntax highlighting for policy excerpts
- [ ] Copy message to clipboard
- [ ] Regenerate response

### Medium-term
- [ ] Conversation history sidebar
- [ ] Export conversation as PDF/Markdown
- [ ] Share conversation link
- [ ] Bookmark/favorite queries
- [ ] Document viewer integration (click citation → view PDF)

### Long-term
- [ ] Voice input support
- [ ] Multi-language support
- [ ] Feedback mechanism (thumbs up/down)
- [ ] Follow-up question suggestions
- [ ] Query refinement suggestions

## Troubleshooting

### "NEXT_PUBLIC_CHAT_LAMBDA_FUNCTION_URL is not configured"

**Solution:** Create `.env.local` with the Function URL:
```bash
NEXT_PUBLIC_CHAT_LAMBDA_FUNCTION_URL=https://...
```

### Streaming not working

**Checklist:**
1. Verify Function URL is correct
2. Check Lambda has `InvokeMode: RESPONSE_STREAM` enabled
3. Verify CORS headers on Lambda response
4. Check browser console for network errors

### Citations not appearing

**Possible causes:**
1. Backend not sending `citation` chunks
2. Citation format mismatch (check types)
3. OpenSearch not returning results

### Auto-scroll not working

**Solution:** Ensure `messagesEndRef` is rendered after all messages:
```tsx
<div ref={messagesEndRef} />
```

## Related Documentation

- [Chat Types](/types/chat.ts) - TypeScript interfaces
- [Chat Client](/lib/chat/client.ts) - Streaming utilities
- [useChatStream Hook](/lib/chat/use-chat-stream.ts) - React hook
- [Component README](/components/employee/README.md) - Component docs
- [Tech Stack](/.kiro/steering/tech.md) - Architecture overview

## Support

For issues or questions:
1. Check TypeScript types in `/types/chat.ts` and `/types/query.ts`
2. Review streaming client in `/lib/chat/client.ts`
3. Test with browser DevTools Network tab (look for SSE stream)
4. Check Lambda CloudWatch logs for backend errors
