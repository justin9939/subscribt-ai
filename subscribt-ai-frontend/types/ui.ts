/**
 * UI component and state type definitions
 */

/**
 * Toast notification type
 */
export type ToastType = 'success' | 'error' | 'warning' | 'info';

/**
 * Toast notification
 */
export interface Toast {
  /** Unique identifier */
  id: string;
  /** Toast type */
  type: ToastType;
  /** Title */
  title: string;
  /** Description */
  description?: string;
  /** Duration in milliseconds (0 for persistent) */
  duration?: number;
  /** Timestamp (ISO 8601) */
  timestamp: string;
}

/**
 * Loading state
 */
export interface LoadingState {
  /** Whether loading is active */
  isLoading: boolean;
  /** Loading message */
  message?: string;
  /** Progress percentage (0-100) */
  progress?: number;
}

/**
 * Modal state
 */
export interface ModalState {
  /** Whether modal is open */
  isOpen: boolean;
  /** Modal title */
  title?: string;
  /** Modal content type */
  contentType?: string;
  /** Modal data */
  data?: Record<string, unknown>;
}

/**
 * Table sort configuration
 */
export interface TableSort {
  /** Column key to sort by */
  column: string;
  /** Sort direction */
  direction: 'asc' | 'desc';
}

/**
 * Table filter configuration
 */
export interface TableFilter {
  /** Column key to filter */
  column: string;
  /** Filter value */
  value: string | number | boolean;
  /** Filter operator */
  operator?: 'equals' | 'contains' | 'greaterThan' | 'lessThan';
}

/**
 * Table state
 */
export interface TableState {
  /** Current page (0-indexed) */
  page: number;
  /** Page size */
  pageSize: number;
  /** Sort configuration */
  sort?: TableSort;
  /** Filter configurations */
  filters?: TableFilter[];
  /** Selected row IDs */
  selectedRows?: string[];
}

/**
 * File upload state
 */
export interface FileUploadState {
  /** File being uploaded */
  file: File | null;
  /** Upload progress (0-100) */
  progress: number;
  /** Upload status */
  status: 'idle' | 'uploading' | 'processing' | 'complete' | 'error';
  /** Error message (if status is 'error') */
  error?: string;
  /** Document ID (if upload is complete) */
  documentId?: string;
}

/**
 * Sidebar navigation item
 */
export interface NavItem {
  /** Unique identifier */
  id: string;
  /** Display label */
  label: string;
  /** Icon name (from icon library) */
  icon?: string;
  /** Navigation path */
  href: string;
  /** Whether this item is active */
  isActive?: boolean;
  /** Badge content (e.g., notification count) */
  badge?: string | number;
  /** Child navigation items */
  children?: NavItem[];
}

/**
 * Breadcrumb item
 */
export interface BreadcrumbItem {
  /** Display label */
  label: string;
  /** Navigation path (optional for current page) */
  href?: string;
}

/**
 * Chart data point
 */
export interface ChartDataPoint {
  /** X-axis value (timestamp or label) */
  x: string | number;
  /** Y-axis value */
  y: number;
  /** Optional label */
  label?: string;
  /** Optional color */
  color?: string;
}

/**
 * Chart configuration
 */
export interface ChartConfig {
  /** Chart type */
  type: 'line' | 'bar' | 'pie' | 'area';
  /** Chart data */
  data: ChartDataPoint[];
  /** X-axis label */
  xLabel?: string;
  /** Y-axis label */
  yLabel?: string;
  /** Chart title */
  title?: string;
  /** Whether to show legend */
  showLegend?: boolean;
  /** Whether to show grid */
  showGrid?: boolean;
}

/**
 * Empty state configuration
 */
export interface EmptyState {
  /** Icon name */
  icon?: string;
  /** Title */
  title: string;
  /** Description */
  description?: string;
  /** Call-to-action button text */
  actionLabel?: string;
  /** Call-to-action button handler */
  onAction?: () => void;
}

/**
 * Form field validation error
 */
export interface FieldError {
  /** Field name */
  field: string;
  /** Error message */
  message: string;
}

/**
 * Form state
 */
export interface FormState<T = Record<string, unknown>> {
  /** Form values */
  values: T;
  /** Field errors */
  errors: FieldError[];
  /** Whether form is submitting */
  isSubmitting: boolean;
  /** Whether form has been touched */
  isTouched: boolean;
  /** Whether form is valid */
  isValid: boolean;
}
