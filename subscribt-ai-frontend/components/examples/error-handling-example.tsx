'use client';

/**
 * Example component demonstrating error handling patterns
 * This file shows how to integrate all error handling components
 */

import React, { useState } from 'react';
import { ErrorBoundary } from '@/components/error-boundary';
import { ErrorMessage, FieldError, ErrorEmptyState } from '@/components/error-message';
import { ErrorRetry, InlineErrorRetry } from '@/components/error-retry';
import { LoadingErrorState } from '@/components/loading-error-state';
import { useErrorHandler } from '@/hooks/use-error-handler';
import { useNetworkStatus } from '@/components/network-error-boundary';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AppError, parseAPIError } from '@/lib/errors';
import { ErrorCode, HTTPStatus } from '@/types/api';

/**
 * Example 1: Form with field validation errors
 */
function FormExample() {
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');

  const validateEmail = (value: string) => {
    if (!value) {
      setEmailError('Email is required');
    } else if (!/\S+@\S+\.\S+/.test(value)) {
      setEmailError('Email is invalid');
    } else {
      setEmailError('');
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Form Validation Example</h3>
      <div>
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            validateEmail(e.target.value);
          }}
          onBlur={() => validateEmail(email)}
        />
        {emailError && <FieldError message={emailError} />}
      </div>
    </div>
  );
}

/**
 * Example 2: API call with error handling
 */
function ApiCallExample() {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const { handleError } = useErrorHandler();

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/documents');
      
      if (!response.ok) {
        throw await parseAPIError(response);
      }

      const result = await response.json();
      setData(result);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      setError(error);
      handleError(error, { action: 'fetch_documents' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">API Call Example</h3>
      
      <LoadingErrorState
        isLoading={isLoading}
        error={error}
        data={data}
        onRetry={fetchData}
        loadingMessage="Loading documents..."
        emptyTitle="No Documents"
        emptyMessage="Click the button to load documents"
        emptyAction={<Button onClick={fetchData}>Load Documents</Button>}
      >
        {(documents) => (
          <div className="p-4 border rounded">
            <pre>{JSON.stringify(documents, null, 2)}</pre>
          </div>
        )}
      </LoadingErrorState>
    </div>
  );
}

/**
 * Example 3: Inline error with retry
 */
function InlineErrorExample() {
  const [error, setError] = useState<Error | null>(
    new AppError(
      ErrorCode.SERVICE_UNAVAILABLE,
      'Service is temporarily unavailable',
      HTTPStatus.SERVICE_UNAVAILABLE
    )
  );

  const handleRetry = async () => {
    // Simulate retry
    await new Promise(resolve => setTimeout(resolve, 1000));
    setError(null);
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Inline Error with Retry</h3>
      {error ? (
        <InlineErrorRetry error={error} onRetry={handleRetry} />
      ) : (
        <div className="p-4 border rounded bg-green-50 text-green-700">
          Success! Error resolved.
        </div>
      )}
    </div>
  );
}

/**
 * Example 4: Error card with details
 */
function ErrorCardExample() {
  const error = new AppError(
    ErrorCode.DOCUMENT_PROCESSING_FAILED,
    'Failed to process document',
    HTTPStatus.INTERNAL_SERVER_ERROR,
    {
      documentId: 'doc-123',
      reason: 'Invalid PDF format',
      timestamp: new Date().toISOString(),
    }
  );

  const handleRetry = async () => {
    console.log('Retrying...');
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Error Card with Details</h3>
      <ErrorRetry
        error={error}
        onRetry={handleRetry}
        title="Document Processing Failed"
        description="We couldn't process your document"
        showDetails={true}
      />
    </div>
  );
}

/**
 * Example 5: Different error severities
 */
function ErrorSeverityExample() {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Error Severity Levels</h3>
      
      <ErrorMessage
        message="This is an error message"
        severity="error"
        title="Error"
      />
      
      <ErrorMessage
        message="This is a warning message"
        severity="warning"
        title="Warning"
      />
      
      <ErrorMessage
        message="This is an info message"
        severity="info"
        title="Information"
      />
    </div>
  );
}

/**
 * Example 6: Empty state
 */
function EmptyStateExample() {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Empty State</h3>
      <div className="border rounded p-4">
        <ErrorEmptyState
          title="No Documents Found"
          message="Upload your first document to get started with policy analysis"
          action={<Button>Upload Document</Button>}
        />
      </div>
    </div>
  );
}

/**
 * Example 7: Network status
 */
function NetworkStatusExample() {
  const isOnline = useNetworkStatus();

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Network Status</h3>
      <div className={`p-4 border rounded ${isOnline ? 'bg-green-50' : 'bg-red-50'}`}>
        <p className={isOnline ? 'text-green-700' : 'text-red-700'}>
          Status: {isOnline ? 'Online' : 'Offline'}
        </p>
        <p className="text-sm text-muted-foreground mt-2">
          Try disconnecting your network to see the offline state
        </p>
      </div>
    </div>
  );
}

/**
 * Example 8: Component that throws error (for Error Boundary)
 */
function ErrorThrowingComponent({ shouldThrow }: { shouldThrow: boolean }) {
  if (shouldThrow) {
    throw new Error('This is a test error from a component');
  }

  return <div className="p-4 border rounded">Component rendered successfully</div>;
}

function ErrorBoundaryExample() {
  const [shouldThrow, setShouldThrow] = useState(false);

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Error Boundary Example</h3>
      <Button onClick={() => setShouldThrow(!shouldThrow)}>
        {shouldThrow ? 'Reset' : 'Trigger Error'}
      </Button>
      
      <ErrorBoundary>
        <ErrorThrowingComponent shouldThrow={shouldThrow} />
      </ErrorBoundary>
    </div>
  );
}

/**
 * Main example component showcasing all patterns
 */
export default function ErrorHandlingExamples() {
  return (
    <div className="container mx-auto p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">Error Handling Examples</h1>
        <p className="text-muted-foreground">
          Comprehensive examples of error handling patterns in Subscribt AI
        </p>
      </div>

      <div className="grid gap-8">
        <FormExample />
        <ApiCallExample />
        <InlineErrorExample />
        <ErrorCardExample />
        <ErrorSeverityExample />
        <EmptyStateExample />
        <NetworkStatusExample />
        <ErrorBoundaryExample />
      </div>
    </div>
  );
}
