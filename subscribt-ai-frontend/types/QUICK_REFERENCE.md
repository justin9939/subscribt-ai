# TypeScript Types Quick Reference

## Import Patterns

```typescript
// Import types (compile-time only)
import type { Document, Citation, QueryRequest } from '@/types';

// Import type guards and enums (runtime values)
import { isDocument, ErrorCode, HTTPStatus } from '@/types';

// Mixed import
import { type Document, isDocument } from '@/types';
```

## Common Type Patterns

### Document Upload Flow

```typescript
import type { DocumentUploadRequest, DocumentUploadResponse, Document } from '@/types';

// 1. Request pre-signed URL
const request: DocumentUploadRequest = {
  filename: file.name,
  contentType: file.type,
  fileSize: file.size,
};

// 2. Get upload URL
const response: DocumentUploadResponse = await getUploadUrl(request);

// 3. Upload to S3
await uploadToS3(response.uploadUrl, file);

// 4. Poll for document status
const document: Document = await pollDocumentStatus(response.documentId);
```

### Query with Streaming

```typescript
import type { StreamChunk, Citation, StreamingCallbacks } from '@/types';

const citations: Citation[] = [];
let fullResponse = '';

const callbacks: StreamingCallbacks = {
  onToken: (token) => {
    fullResponse += token;
    updateUI(fullResponse);
  },
  onCitation: (citation) => {
    citations.push(citation);
    updateCitations(citations);
  },
  onError: (error) => {
    showError(error);
  },
  onComplete: () => {
    markComplete();
  },
};

await streamQuery(userMessage, callbacks);
```

### API Error Handling

```typescript
import type { APIResponse, APIError } from '@/types';
import { ErrorCode, HTTPStatus } from '@/types';

async function fetchDocument(id: string): Promise<Document> {
  const response: APIResponse<Document> = await api.get(`/documents/${id}`);
  
  if (!response.success || !response.data) {
    const error = response.error;
    
    switch (error?.code) {
      case ErrorCode.DOCUMENT_NOT_FOUND:
        throw new Error('Document not found');
      case ErrorCode.UNAUTHORIZED:
        redirectToLogin();
        break;
      default:
        throw new Error(error?.message || 'Unknown error');
    }
  }
  
  return response.data;
}
```

### Type Guards for Runtime Validation

```typescript
import { isDocument, isCitation, isStreamChunk } from '@/types';

// Validate API response
const data: unknown = await response.json();

if (isDocument(data)) {
  // TypeScript now knows data is Document
  console.log(data.filename);
} else {
  throw new Error('Invalid document data');
}

// Validate array of items
if (Array.isArray(data) && data.every(isDocument)) {
  // TypeScript knows data is Document[]
  data.forEach(doc => console.log(doc.filename));
}
```

### Persona-Based Routing

```typescript
import type { User, Persona } from '@/types';
import { isPersona } from '@/types';

function getHomeRoute(user: User): string {
  switch (user.persona) {
    case 'hr_manager':
      return '/hr/dashboard';
    case 'employee':
      return '/employee/query';
  }
}

// Validate persona from external source
const unknownPersona: unknown = localStorage.getItem('persona');
if (isPersona(unknownPersona)) {
  // Safe to use as Persona
  const persona: Persona = unknownPersona;
}
```

### Form State Management

```typescript
import type { FormState, FieldError } from '@/types';

interface LoginForm {
  email: string;
  password: string;
}

const [formState, setFormState] = useState<FormState<LoginForm>>({
  values: { email: '', password: '' },
  errors: [],
  isSubmitting: false,
  isTouched: false,
  isValid: false,
});

function validateForm(values: LoginForm): FieldError[] {
  const errors: FieldError[] = [];
  
  if (!values.email) {
    errors.push({ field: 'email', message: 'Email is required' });
  }
  
  if (!values.password) {
    errors.push({ field: 'password', message: 'Password is required' });
  }
  
  return errors;
}
```

### Analytics Dashboard

```typescript
import type { TrendData, GapAnalysisEntry, AnalyticsDashboardData } from '@/types';

async function loadDashboard(): Promise<AnalyticsDashboardData> {
  const [trends, gaps] = await Promise.all([
    fetchTrends({ period: 'weekly' }),
    fetchGapAnalysis(),
  ]);
  
  return {
    trends,
    gaps,
    documentStats: trends.topTopics.map(topic => ({
      documentId: topic.topic,
      filename: topic.topic,
      queryCount: topic.queryCount,
      answerRate: 0.9,
      topTopics: [topic],
    })),
  };
}
```

### Pagination

```typescript
import type { PaginatedResponse, PaginationParams } from '@/types';

async function loadDocuments(
  params: PaginationParams = { limit: 20 }
): Promise<PaginatedResponse<Document>> {
  const response = await api.get('/documents', { params });
  return response.data;
}

// Usage
const page1 = await loadDocuments({ limit: 20 });
const page2 = await loadDocuments({ 
  limit: 20, 
  nextToken: page1.nextToken 
});
```

## Type Utilities

### Safe JSON Parsing

```typescript
import { parseJSON, isDocument } from '@/types';

const json = '{"id":"123","filename":"test.pdf",...}';
const document = parseJSON(json, isDocument);

if (document) {
  // document is Document
  console.log(document.filename);
} else {
  console.error('Invalid JSON or wrong type');
}
```

### Type Assertions

```typescript
import { assertType, isDocument } from '@/types';

const data: unknown = await fetchData();

// Throws TypeError if validation fails
assertType(data, isDocument, 'Expected Document type');

// Now safe to use as Document
console.log(data.filename);
```

### Array Validation

```typescript
import { isArrayOf, isCitation } from '@/types';

const data: unknown = await fetchCitations();

if (isArrayOf(data, isCitation)) {
  // TypeScript knows data is Citation[]
  data.forEach(citation => console.log(citation.snippet));
}
```

## Common Enums

```typescript
import { ErrorCode, HTTPStatus } from '@/types';

// Error codes
ErrorCode.UNAUTHORIZED
ErrorCode.DOCUMENT_NOT_FOUND
ErrorCode.VALIDATION_ERROR
ErrorCode.INTERNAL_SERVER_ERROR

// HTTP status codes
HTTPStatus.OK                    // 200
HTTPStatus.CREATED               // 201
HTTPStatus.BAD_REQUEST           // 400
HTTPStatus.UNAUTHORIZED          // 401
HTTPStatus.NOT_FOUND             // 404
HTTPStatus.INTERNAL_SERVER_ERROR // 500
```

## Type Narrowing

```typescript
import type { StreamChunk } from '@/types';

function handleChunk(chunk: StreamChunk) {
  // Discriminated union - TypeScript narrows the type
  switch (chunk.type) {
    case 'token':
      // chunk.token is available
      console.log(chunk.token);
      break;
    case 'citation':
      // chunk.citation is available
      console.log(chunk.citation.snippet);
      break;
    case 'error':
      // chunk.error is available
      console.error(chunk.error);
      break;
  }
}
```

## Best Practices

1. **Always use `type` imports for types**
   ```typescript
   import type { Document } from '@/types';  // ✅ Good
   import { Document } from '@/types';       // ❌ Bad (runtime import)
   ```

2. **Use type guards for external data**
   ```typescript
   const data: unknown = await response.json();
   if (isDocument(data)) {
     // Safe to use
   }
   ```

3. **Leverage discriminated unions**
   ```typescript
   // TypeScript automatically narrows types in switch statements
   switch (chunk.type) {
     case 'token': /* chunk.token available */ break;
   }
   ```

4. **Use strict null checks**
   ```typescript
   function getFilename(doc: Document | null): string {
     return doc?.filename ?? 'Unknown';  // ✅ Safe
   }
   ```

5. **Avoid type assertions**
   ```typescript
   const doc = data as Document;        // ❌ Unsafe
   if (isDocument(data)) { /* use */ }  // ✅ Safe
   ```
