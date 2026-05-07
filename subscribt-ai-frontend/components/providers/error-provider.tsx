'use client';

/**
 * Client-side error boundary provider
 * Wraps the app with error boundaries and network status detection
 */

import React from 'react';
import { ErrorBoundary } from '@/components/error-boundary';
import { NetworkErrorBoundary, NetworkStatusIndicator } from '@/components/network-error-boundary';

interface ErrorProviderProps {
  children: React.ReactNode;
}

/**
 * Provider that wraps the app with error handling capabilities
 */
export function ErrorProvider({ children }: ErrorProviderProps): React.ReactElement {
  return (
    <NetworkErrorBoundary>
      <ErrorBoundary>
        {children}
        <NetworkStatusIndicator />
      </ErrorBoundary>
    </NetworkErrorBoundary>
  );
}
