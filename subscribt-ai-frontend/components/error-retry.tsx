'use client';

/**
 * Error component with retry functionality
 */

import React, { useState } from 'react';
import { RefreshCw, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { AppError, getUserFriendlyMessage, isRetryableError } from '@/lib/errors/error-handler';

interface ErrorRetryProps {
  error: Error | AppError;
  onRetry: () => void | Promise<void>;
  title?: string;
  description?: string;
  showDetails?: boolean;
  className?: string;
}

/**
 * Error display with retry button
 */
export function ErrorRetry({
  error,
  onRetry,
  title = 'Something went wrong',
  description,
  showDetails = false,
  className,
}: ErrorRetryProps): React.ReactElement {
  const [isRetrying, setIsRetrying] = useState(false);
  const canRetry = isRetryableError(error);
  const message = getUserFriendlyMessage(error);

  const handleRetry = async (): Promise<void> => {
    setIsRetrying(true);
    try {
      await onRetry();
    } finally {
      setIsRetrying(false);
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-destructive" />
          <CardTitle>{title}</CardTitle>
        </div>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">{message}</p>
        {showDetails && error instanceof AppError && error.details && (
          <details className="mt-4">
            <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground">
              Technical details
            </summary>
            <pre className="mt-2 text-xs bg-muted p-2 rounded overflow-auto">
              {JSON.stringify(error.details, null, 2)}
            </pre>
          </details>
        )}
      </CardContent>
      <CardFooter>
        <Button
          onClick={handleRetry}
          disabled={isRetrying || !canRetry}
          className="w-full"
        >
          <RefreshCw className={`mr-2 h-4 w-4 ${isRetrying ? 'animate-spin' : ''}`} />
          {isRetrying ? 'Retrying...' : canRetry ? 'Try Again' : 'Cannot Retry'}
        </Button>
      </CardFooter>
    </Card>
  );
}

/**
 * Inline error with retry button (compact version)
 */
export function InlineErrorRetry({
  error,
  onRetry,
  className,
}: {
  error: Error | AppError;
  onRetry: () => void | Promise<void>;
  className?: string;
}): React.ReactElement {
  const [isRetrying, setIsRetrying] = useState(false);
  const canRetry = isRetryableError(error);
  const message = getUserFriendlyMessage(error);

  const handleRetry = async (): Promise<void> => {
    setIsRetrying(true);
    try {
      await onRetry();
    } finally {
      setIsRetrying(false);
    }
  };

  return (
    <div className={`flex items-center gap-3 p-3 rounded-md border border-destructive/50 bg-destructive/5 ${className}`}>
      <AlertCircle className="h-4 w-4 text-destructive flex-shrink-0" />
      <p className="text-sm text-destructive flex-1">{message}</p>
      {canRetry && (
        <Button
          onClick={handleRetry}
          disabled={isRetrying}
          size="sm"
          variant="outline"
        >
          <RefreshCw className={`h-3 w-3 ${isRetrying ? 'animate-spin' : ''}`} />
        </Button>
      )}
    </div>
  );
}
