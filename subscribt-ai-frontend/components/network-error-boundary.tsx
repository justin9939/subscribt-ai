'use client';

/**
 * Network-aware error boundary with offline detection
 */

import React, { Component, ReactNode } from 'react';
import { WifiOff, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

interface NetworkErrorBoundaryProps {
  children: ReactNode;
}

interface NetworkErrorBoundaryState {
  isOnline: boolean;
  hasNetworkError: boolean;
}

/**
 * Error boundary that detects and handles network connectivity issues
 */
export class NetworkErrorBoundary extends Component<
  NetworkErrorBoundaryProps,
  NetworkErrorBoundaryState
> {
  constructor(props: NetworkErrorBoundaryProps) {
    super(props);
    this.state = {
      isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
      hasNetworkError: false,
    };
  }

  componentDidMount(): void {
    window.addEventListener('online', this.handleOnline);
    window.addEventListener('offline', this.handleOffline);
  }

  componentWillUnmount(): void {
    window.removeEventListener('online', this.handleOnline);
    window.removeEventListener('offline', this.handleOffline);
  }

  handleOnline = (): void => {
    this.setState({ isOnline: true, hasNetworkError: false });
  };

  handleOffline = (): void => {
    this.setState({ isOnline: false, hasNetworkError: true });
  };

  handleRetry = (): void => {
    if (navigator.onLine) {
      this.setState({ hasNetworkError: false });
      window.location.reload();
    }
  };

  render(): ReactNode {
    if (!this.state.isOnline || this.state.hasNetworkError) {
      return (
        <div className="flex min-h-screen items-center justify-center p-4 bg-background">
          <Card className="w-full max-w-md">
            <CardHeader>
              <div className="flex items-center gap-2">
                <WifiOff className="h-5 w-5 text-destructive" />
                <CardTitle>No Internet Connection</CardTitle>
              </div>
              <CardDescription>
                Please check your network connection and try again.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md bg-muted p-4 text-center">
                <p className="text-sm text-muted-foreground">
                  {this.state.isOnline
                    ? 'Connection restored. Click retry to continue.'
                    : 'You appear to be offline. Some features may not work.'}
                </p>
              </div>
            </CardContent>
            <CardFooter>
              <Button
                onClick={this.handleRetry}
                disabled={!this.state.isOnline}
                className="w-full"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                {this.state.isOnline ? 'Retry' : 'Waiting for connection...'}
              </Button>
            </CardFooter>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Hook to detect online/offline status
 */
export function useNetworkStatus(): boolean {
  const [isOnline, setIsOnline] = React.useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  React.useEffect(() => {
    const handleOnline = (): void => setIsOnline(true);
    const handleOffline = (): void => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}

/**
 * Inline network status indicator
 */
export function NetworkStatusIndicator(): React.ReactElement | null {
  const isOnline = useNetworkStatus();

  if (isOnline) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className="flex items-center gap-2 bg-destructive text-destructive-foreground px-4 py-2 rounded-md shadow-lg">
        <WifiOff className="h-4 w-4" />
        <span className="text-sm font-medium">Offline</span>
      </div>
    </div>
  );
}
