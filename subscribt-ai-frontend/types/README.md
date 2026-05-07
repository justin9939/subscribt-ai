# TypeScript Type Definitions

This directory contains all shared TypeScript type definitions for the Subscribt AI frontend application.

## Structure

- **`document.ts`** - Document upload, processing, and management types
- **`query.ts`** - Query, RAG, and citation types
- **`analytics.ts`** - Analytics, trend data, and gap analysis types
- **`user.ts`** - User, persona, and organization types
- **`api.ts`** - API request/response, error handling, and pagination types
- **`chat.ts`** - Chat interface and streaming types
- **`ui.ts`** - UI component and state management types
- **`index.ts`** - Central export file for all types

## Usage

Import types from the central index file:

```typescript
import type { Document, QueryRequest, Citation } from '@/types';
```

Or import from specific modules:

```typescript
import type { Document } from '@/types/document';
import type { QueryRequest } from '@/types/query';
```

## Conventions

### Naming

- **Interfaces**: Use PascalCase (e.g., `Document`, `QueryRequest`)
- **Type aliases**: Use PascalCase (e.g., `DocumentStatus`, `Persona`)
- **Enums**: Use PascalCase with UPPER_CASE values (e.g., `ErrorCode.UNAUTHORIZED`)

### Documentation

All types include JSDoc comments describing their purpose and fields. Use these comments to understand the type's role in the system.

### Strict Mode

The project uses TypeScript strict mode. All types must:
- Avoid `any` (use `unknown` if type is truly unknown)
- Explicitly define optional fields with `?`
- Use `null` or `undefined` explicitly when a value may be absent
- Include proper type guards for discriminated unions

### Request/Response Patterns

API request and response types follow these conventions:

- **Request types**: Suffix with `Request` (e.g., `DocumentUploadRequest`)
- **Response types**: Suffix with `Response` (e.g., `DocumentUploadResponse`)
- **List responses**: Use `PaginatedResponse<T>` wrapper for paginated data
- **Standard responses**: Use `APIResponse<T>` wrapper for consistent error handling

### Timestamps

All timestamps use ISO 8601 format strings (e.g., `"2024-01-15T10:30:00Z"`).

### IDs

All identifiers are strings (UUIDs or similar) for consistency across the system.

## Type Safety Guidelines

### Avoid Type Assertions

Prefer type guards over type assertions:

```typescript
// ❌ Bad
const doc = data as Document;

// ✅ Good
function isDocument(data: unknown): data is Document {
  return (
    typeof data === 'object' &&
    data !== null &&
    'id' in data &&
    'filename' in data
  );
}

if (isDocument(data)) {
  // data is now typed as Document
}
```

### Use Discriminated Unions

For types with multiple variants, use discriminated unions:

```typescript
type StreamChunk =
  | { type: 'token'; token: string }
  | { type: 'citation'; citation: Citation }
  | { type: 'error'; error: string };

function handleChunk(chunk: StreamChunk) {
  switch (chunk.type) {
    case 'token':
      // chunk.token is available
      break;
    case 'citation':
      // chunk.citation is available
      break;
    case 'error':
      // chunk.error is available
      break;
  }
}
```

### Readonly Arrays

Use `readonly` for arrays that should not be mutated:

```typescript
interface Document {
  readonly tags: readonly string[];
}
```

## Integration with Backend

These types should mirror the Pydantic models used in the backend Lambda functions. When the backend API changes:

1. Update the corresponding type definition
2. Run `npx tsc --noEmit` to check for type errors
3. Update any affected components or utilities

## Testing

Type definitions can be tested using type-level tests:

```typescript
import type { Document } from '@/types';

// Type-level test: ensure Document has required fields
type RequiredFields = Required<Pick<Document, 'id' | 'filename' | 'status'>>;

// This will fail at compile time if fields are missing
const test: RequiredFields = {
  id: 'test',
  filename: 'test.pdf',
  status: 'ready',
};
```

## Adding New Types

When adding new types:

1. Create or update the appropriate module file (e.g., `document.ts`)
2. Add JSDoc comments for all types and fields
3. Export the type from the module
4. Re-export from `index.ts`
5. Update this README if adding a new module file
6. Run `npx tsc --noEmit` to verify no type errors

## Related Documentation

- [Tech Stack](/.kiro/steering/tech.md) - Technology choices and patterns
- [Project Structure](/.kiro/steering/structure.md) - Directory organization
- [Product Requirements](/.kiro/steering/product.md) - Product context
