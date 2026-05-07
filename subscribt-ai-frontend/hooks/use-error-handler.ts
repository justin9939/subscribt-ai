/**
 * React hook for centralized error handling
 */

import { useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import {
  getUserFriendlyMessage,
  isAuthError,
  logError,
  normalizeError,
} from '@/lib/errors/error-handler';

interface UseErrorHandlerOptions {
  onAuthError?: () => void;
  logErrors?: boolean;
}

interface UseErrorHandlerReturn {
  handleError: (error: unknown, context?: Record<string, unknown>) => void;
  showErrorToast: (error: unknown, title?: string) => void;
}

/**
 * Hook for handling errors with toast notifications and logging
 */
export function useErrorHandler(
  options: UseErrorHandlerOptions = {}
): UseErrorHandlerReturn {
  const { toast } = useToast();
  const { onAuthError, logErrors = true } = options;

  const handleError = useCallback(
    (error: unknown, context?: Record<string, unknown>): void => {
      const normalizedError = normalizeError(error);

      // Log error if enabled
      if (logErrors) {
        logError(normalizedError, context);
      }

      // Handle authentication errors
      if (isAuthError(normalizedError)) {
        onAuthError?.();
        return;
      }

      // Show error toast
      const message = getUserFriendlyMessage(normalizedError);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: message,
      });
    },
    [toast, onAuthError, logErrors]
  );

  const showErrorToast = useCallback(
    (error: unknown, title = 'Error'): void => {
      const normalizedError = normalizeError(error);
      const message = getUserFriendlyMessage(normalizedError);

      toast({
        variant: 'destructive',
        title,
        description: message,
      });
    },
    [toast]
  );

  return {
    handleError,
    showErrorToast,
  };
}

/**
 * Hook for async operations with error handling
 */
export function useAsyncError<T extends (...args: any[]) => Promise<any>>(
  asyncFn: T,
  options: UseErrorHandlerOptions = {}
): [T, boolean, Error | null] {
  const { handleError } = useErrorHandler(options);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<Error | null>(null);

  const wrappedFn = useCallback(
    async (...args: Parameters<T>): Promise<ReturnType<T>> => {
      setIsLoading(true);
      setError(null);

      try {
        const result = await asyncFn(...args);
        return result;
      } catch (err) {
        const normalizedError = normalizeError(err);
        setError(normalizedError);
        handleError(normalizedError);
        throw normalizedError;
      } finally {
        setIsLoading(false);
      }
    },
    [asyncFn, handleError]
  ) as T;

  return [wrappedFn, isLoading, error];
}

// Import React for useState
import React from 'react';
