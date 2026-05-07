# Error Handling Migration Guide

Guide for integrating the new error handling system into existing Subscribt AI components.

---

## Step 1: Update Root Layout (Required)

The Toaster component has already been added to the root layout. No additional changes needed.

```typescript
// app/layout.tsx - Already updated ✓
import { Toaster } from "@/components/ui/toaster";

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
```

---

## Step 2: Wrap Route Groups with Error Boundaries

Add error boundaries to HR and Employee route groups.

### HR Route Group

```typescript
// app/(hr)/layout.tsx
import { ErrorBoundary } from '@/components/errors';

export default function HRLayout({ children }) {
  return (
    <ErrorBoundary>
      {children}
    </ErrorBoundary>
  );
}
```

### Employee Route Group

```typescript
// app/(employee)/layout.tsx
import { ErrorBoundary } from '@/components/errors';

export default function EmployeeLayout({ children }) {
  return (
    <ErrorBoundary>
      {children}
    </ErrorBoundary>
  );
}
```

---

## Step 3: Update Chat Stream Hook (Already Done)

The `useChatStream` hook already has error handling built in. No changes needed.

---

## Step 4: Update API Routes

### Before:
```typescript
// app/api/upload/route.ts
export async function POST(request: Request) {
  try {
    // ... upload logic
    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: 'Upload failed' }, { status: 500 });
  }
}
```

### After:
```typescript
// app/api/upload/route.ts
import { AppError, ErrorCode, HTTPStatus } from '@/lib/errors';

export async function POST(request: Request) {
  try {
    // ... upload logic
    return Response.json({ success: true });
  } catch (error) {
    const appError = error instanceof AppError ? error : new AppError(
      ErrorCode.INTERNAL_SERVER_ERROR,
      'Upload failed',
      HTTPStatus.INTERNAL_SERVER_ERROR
    );
    
    return Response.json(
      { error: appError.toJSON() },
      { status: appError.statusCode }
    );
  }
}
```

---

## Step 5: Update Components with Data Fetching

### Before:
```typescript
function DocumentList() {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch('/api/documents')
      .then(res => res.json())
      .then(setDocuments)
      .catch(setError)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;
  if (!documents.length) return <div>No documents</div>;

  return <div>{/* render documents */}</div>;
}
```

### After:
```typescript
import { LoadingErrorState, parseAPIError } from '@/components/errors';

function DocumentList() {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDocuments = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/documents');
      if (!response.ok) throw await parseAPIError(response);
      const data = await response.json();
      setDocuments(data);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  return (
    <LoadingErrorState
      isLoading={loading}
      error={error}
      data={documents}
      onRetry={fetchDocuments}
      emptyMessage="No documents uploaded yet"
      emptyAction={<Button>Upload Document</Button>}
    >
      {(docs) => (
        <div>{/* render documents */}</div>
      )}
    </LoadingErrorState>
  );
}
```

---

## Step 6: Update Forms

### Before:
```typescript
function DocumentUploadForm() {
  const [file, setFile] = useState(null);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      setError('Please select a file');
      return;
    }
    // ... upload logic
  };

  return (
    <form onSubmit={handleSubmit}>
      <input type="file" onChange={(e) => setFile(e.target.files[0])} />
      {error && <div className="text-red-500">{error}</div>}
      <button type="submit">Upload</button>
    </form>
  );
}
```

### After:
```typescript
import { FieldError, useErrorHandler, parseAPIError } from '@/components/errors';

function DocumentUploadForm() {
  const [file, setFile] = useState(null);
  const [error, setError] = useState('');
  const { handleError } = useErrorHandler();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!file) {
      setError('Please select a file');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) throw await parseAPIError(response);
      
      // Success handling
    } catch (err) {
      handleError(err, { fileName: file.name });
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <Label>Document</Label>
        <Input
          type="file"
          onChange={(e) => {
            setFile(e.target.files[0]);
            setError('');
          }}
        />
        {error && <FieldError message={error} />}
      </div>
      <Button type="submit">Upload</Button>
    </form>
  );
}
```

---

## Step 7: Update Chat Components

### Before:
```typescript
function ChatInterface() {
  const { messages, sendMessage, error } = useChatStream();

  return (
    <div>
      {error && <div className="text-red-500">{error.message}</div>}
      <MessageList messages={messages} />
    </div>
  );
}
```

### After:
```typescript
import { InlineErrorRetry } from '@/components/errors';

function ChatInterface() {
  const { messages, sendMessage, error } = useChatStream();
  const [lastQuery, setLastQuery] = useState('');

  const handleSend = (query: string) => {
    setLastQuery(query);
    sendMessage(query);
  };

  return (
    <div>
      {error && (
        <InlineErrorRetry
          error={error}
          onRetry={() => sendMessage(lastQuery)}
        />
      )}
      <MessageList messages={messages} />
      <ChatInput onSend={handleSend} />
    </div>
  );
}
```

---

## Step 8: Add Network Status Indicator (Optional)

Add a floating network status indicator to the layout:

```typescript
// app/layout.tsx or any layout
import { NetworkStatusIndicator } from '@/components/errors';

export default function Layout({ children }) {
  return (
    <>
      {children}
      <NetworkStatusIndicator />
    </>
  );
}
```

---

## Step 9: Update Error Handling in Hooks

### Before:
```typescript
function useDocuments() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  const fetch = async () => {
    try {
      const response = await fetchDocuments();
      setData(response);
    } catch (err) {
      setError(err);
      console.error(err);
    }
  };

  return { data, error, fetch };
}
```

### After:
```typescript
import { parseAPIError, logError } from '@/components/errors';

function useDocuments() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  const fetch = async () => {
    try {
      const response = await fetchAPI('/api/documents');
      if (!response.ok) throw await parseAPIError(response);
      const data = await response.json();
      setData(data);
    } catch (err) {
      const normalizedError = err instanceof Error ? err : new Error('Unknown error');
      setError(normalizedError);
      logError(normalizedError, { context: 'useDocuments' });
    }
  };

  return { data, error, fetch };
}
```

---

## Step 10: Update Server Actions

### Before:
```typescript
'use server';

export async function deleteDocument(id: string) {
  try {
    await db.delete(id);
    return { success: true };
  } catch (error) {
    return { success: false, error: 'Delete failed' };
  }
}
```

### After:
```typescript
'use server';

import { AppError, ErrorCode, HTTPStatus } from '@/lib/errors';

export async function deleteDocument(id: string) {
  try {
    await db.delete(id);
    return { success: true };
  } catch (error) {
    const appError = new AppError(
      ErrorCode.RESOURCE_NOT_FOUND,
      'Document not found',
      HTTPStatus.NOT_FOUND,
      { documentId: id }
    );
    
    return {
      success: false,
      error: appError.toJSON(),
    };
  }
}
```

---

## Common Patterns

### Pattern 1: Simple Error Toast
```typescript
const { showErrorToast } = useErrorHandler();

try {
  await action();
} catch (error) {
  showErrorToast(error, 'Action Failed');
}
```

### Pattern 2: Error with Context
```typescript
const { handleError } = useErrorHandler();

try {
  await uploadDocument(file);
} catch (error) {
  handleError(error, {
    action: 'upload',
    fileName: file.name,
    fileSize: file.size,
  });
}
```

### Pattern 3: Retryable Error
```typescript
const [error, setError] = useState(null);

const handleAction = async () => {
  try {
    await action();
  } catch (err) {
    setError(err);
  }
};

return error ? (
  <ErrorRetry error={error} onRetry={handleAction} />
) : (
  <Content />
);
```

### Pattern 4: Form Validation
```typescript
const { register, formState: { errors } } = useForm();

return (
  <div>
    <Input {...register('email', { required: 'Email required' })} />
    {errors.email && <FieldError message={errors.email.message} />}
  </div>
);
```

---

## Testing Your Migration

1. **Test error boundaries**: Throw an error in a component and verify the error boundary catches it
2. **Test network errors**: Disconnect network and verify offline detection works
3. **Test API errors**: Trigger API errors and verify proper error messages
4. **Test form validation**: Submit invalid forms and verify field errors display
5. **Test retry logic**: Trigger retryable errors and verify retry button works
6. **Test toast notifications**: Trigger errors and verify toast appears

---

## Checklist

- [ ] Root layout updated with Toaster
- [ ] Error boundaries added to route groups
- [ ] API routes return structured errors
- [ ] Components use LoadingErrorState for data fetching
- [ ] Forms use FieldError for validation
- [ ] Chat components use InlineErrorRetry
- [ ] Network status indicator added (optional)
- [ ] Hooks use parseAPIError and logError
- [ ] Server actions return structured errors
- [ ] All TypeScript errors resolved
- [ ] Error handling tested

---

## Need Help?

- See `ERROR_HANDLING.md` for full documentation
- See `QUICK_START.md` for quick reference
- See `error-handling-example.tsx` for live examples
- Import from `@/components/errors` for all error components
