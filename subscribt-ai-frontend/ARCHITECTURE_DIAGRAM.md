# Employee Query Interface - Architecture Diagram

## Component Hierarchy

```
app/
└── (employee)/
    ├── layout.tsx
    └── query/
        └── page.tsx
            └── <QueryInterface />
                ├── Header (title + clear button)
                ├── Messages Area
                │   ├── <Alert /> (errors)
                │   ├── <SuggestedQueries /> (when empty)
                │   │   ├── Welcome Card
                │   │   │   ├── 6 Example Query Buttons
                │   │   │   └── Category Labels
                │   │   └── Strict Grounding Info Card
                │   └── <MessageList />
                │       └── <MessageBubble /> (for each message)
                │           ├── Avatar (User/Bot icon)
                │           ├── Message Card
                │           │   ├── Content
                │           │   ├── Streaming Indicator
                │           │   └── Metadata
                │           ├── <CitationList />
                │           │   └── Citation Cards (expandable)
                │           │       ├── Section Heading
                │           │       ├── Page Number
                │           │       ├── Hierarchy Path
                │           │       ├── Snippet (when expanded)
                │           │       └── Relevance Score
                │           └── Timestamp
                └── Input Area
                    ├── <Textarea /> (auto-resize)
                    └── Send/Stop Button
```

## Data Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                         User Interface                          │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ QueryInterface Component                                 │  │
│  │                                                          │  │
│  │  [Input: "What is the PTO policy?"]  [Send Button]     │  │
│  └──────────────────────────────────────────────────────────┘  │
│                            │                                    │
│                            ▼                                    │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ useChatStream Hook                                       │  │
│  │ - Manages messages state                                 │  │
│  │ - Handles streaming lifecycle                            │  │
│  │ - Tracks conversation ID                                 │  │
│  └──────────────────────────────────────────────────────────┘  │
│                            │                                    │
└────────────────────────────┼────────────────────────────────────┘
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Client Utilities                           │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ streamChatQuery (lib/chat/client.ts)                     │  │
│  │ - Creates fetch request                                  │  │
│  │ - Handles AbortController                                │  │
│  │ - Parses SSE stream                                      │  │
│  │ - Invokes callbacks                                      │  │
│  └──────────────────────────────────────────────────────────┘  │
│                            │                                    │
└────────────────────────────┼────────────────────────────────────┘
                             ▼
                    ┌────────────────┐
                    │  HTTP POST     │
                    │  (SSE Stream)  │
                    └────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Lambda Function URL                          │
│              (NEXT_PUBLIC_CHAT_LAMBDA_FUNCTION_URL)             │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ FastAPI + Mangum Handler                                 │  │
│  │ - Receives query + conversation_id                       │  │
│  │ - Retrieves chunks from OpenSearch                       │  │
│  │ - Constructs CoT prompt                                  │  │
│  │ - Streams from Bedrock (Claude 3.5 Sonnet)              │  │
│  │ - Emits SSE chunks                                       │  │
│  └──────────────────────────────────────────────────────────┘  │
│                            │                                    │
└────────────────────────────┼────────────────────────────────────┘
                             ▼
                    ┌────────────────┐
                    │  SSE Stream    │
                    │  (chunks)      │
                    └────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Stream Chunks                              │
│                                                                 │
│  data: {"type":"content","content":"The policy"}                │
│  data: {"type":"content","content":" states that"}              │
│  data: {"type":"citation","citation":{...}}                     │
│  data: {"type":"metadata","metadata":{...}}                     │
│  data: [DONE]                                                   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Client Processing                            │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ streamChatQuery Callbacks                                │  │
│  │                                                          │  │
│  │ onChunk(chunk) → Update message content in real-time    │  │
│  │ onComplete(response) → Mark message as complete         │  │
│  │ onError(error) → Display error to user                  │  │
│  └──────────────────────────────────────────────────────────┘  │
│                            │                                    │
└────────────────────────────┼────────────────────────────────────┘
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                      UI Updates                                 │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ MessageBubble (Assistant)                                │  │
│  │                                                          │  │
│  │  "The policy states that employees are entitled to..."  │  │
│  │                                                          │  │
│  │  ┌────────────────────────────────────────────────────┐ │  │
│  │  │ Citations                                          │ │  │
│  │  │ [1] PTO Policy - Page 5                           │ │  │
│  │  │     "Employees receive 15 days..."                │ │  │
│  │  │     Relevance: 92%                                │ │  │
│  │  └────────────────────────────────────────────────────┘ │  │
│  │                                                          │  │
│  │  Query ID: abc123... | Retrieved 3 sections             │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## State Management

```
useChatStream Hook State:
├── messages: ChatMessage[]
│   └── ChatMessage
│       ├── id: string
│       ├── role: 'user' | 'assistant'
│       ├── content: string (updated incrementally during streaming)
│       ├── citations: Citation[] (added as they arrive)
│       ├── status: 'sending' | 'streaming' | 'complete' | 'error'
│       ├── timestamp: string
│       └── metadata?: { query_id, conversation_id, retrieval_count }
├── isStreaming: boolean
├── error: Error | null
└── conversationIdRef: string | null (for follow-up queries)
```

## Stream Chunk Processing

```
Incoming SSE Line: "data: {...}"
         │
         ▼
    Parse JSON
         │
         ├─→ type: "content"
         │   └─→ Append to message.content
         │
         ├─→ type: "citation"
         │   └─→ Push to message.citations[]
         │
         ├─→ type: "metadata"
         │   ├─→ Set message.metadata
         │   └─→ Store conversation_id for next query
         │
         └─→ type: "error"
             └─→ Set message.status = 'error'
                 Set message.error = chunk.error
```

## Citation Data Structure

```
Citation {
  id: string                    // Unique citation ID
  documentId: string            // Source document
  chunkId: string               // Specific chunk
  snippet: string               // Excerpt from document
  pageNumber: number            // Page in PDF
  sectionHeading: string        // H1/H2/H3 heading
  hierarchyPath: string         // "Policy > Benefits > PTO"
  relevanceScore: number        // 0-1 similarity score
}
```

## Keyboard Shortcuts

```
Input Textarea:
├── Enter → Submit query (if not empty)
├── Shift + Enter → New line
└── Escape → (future: cancel streaming)

Stop Button:
└── Click → cancelStream() → abortController.abort()
```

## Error Handling

```
Error Sources:
├── Network Error
│   └─→ Display: "Connection failed. Please check your internet."
├── Lambda Error (4xx/5xx)
│   └─→ Display: "HTTP {status}: {statusText}"
├── Stream Parse Error
│   └─→ Log to console, continue processing
├── Abort (User Cancelled)
│   └─→ Mark message as incomplete, allow retry
└── Timeout (future)
    └─→ Display: "Request timed out. Please try again."
```

## Performance Optimizations

```
1. Incremental Rendering
   - Messages update in place (no full list re-render)
   - Only the streaming message re-renders on each chunk

2. Ref-based Scrolling
   - messagesEndRef.current.scrollIntoView()
   - No state updates for scroll position

3. Abort Controller
   - Clean cancellation of fetch request
   - Prevents memory leaks

4. Auto-resize Textarea
   - CSS-based (scrollHeight)
   - No debouncing needed (fast enough)

5. Lazy Citation Expansion
   - Citations collapsed by default
   - Expand on demand (reduces initial render)
```

## Security Flow

```
Environment Variable:
NEXT_PUBLIC_CHAT_LAMBDA_FUNCTION_URL
         │
         ▼
    Validated at runtime
    (validateChatConfig)
         │
         ▼
    HTTPS-only Lambda Function URL
         │
         ▼
    IAM-authenticated backend
         │
         ▼
    Bedrock API (AWS-managed)
```

## Accessibility Tree

```
<main role="main">
  <header>
    <h1>Policy Assistant</h1>
    <button aria-label="Clear chat">Clear</button>
  </header>
  
  <div role="log" aria-live="polite" aria-atomic="false">
    <article role="article" aria-label="User message">
      <div role="img" aria-label="User avatar"></div>
      <div>User message content</div>
    </article>
    
    <article role="article" aria-label="Assistant message">
      <div role="img" aria-label="Assistant avatar"></div>
      <div>
        <p>Assistant response</p>
        <section aria-label="Citations">
          <button aria-expanded="false" aria-controls="citation-1">
            Citation 1
          </button>
          <div id="citation-1" hidden>Citation details</div>
        </section>
      </div>
    </article>
  </div>
  
  <form role="form" aria-label="Send message">
    <textarea aria-label="Message input" placeholder="Ask a question..."></textarea>
    <button type="submit" aria-label="Send message">Send</button>
  </form>
</main>
```

---

## Technology Stack Summary

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript (strict mode) |
| Styling | Tailwind CSS v3 |
| Components | shadcn/ui + Radix UI |
| Icons | Lucide React |
| State | React Hooks (useState, useRef, useCallback) |
| Streaming | Fetch API + ReadableStream |
| Backend | Lambda Function URL (Response Streaming) |
| AI | Claude 3.5 Sonnet (via Bedrock) |
| Vector DB | OpenSearch Serverless |
