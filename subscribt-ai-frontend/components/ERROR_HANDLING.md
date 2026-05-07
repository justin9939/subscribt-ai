# Error Handling Components

Comprehensive error handling system for the Subscribt AI frontend.

## Overview

This error handling system provides:
- **Centralized error utilities** for parsing, logging, and normalizing errors
- **React Error Boundaries** for catching component errors
- **Reusable error UI components** for consistent error display
- **Network error detection** with offline/online status
- **Custom hooks** for error handling in components
- **Toast notifications** for non-blocking error messages

---

## Core Utilities

### `lib/errors/error-handler.ts`

Central error handling utilities.

#### `AppError` Class

Custom error class with structured error information:

```typescript
import { AppError, ErrorCode, HTTPStatus } from '@/lib/errors';

throw new AppError(
  ErrorCode.DOCUMENT_NOT_FOUND,
  'The requested document could not be found',
  HTTPStatus.NOT_FOUND,
  { documentId: '123' },
  'req-abc-123'
);
```

#### Utility Functions

```typescript
// Parse API error from fetch response
const error = await parseAPIError(response);

// Get user-friendly error message
const message = getUserFriendlyMessage(error);

// Check if error is retryable
if (isRetryableError(error)) {
  // Show retry button
}

// Check if error requires authentication
if (isAuthError(error)) {
  // Redirect to login
}

// Log error to monitoring service
logError(error, { userId: '123', action: 'upload' });

// Normalize unknown error to Error instance
const normalizedError = normalizeError(unknownError);
```

---

## Error Boundaries

### `ErrorBoundary`

Catches React errors in child components.

```typescript
import { ErrorBoundary } from '@/components/error-boundary';

// Basic usage
<ErrorBoundary>
  <YourComponent />
</ErrorBoundary>

// With custom fallback
<ErrorBoundary
  fallback={(error, reset) => (
    <div>
      <h2>Custom Error UI</h2>
      <p>{error.message}</p>
      <button onClick={reset}>Try Again</button>
    </div>
  )}
  onError={(error, errorInfo) => {
    // Custom error handling
    console.error('Caught error:', error, errorInfo);
  }}
>
  <YourComponent />
</ErrorBoundary>

// Minimal fallback for nested boundaries
import { MinimalErrorFallback } from '@/components/error-boundary';

<ErrorBoundary fallback={MinimalErrorFallback}>
  <NestedComponent />
</ErrorBoundary>
```

### `NetworkErrorBoundary`

Detects and handles network connectivity issues.

```typescript
import { NetworkErrorBoundary } from '@/components/network-error-boundary';

<NetworkErrorBoundary>
  <App />
</NetworkErrorBoundary>
```

**Features:**
- Automatically detects online/offline status
- Shows user-friendly offline message
- Enables retry when connection is restored

---

## Error Display Components

### `ErrorMessage`

Inline error message with severity levels.

```typescript
import { ErrorMessage } from '@/components/error-message';

// Error severity
<ErrorMessage
  message="Failed to upload document"
  severity="error"
  title="Upload Failed"
/>

// Warning severity
<ErrorMessage
  message="Document is large and may take time to process"
  severity="warning"
/>

// Info severity
<ErrorMessage
  message="Processing will begin shortly"
  severity="info"
/>

// Dismissible
<ErrorMessage
  message="Something went wrong"
  onDismiss={() => setError(null)}
/>
```

### `FieldError`

Compact error for form fields.

```typescript
import { FieldError } from '@/components/error-message';

<div>
  <Input {...field} />
  {errors.email && <FieldError message={errors.email.message} />}
</div>
```

### `ErrorEmptyState`

Empty state with error styling.

```typescript
import { ErrorEmptyState } from '@/components/error-message';

<ErrorEmptyState
  title="No Documents Found"
  message="Upload a document to get started"
  action={<Button>Upload Document</Button>}
/>
```

### `ErrorRetry`

Error display with retry functionality.

```typescript
import { ErrorRetry } from '@/components/error-retry';

<ErrorRetry
  error={error}
  onRetry={handleRetry}
  title="Failed to Load Documents"
  description="An error occurred while loading your documents"
  showDetails={true}
/>
```

### `InlineErrorRetry`

Compact inline error with retry button.

```typescript
import { InlineErrorRetry } from '@/components/error-retry';

{error && (
  <InlineErrorRetry
    error={error}
    onRetry={refetch}
  />
)}
```

---

## Loading & Error States

### `LoadingErrorState`

Unified component for loading, error, empty, and success states.

```typescript
import { LoadingErrorState } from '@/components/loading-error-state';

<LoadingErrorState
  isLoading={isLoading}
  error={error}
  data={documents}
  onRetry={refetch}
  loadingMessage="Loading documents..."
  emptyTitle="No Documents"
  emptyMessage="Upload your first document to get started"
  emptyAction={<Button>Upload Document</Button>}
>
  {(documents) => (
    <DocumentList documents={documents} />
  )}
</LoadingErrorState>
```

### `LoadingSpinner`

Simple loading spinner.

```typescript
import { LoadingSpinner } from '@/components/loading-error-state';

<LoadingSpinner message="Processing document..." />
```

### `InlineLoadingSpinner`

Inline spinner for buttons.

```typescript
import { InlineLoadingSpinner } from '@/components/loading-error-state';

<Button disabled={isLoading}>
  {isLoading ? <InlineLoadingSpinner /> : 'Submit'}
</Button>
```

---

## Custom Hooks

### `useErrorHandler`

Centralized error handling with toast notifications.

```typescript
import { useErrorHandler } from '@/hooks/use-error-handler';

function MyComponent() {
  const { handleError, showErrorToast } = useErrorHandler({
    onAuthError: () => router.push('/login'),
    logErrors: true,
  });

  const handleUpload = async () => {
    try {
      await uploadDocument(file);
    } catch (error) {
      handleError(error, { action: 'upload', fileSize: file.size });
    }
  };

  // Or show a simple toast
  const handleDelete = async () => {
    try {
      await deleteDocument(id);
    } catch (error) {
      showErrorToast(error, 'Delete Failed');
    }
  };
}
```

### `useAsyncError`

Wrap async functions with automatic error handling.

```typescript
import { useAsyncError } from '@/hooks/use-error-handler';

function MyComponent() {
  const [uploadDocument, isUploading, uploadError] = useAsyncError(
    async (file: File) => {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: file,
      });
      if (!response.ok) throw await parseAPIError(response);
      return response.json();
    },
    { logErrors: true }
  );

  return (
    <div>
      <Button onClick={() => uploadDocument(file)} disabled={isUploading}>
        Upload
      </Button>
      {uploadError && <ErrorMessage message={uploadError.message} />}
    </div>
  );
}
```

### `useNetworkStatus`

Detect online/offline status.

```typescript
import { useNetworkStatus } from '@/components/network-error-boundary';

function MyComponent() {
  const isOnline = useNetworkStatus();

  return (
    <div>
      {!isOnline && <p>You are offline</p>}
    </div>
  );
}
```

### `NetworkStatusIndicator`

Floating indicator for offline status.

```typescript
import { NetworkStatusIndicator } from '@/components/network-error-boundary';

function Layout({ children }) {
  return (
    <>
      {children}
      <NetworkStatusIndicator />
    </>
  );
}
```

---

## Usage Patterns

### API Error Handling

```typescript
import { parseAPIError, AppError } from '@/lib/errors';

async function fetchDocuments() {
  const response = await fetch('/api/documents');
  
  if (!response.ok) {
    const error = await parseAPIError(response);
    throw error;
  }
  
  return response.json();
}
```

### Form Validation Errors

```typescript
import { FieldError } from '@/components/error-message';

function DocumentForm() {
  const { register, formState: { errors } } = useForm();

  return (
    <form>
      <div>
        <Label>Title</Label>
        <Input {...register('title', { required: 'Title is required' })} />
        {errors.title && <FieldError message={errors.title.message} />}
      </div>
    </form>
  );
}
```

### Chat Stream Error Handling

```typescript
import { useChatStream } from '@/lib/chat/use-chat-stream';
import { useErrorHandler } from '@/hooks/use-error-handler';

function ChatInterface() {
  const { handleError } = useErrorHandler();
  
  const { messages, sendMessage, error } = useChatStream({
    onError: (error) => handleError(error, { context: 'chat' }),
  });

  return (
    <div>
      {error && <InlineErrorRetry error={error} onRetry={() => sendMessage(lastQuery)} />}
      <MessageList messages={messages} />
    </div>
  );
}
```

### Document Upload Error Handling

```typescript
import { LoadingErrorState } from '@/components/loading-error-state';
import { useErrorHandler } from '@/hooks/use-error-handler';

function DocumentUpload() {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const { handleError } = useErrorHandler();

  const handleUpload = async (file: File) => {
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

      toast({ title: 'Upload successful' });
    } catch (err) {
      const error = normalizeError(err);
      setError(error);
      handleError(error, { fileName: file.name, fileSize: file.size });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <LoadingErrorState
      isLoading={isUploading}
      error={error}
      data={!isUploading && !error ? true : null}
      onRetry={() => handleUpload(lastFile)}
      loadingMessage="Uploading document..."
    >
      {() => <UploadSuccess />}
    </LoadingErrorState>
  );
}
```

---

## Error Codes

All error codes are defined in `types/api.ts`:

```typescript
export enum ErrorCode {
  // Authentication & Authorization
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  INVALID_TOKEN = 'INVALID_TOKEN',
  
  // Validation
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  INVALID_INPUT = 'INVALID_INPUT',
  MISSING_REQUIRED_FIELD = 'MISSING_REQUIRED_FIELD',
  
  // Document errors
  DOCUMENT_NOT_FOUND = 'DOCUMENT_NOT_FOUND',
  DOCUMENT_TOO_LARGE = 'DOCUMENT_TOO_LARGE',
  INVALID_DOCUMENT_FORMAT = 'INVALID_DOCUMENT_FORMAT',
  DOCUMENT_PROCESSING_FAILED = 'DOCUMENT_PROCESSING_FAILED',
  
  // Query errors
  QUERY_TOO_LONG = 'QUERY_TOO_LONG',
  NO_DOCUMENTS_AVAILABLE = 'NO_DOCUMENTS_AVAILABLE',
  QUERY_PROCESSING_FAILED = 'QUERY_PROCESSING_FAILED',
  
  // System errors
  INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
  TIMEOUT = 'TIMEOUT',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
}
```

---

## Best Practices

1. **Always use Error Boundaries** at route level to catch unexpected errors
2. **Use `parseAPIError`** for all fetch responses to get structured errors
3. **Log errors** with context for debugging (user ID, action, etc.)
4. **Show user-friendly messages** - never expose technical details to users
5. **Provide retry options** for retryable errors (network, timeout, etc.)
6. **Handle auth errors** by redirecting to login
7. **Use toast notifications** for non-critical errors
8. **Use inline errors** for form validation
9. **Use full-page errors** for critical failures
10. **Test offline scenarios** with NetworkErrorBoundary

---

## Integration with Layout

Wrap your app with error boundaries:

```typescript
// app/layout.tsx
import { ErrorBoundary } from '@/components/error-boundary';
import { NetworkErrorBoundary } from '@/components/network-error-boundary';
import { NetworkStatusIndicator } from '@/components/network-error-boundary';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <NetworkErrorBoundary>
          <ErrorBoundary>
            {children}
            <NetworkStatusIndicator />
          </ErrorBoundary>
        </NetworkErrorBoundary>
      </body>
    </html>
  );
}
```

---

## Testing

```typescript
// Test error handling
import { render, screen } from '@testing-library/react';
import { ErrorMessage } from '@/components/error-message';

test('displays error message', () => {
  render(<ErrorMessage message="Test error" severity="error" />);
  expect(screen.getByText('Test error')).toBeInTheDocument();
});

// Test error boundary
test('catches errors', () => {
  const ThrowError = () => {
    throw new Error('Test error');
  };

  render(
    <ErrorBoundary>
      <ThrowError />
    </ErrorBoundary>
  );

  expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
});
```
