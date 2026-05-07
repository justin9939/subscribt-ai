'use client';

/**
 * Combined loading, error, and empty state component
 */

import React from 'react';
import { Loader2, AlertCircle, FileQuestion } from 'lucide-react';
import { ErrorRetry } from './error-retry';
import { AppError } from '@/lib/errors/error-handler';

interface LoadingErrorStateProps<T> {
  isLoading: boolean;
  error: Error | AppError | null;
  data: T | null | undefined;
  onRetry?: () => void | Promise<void>;
  loadingMessage?: string;
  emptyMessage?: string;
  emptyTitle?: string;
  emptyAction?: React.ReactNode;
  children: (data: T) => React.ReactNode;
  className?: string;
}

/**
 * Unified component for handling loading, error, empty, and success states
 */
export function LoadingErrorState<T>({
  isLoading,
  error,
  data,
  onRetry,
  loadingMessage = 'Loading...',
  emptyMessage = 'No data available',
  emptyTitle = 'Nothing here yet',
  emptyAction,
  children,
  className,
}: LoadingErrorStateProps<T>): React.ReactElement {
  // Loading state
  if (isLoading) {
    return (
      <div className={`flex flex-col items-center justify-center p-8 ${className}`}>
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mb-4" />
        <p className="text-sm text-muted-foreground">{loadingMessage}</p>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className={`flex items-center justify-center p-4 ${className}`}>
        {onRetry ? (
          <ErrorRetry error={error} onRetry={onRetry} className="max-w-md" />
        ) : (
          <div className="flex flex-col items-center text-center max-w-md">
            <AlertCircle className="h-8 w-8 text-destructive mb-4" />
            <p className="text-sm text-muted-foreground">{error.message}</p>
          </div>
        )}
      </div>
    );
  }

  // Empty state
  if (!data || (Array.isArray(data) && data.length === 0)) {
    return (
      <div className={`flex flex-col items-center justify-center p-8 text-center ${className}`}>
        <div className="rounded-full bg-muted p-3 mb-4">
          <FileQuestion className="h-6 w-6 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold mb-2">{emptyTitle}</h3>
        <p className="text-sm text-muted-foreground mb-4 max-w-md">{emptyMessage}</p>
        {emptyAction}
      </div>
    );
  }

  // Success state - render children with data
  return <>{children(data)}</>;
}

/**
 * Simple loading spinner
 */
export function LoadingSpinner({
  message,
  className,
}: {
  message?: string;
  className?: string;
}): React.ReactElement {
  return (
    <div className={`flex flex-col items-center justify-center gap-3 ${className}`}>
      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      {message && <p className="text-sm text-muted-foreground">{message}</p>}
    </div>
  );
}

/**
 * Inline loading spinner (for buttons, etc.)
 */
export function InlineLoadingSpinner({
  className,
}: {
  className?: string;
}): React.ReactElement {
  return <Loader2 className={`h-4 w-4 animate-spin ${className}`} />;
}
