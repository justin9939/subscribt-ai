/**
 * Analytics and trend data type definitions
 */

/**
 * Time period for analytics aggregation
 */
export type TimePeriod = 'daily' | 'weekly' | 'monthly';

/**
 * Aggregated query statistics
 */
export interface QueryStats {
  /** Time period */
  period: TimePeriod;
  /** Start date (ISO 8601) */
  startDate: string;
  /** End date (ISO 8601) */
  endDate: string;
  /** Total query count */
  totalQueries: number;
  /** Number of answered queries */
  answeredQueries: number;
  /** Number of unanswered queries */
  unansweredQueries: number;
  /** Answer rate (0-1) */
  answerRate: number;
}

/**
 * Topic with query frequency
 */
export interface TopicFrequency {
  /** Topic name/category */
  topic: string;
  /** Number of queries for this topic */
  queryCount: number;
  /** Percentage of total queries */
  percentage: number;
  /** Trend compared to previous period ('up' | 'down' | 'stable') */
  trend?: 'up' | 'down' | 'stable';
  /** Percentage change from previous period */
  trendPercentage?: number;
}

/**
 * Trend data for HR dashboard
 */
export interface TrendData {
  /** Time period */
  period: TimePeriod;
  /** Query statistics */
  stats: QueryStats;
  /** Top queried topics */
  topTopics: TopicFrequency[];
  /** Query volume over time (time series) */
  volumeTimeSeries: TimeSeriesDataPoint[];
}

/**
 * Time series data point
 */
export interface TimeSeriesDataPoint {
  /** Timestamp (ISO 8601) */
  timestamp: string;
  /** Query count */
  value: number;
  /** Optional label */
  label?: string;
}

/**
 * Gap analysis entry
 */
export interface GapAnalysisEntry {
  /** Unique identifier */
  id: string;
  /** Topic not covered by policy documents */
  topic: string;
  /** Number of queries for this uncovered topic */
  queryCount: number;
  /** Sample queries */
  sampleQueries: string[];
  /** First occurrence timestamp (ISO 8601) */
  firstOccurrence: string;
  /** Last occurrence timestamp (ISO 8601) */
  lastOccurrence: string;
  /** Whether HR has marked this as addressed */
  isAddressed: boolean;
  /** Document ID that addresses this gap (if marked as addressed) */
  addressedByDocumentId?: string;
  /** Timestamp when marked as addressed (ISO 8601) */
  addressedAt?: string;
}

/**
 * Request to mark a gap as addressed
 */
export interface MarkGapAddressedRequest {
  /** Gap analysis entry ID */
  gapId: string;
  /** Document ID that addresses the gap */
  documentId: string;
}

/**
 * Response from marking a gap as addressed
 */
export interface MarkGapAddressedResponse {
  /** Whether the operation was successful */
  success: boolean;
  /** Optional message */
  message?: string;
}

/**
 * Filter options for analytics queries
 */
export interface AnalyticsFilter {
  /** Time period */
  period: TimePeriod;
  /** Start date (ISO 8601) */
  startDate?: string;
  /** End date (ISO 8601) */
  endDate?: string;
  /** Filter by specific document IDs */
  documentIds?: string[];
}

/**
 * Analytics dashboard data
 */
export interface AnalyticsDashboardData {
  /** Trend data */
  trends: TrendData;
  /** Gap analysis entries */
  gaps: GapAnalysisEntry[];
  /** Document-specific statistics */
  documentStats: DocumentStatistics[];
}

/**
 * Statistics for a specific document
 */
export interface DocumentStatistics {
  /** Document ID */
  documentId: string;
  /** Document filename */
  filename: string;
  /** Number of queries against this document */
  queryCount: number;
  /** Answer rate for this document (0-1) */
  answerRate: number;
  /** Most queried topics for this document */
  topTopics: TopicFrequency[];
}
