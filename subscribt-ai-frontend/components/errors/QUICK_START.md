# Error Handling Quick Start

Quick reference for common error handling scenarios.

## Installation

All error handling components are already set up. Just import what you need:

```typescript
import {
  ErrorBoundary,
  ErrorMessage,
  LoadingErrorState,
  useErrorHandler,
} from '@/components/errors';
```

---

## Common Scenarios

### 1. Wrap Your App (One-Time Setup)

```typescript
// app/layout.tsx or app/providers.tsx
import { ErrorProvider } from '@/components/errors';

export default function Layout({ children }) {
  return (
    <ErrorProvider>
      {children}
    </ErrorProvider>
  );
}
```

### 2. Handle API Errors

```typescript
import { parseAPIError, useErrorHandler } from '@/components/errors';

function MyComponent() {
  const { handleError } = useErrorHandler();

  const fetchData = async () => {
    try {
      const response = await fetch('/api/data');
      if (!response.ok) throw await parseAPIError(response);
      return response.json();
    } catch (error) {
      handleError(error);
    }
  };
}
```

### 3. Show Loading/Error/Empty States

```typescript
import { LoadingErrorState } from '@/components/errors';

function DocumentList() {
  const { data, isLoading, error, refetch } = useDocuments();

  return (
    <LoadingErrorState
      isLoading={isLoading}
      error={error}
      data={data}
      onRetry={refetch}
      emptyMessage="No documents yet"
    >
      {(documents) => (
        <div>
          {documents.map(doc => <DocumentCard key={doc.id} doc={doc} />)}
        </div>
      )}
    </LoadingErrorState>
  );
}
```

### 4. Form Field Errors

```typescript
import { FieldError } from '@/components/errors';

function MyForm() {
  const { register, formState: { errors } } = useForm();

  return (
    <div>
      <Input {...register('email', { required: 'Email required' })} />
      {errors.email && <FieldError message={errors.email.message} />}
    </div>
  );
}
```

### 5. Inline Error with Retry

```typescript
import { InlineErrorRetry } from '@/components/errors';

function MyComponent() {
  const { error, retry } = useSomeData();

  return (
    <div>
      {error && <InlineErrorRetry error={error} onRetry={retry} />}
    </div>
  );
}
```

### 6. Show Error Toast

```typescript
import { useErrorHandler } from '@/components/errors';

function MyComponent() {
  const { showErrorToast } = useErrorHandler();

  const handleAction = async () => {
    try {
      await doSomething();
    } catch (error) {
      showErrorToast(error, 'Action Failed');
    }
  };
}
```

### 7. Catch Component Errors

```typescript
import { ErrorBoundary } from '@/components/errors';

function ParentComponent() {
  return (
    <ErrorBoundary>
      <ChildThatMightError />
    </ErrorBoundary>
  );
}
```

### 8. Check Network Status

```typescript
import { useNetworkStatus } from '@/components/errors';

function MyComponent() {
  const isOnline = useNetworkStatus();

  if (!isOnline) {
    return <div>You are offline</div>;
  }

  return <div>Content</div>;
}
```

---

## Error Types

### Create Custom Errors

```typescript
import { AppError, ErrorCode, HTTPStatus } from '@/components/errors';

throw new AppError(
  ErrorCode.DOCUMENT_NOT_FOUND,
  'Document not found',
  HTTPStatus.NOT_FOUND
);
```

### Parse API Errors

```typescript
import { parseAPIError } from '@/components/errors';

const response = await fetch('/api/endpoint');
if (!response.ok) {
  const error = await parseAPIError(response);
  throw error;
}
```

---

## Best Practices

1. ✅ **Always wrap your app** with `ErrorProvider`
2. ✅ **Use `parseAPIError`** for all API calls
3. ✅ **Use `LoadingErrorState`** for data fetching
4. ✅ **Use `FieldError`** for form validation
5. ✅ **Use `useErrorHandler`** for toast notifications
6. ✅ **Add `ErrorBoundary`** around risky components
7. ✅ **Provide retry options** for retryable errors
8. ✅ **Log errors** with context for debugging

---

## Component Cheat Sheet

| Use Case | Component |
|----------|-----------|
| App-level error catching | `ErrorProvider` |
| Component error catching | `ErrorBoundary` |
| Data fetching states | `LoadingErrorState` |
| Form field errors | `FieldError` |
| Inline errors | `ErrorMessage` |
| Error with retry | `ErrorRetry` / `InlineErrorRetry` |
| Empty state | `ErrorEmptyState` |
| Loading spinner | `LoadingSpinner` |
| Network status | `useNetworkStatus` |
| Error handling hook | `useErrorHandler` |

---

## Full Example

```typescript
'use client';

import { useState } from 'react';
import {
  LoadingErrorState,
  useErrorHandler,
  parseAPIError,
  ErrorBoundary,
} from '@/components/errors';
import { Button } from '@/components/ui/button';

function DocumentUpload() {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [uploadedDoc, setUploadedDoc] = useState(null);
  const { handleError } = useErrorHandler();

  const handleUpload = async () => {
    if (!file) return;

    setIsUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw await parseAPIError(response);
      }

      const result = await response.json();
      setUploadedDoc(result);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Upload failed');
      setError(error);
      handleError(error, { fileName: file.name });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <ErrorBoundary>
      <div className="space-y-4">
        <input
          type="file"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
        />
        
        <Button
          onClick={handleUpload}
          disabled={!file || isUploading}
        >
          Upload
        </Button>

        <LoadingErrorState
          isLoading={isUploading}
          error={error}
          data={uploadedDoc}
          onRetry={handleUpload}
          loadingMessage="Uploading document..."
          emptyMessage="Upload a document to get started"
        >
          {(doc) => (
            <div>Document uploaded: {doc.name}</div>
          )}
        </LoadingErrorState>
      </div>
    </ErrorBoundary>
  );
}

export default DocumentUpload;
```

---

For more details, see [ERROR_HANDLING.md](../ERROR_HANDLING.md)
