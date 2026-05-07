'use client';

/**
 * Inline error message components for forms and UI elements
 */

import React from 'react';
import { AlertCircle, AlertTriangle, Info, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export type ErrorSeverity = 'error' | 'warning' | 'info';

interface ErrorMessageProps {
  message: string;
  severity?: ErrorSeverity;
  title?: string;
  className?: string;
  onDismiss?: () => void;
}

/**
 * Inline error message component
 */
export function ErrorMessage({
  message,
  severity = 'error',
  title,
  className,
  onDismiss,
}: ErrorMessageProps): React.ReactElement {
  const Icon = getIconForSeverity(severity);
  const colorClasses = getColorClasses(severity);

  return (
    <Alert className={cn(colorClasses, className)}>
      <Icon className="h-4 w-4" />
      {title && <AlertTitle>{title}</AlertTitle>}
      <AlertDescription className="flex items-start justify-between gap-2">
        <span>{message}</span>
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="text-current opacity-70 hover:opacity-100 transition-opacity"
            aria-label="Dismiss"
          >
            <XCircle className="h-4 w-4" />
          </button>
        )}
      </AlertDescription>
    </Alert>
  );
}

/**
 * Compact inline error for form fields
 */
export function FieldError({
  message,
  className,
}: {
  message: string;
  className?: string;
}): React.ReactElement {
  return (
    <p className={cn('text-sm text-destructive flex items-center gap-1', className)}>
      <AlertCircle className="h-3 w-3" />
      <span>{message}</span>
    </p>
  );
}

/**
 * Empty state with error styling
 */
export function ErrorEmptyState({
  title,
  message,
  action,
  className,
}: {
  title: string;
  message: string;
  action?: React.ReactNode;
  className?: string;
}): React.ReactElement {
  return (
    <div className={cn('flex flex-col items-center justify-center p-8 text-center', className)}>
      <div className="rounded-full bg-destructive/10 p-3 mb-4">
        <AlertTriangle className="h-6 w-6 text-destructive" />
      </div>
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground mb-4 max-w-md">{message}</p>
      {action}
    </div>
  );
}

/**
 * Get icon component for severity level
 */
function getIconForSeverity(severity: ErrorSeverity): React.ComponentType<{ className?: string }> {
  switch (severity) {
    case 'error':
      return AlertCircle;
    case 'warning':
      return AlertTriangle;
    case 'info':
      return Info;
  }
}

/**
 * Get color classes for severity level
 */
function getColorClasses(severity: ErrorSeverity): string {
  switch (severity) {
    case 'error':
      return 'border-destructive/50 text-destructive dark:border-destructive [&>svg]:text-destructive';
    case 'warning':
      return 'border-yellow-500/50 text-yellow-700 dark:text-yellow-500 [&>svg]:text-yellow-600 dark:[&>svg]:text-yellow-500';
    case 'info':
      return 'border-blue-500/50 text-blue-700 dark:text-blue-400 [&>svg]:text-blue-600 dark:[&>svg]:text-blue-400';
  }
}
