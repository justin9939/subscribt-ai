# Project Structure

## Top-Level Layout

```
/
├── app/                    # Next.js App Router
├── components/             # Shared and persona-specific UI components
├── lib/                    # Core business logic and integrations
├── types/                  # Shared TypeScript types and interfaces
├── hooks/                  # Custom React hooks
└── utils/                  # General helper functions
```

---

## `app/` — Routing

```
app/
├── (hr)/                   # HR Manager route group
│   └── ...                 # HR-specific pages (dashboard, upload, analytics)
├── (employee)/             # Employee route group
│   └── ...                 # Employee-specific pages (query, rights lookup)
└── api/
    └── upload/             # Handles file upload to S3 (triggers Step Functions via EventBridge)
```

Route groups `(hr)` and `(employee)` enforce persona separation at the routing level. Shared layouts and navigation live at the group root.

**Note**: The chat endpoint is a Lambda Function URL called directly from the frontend, not a Next.js API route.

---

## `components/` — UI

```
components/
├── hr/                     # HR-only components (gap analysis UI, trend charts, upload)
├── employee/               # Employee-only components (query interface, scenario tester)
└── ui/                     # shadcn/ui primitives and shared components
```

- Use shadcn/ui components as the base; extend rather than replace.
- Persona-specific components go in their respective subdirectory — never share HR components into the employee flow or vice versa.

---

## `lib/` — Core Logic

```
lib/
├── ai/                     # Prompts, RAG chain construction, response formatting
├── db/                     # DynamoDB client and query helpers
├── opensearch/             # OpenSearch client, vector upsert, similarity search
└── chat/                   # Client-side utilities for calling the streaming Lambda Function URL
```

- `lib/ai/` owns all prompt templates and the strict grounding logic (the "Not addressed in the provided policy" enforcement).
- `lib/opensearch/` handles vector upsert on ingestion and similarity search at query time.
- `lib/db/` is the only place DynamoDB queries should be written — no inline DB calls in components or API routes.
- `lib/chat/` contains client-side helpers for invoking the streaming Lambda Function URL and handling the response stream.

---

## Conventions

- **Persona separation is structural**: HR and Employee code paths are separated by folder, not just conditionals. A component or route that serves both personas is a red flag.
- **No DB calls outside `lib/db/`**: Centralizes query logic and keeps data access auditable.
- **No AI calls outside `lib/ai/`**: All prompt construction and model calls live here, ensuring grounding rules are applied consistently.
- **Types in `/types`**: Shared interfaces (e.g., `Document`, `QueryResult`, `Citation`) live here, not co-located with components.
- **Server Actions for writes**: Data mutations use Next.js Server Actions defined close to the relevant route, calling into `lib/db/` for the actual query.
- **Chat streaming**: The frontend calls the Lambda Function URL directly (stored in `CHAT_LAMBDA_FUNCTION_URL` env var) and handles the streaming response using utilities in `lib/chat/`.
