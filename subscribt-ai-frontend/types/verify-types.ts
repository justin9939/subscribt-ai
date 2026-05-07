/**
 * Type verification script
 * 
 * This file contains compile-time tests to verify that all types
 * are correctly defined and work as expected. If this file compiles
 * without errors, all types are valid.
 * 
 * Run: npx tsc --noEmit types/verify-types.ts
 */

import type {
  // Document types
  Document,
  DocumentStatus,
  DocumentUploadRequest,
  DocumentUploadResponse,
  
  // Query types
  Citation,
  QueryRequest,
  QueryResponse,
  StreamChunk,
  
  // Analytics types
  TrendData,
  GapAnalysisEntry,
  TopicFrequency,
  
  // User types
  User,
  Persona,
  
  // API types
  APIResponse,
  APIError,
  PaginatedResponse,
  
  // Chat types
  ChatMessage,
  ChatSession,
  StreamingCallbacks,
  
  // UI types
  Toast,
  LoadingState,
  FormState,
} from './index';

import {
  isDocument,
  isCitation,
  isQueryResponse,
  isStreamChunk,
  isPersona,
  isValidTimestamp,
  isValidUUID,
  ErrorCode,
  HTTPStatus,
} from './index';

// ============================================================================
// Document Type Tests
// ============================================================================

const testDocument: Document = {
  id: '123e4567-e89b-12d3-a456-426614174000',
  filename: 'test.pdf',
  uploadedAt: '2024-01-15T10:30:00Z',
  uploadedBy: 'user-123',
  status: 'ready',
  s3Key: 'documents/test.pdf',
  fileSize: 1024000,
  updatedAt: '2024-01-15T10:35:00Z',
  chunkCount: 42,
};

const testDocumentStatus: DocumentStatus = 'processing';

const testUploadRequest: DocumentUploadRequest = {
  filename: 'policy.pdf',
  contentType: 'application/pdf',
  fileSize: 2048000,
};

const testUploadResponse: DocumentUploadResponse = {
  documentId: '123e4567-e89b-12d3-a456-426614174000',
  uploadUrl: 'https://s3.amazonaws.com/...',
  expiresAt: '2024-01-15T11:00:00Z',
};

// ============================================================================
// Query Type Tests
// ============================================================================

const testCitation: Citation = {
  id: 'citation-1',
  documentId: 'doc-123',
  chunkId: 'chunk-456',
  snippet: 'Employees are entitled to...',
  pageNumber: 5,
  sectionHeading: 'Employee Rights',
  hierarchyPath: 'Chapter 2 > Section 2.1',
  relevanceScore: 0.95,
};

const testQueryRequest: QueryRequest = {
  query: 'What is the remote work policy?',
  documentIds: ['doc-123', 'doc-456'],
  maxChunks: 5,
};

const testQueryResponse: QueryResponse = {
  queryId: 'query-789',
  response: 'According to the policy...',
  citations: [testCitation],
  isAnswered: true,
  timestamp: '2024-01-15T10:30:00Z',
  processingTimeMs: 1250,
};

const testStreamChunkToken: StreamChunk = {
  type: 'token',
  token: 'Hello',
};

const testStreamChunkCitation: StreamChunk = {
  type: 'citation',
  citation: testCitation,
};

const testStreamChunkError: StreamChunk = {
  type: 'error',
  error: 'Processing failed',
};

const testStreamChunkDone: StreamChunk = {
  type: 'done',
};

// ============================================================================
// Analytics Type Tests
// ============================================================================

const testTopicFrequency: TopicFrequency = {
  topic: 'Remote Work',
  queryCount: 42,
  percentage: 15.5,
  trend: 'up',
  trendPercentage: 12.3,
};

const testTrendData: TrendData = {
  period: 'weekly',
  stats: {
    period: 'weekly',
    startDate: '2024-01-08T00:00:00Z',
    endDate: '2024-01-14T23:59:59Z',
    totalQueries: 150,
    answeredQueries: 135,
    unansweredQueries: 15,
    answerRate: 0.9,
  },
  topTopics: [testTopicFrequency],
  volumeTimeSeries: [
    { timestamp: '2024-01-08T00:00:00Z', value: 20 },
    { timestamp: '2024-01-09T00:00:00Z', value: 25 },
  ],
};

const testGapAnalysisEntry: GapAnalysisEntry = {
  id: 'gap-1',
  topic: 'Cryptocurrency compensation',
  queryCount: 8,
  sampleQueries: ['Can I be paid in Bitcoin?', 'Does the company accept crypto?'],
  firstOccurrence: '2024-01-10T09:00:00Z',
  lastOccurrence: '2024-01-14T16:30:00Z',
  isAddressed: false,
};

// ============================================================================
// User Type Tests
// ============================================================================

const testPersona: Persona = 'employee';

const testUser: User = {
  id: 'user-123',
  email: 'employee@example.com',
  name: 'John Doe',
  persona: 'employee',
  organizationId: 'org-456',
  createdAt: '2024-01-01T00:00:00Z',
  lastLoginAt: '2024-01-15T10:00:00Z',
};

// ============================================================================
// API Type Tests
// ============================================================================

const testAPIError: APIError = {
  code: 'DOCUMENT_NOT_FOUND',
  message: 'The requested document does not exist',
  timestamp: '2024-01-15T10:30:00Z',
  requestId: 'req-789',
};

const testAPIResponse: APIResponse<Document> = {
  success: true,
  data: testDocument,
  requestId: 'req-123',
  timestamp: '2024-01-15T10:30:00Z',
};

const testAPIErrorResponse: APIResponse<Document> = {
  success: false,
  error: testAPIError,
  requestId: 'req-456',
  timestamp: '2024-01-15T10:30:00Z',
};

const testPaginatedResponse: PaginatedResponse<Document> = {
  items: [testDocument],
  totalCount: 100,
  nextToken: 'token-abc',
  hasMore: true,
};

const testErrorCode: ErrorCode = ErrorCode.UNAUTHORIZED;
const testHTTPStatus: HTTPStatus = HTTPStatus.OK;

// ============================================================================
// Chat Type Tests
// ============================================================================

const testChatMessage: ChatMessage = {
  id: 'msg-1',
  role: 'user',
  content: 'What is the vacation policy?',
  timestamp: '2024-01-15T10:30:00Z',
  status: 'complete',
};

const testChatSession: ChatSession = {
  id: 'session-1',
  userId: 'user-123',
  messages: [testChatMessage],
  createdAt: '2024-01-15T10:00:00Z',
  updatedAt: '2024-01-15T10:30:00Z',
  title: 'Vacation Policy Discussion',
};

const testStreamingCallbacks: StreamingCallbacks = {
  onToken: (token: string) => console.log(token),
  onCitation: (citation: Citation) => console.log(citation),
  onError: (error: string) => console.error(error),
  onComplete: () => console.log('Done'),
};

// ============================================================================
// UI Type Tests
// ============================================================================

const testToast: Toast = {
  id: 'toast-1',
  type: 'success',
  title: 'Document uploaded',
  description: 'Your document is being processed',
  duration: 5000,
  timestamp: '2024-01-15T10:30:00Z',
};

const testLoadingState: LoadingState = {
  isLoading: true,
  message: 'Processing document...',
  progress: 65,
};

const testFormState: FormState<{ email: string; password: string }> = {
  values: { email: 'user@example.com', password: 'secret' },
  errors: [],
  isSubmitting: false,
  isTouched: true,
  isValid: true,
};

// ============================================================================
// Type Guard Tests
// ============================================================================

function testTypeGuards() {
  // Document guard
  if (isDocument(testDocument)) {
    const filename: string = testDocument.filename;
    console.log(filename);
  }

  // Citation guard
  if (isCitation(testCitation)) {
    const snippet: string = testCitation.snippet;
    console.log(snippet);
  }

  // QueryResponse guard
  if (isQueryResponse(testQueryResponse)) {
    const response: string = testQueryResponse.response;
    console.log(response);
  }

  // StreamChunk guard
  if (isStreamChunk(testStreamChunkToken)) {
    if (testStreamChunkToken.type === 'token') {
      const token: string = testStreamChunkToken.token;
      console.log(token);
    }
  }

  // Persona guard
  const unknownPersona: unknown = 'employee';
  if (isPersona(unknownPersona)) {
    const persona: Persona = unknownPersona;
    console.log(persona);
  }

  // Timestamp validation
  const timestamp = '2024-01-15T10:30:00Z';
  if (isValidTimestamp(timestamp)) {
    const date = new Date(timestamp);
    console.log(date);
  }

  // UUID validation
  const uuid = '123e4567-e89b-12d3-a456-426614174000';
  if (isValidUUID(uuid)) {
    console.log('Valid UUID:', uuid);
  }
}

// ============================================================================
// Discriminated Union Tests
// ============================================================================

function handleStreamChunk(chunk: StreamChunk) {
  switch (chunk.type) {
    case 'token':
      // TypeScript knows chunk.token exists here
      console.log(chunk.token);
      break;
    case 'citation':
      // TypeScript knows chunk.citation exists here
      console.log(chunk.citation.snippet);
      break;
    case 'metadata':
      // TypeScript knows chunk.metadata exists here
      console.log(chunk.metadata?.queryId);
      break;
    case 'error':
      // TypeScript knows chunk.error exists here
      console.error(chunk.error);
      break;
    case 'done':
      console.log('Stream complete');
      break;
  }
}

// ============================================================================
// Type Inference Tests
// ============================================================================

function testTypeInference() {
  // APIResponse type inference
  const response: APIResponse<Document> = testAPIResponse;
  if (response.success && response.data) {
    // TypeScript infers response.data is Document
    const doc: Document = response.data;
    console.log(doc.filename);
  }

  // PaginatedResponse type inference
  const paginated: PaginatedResponse<Document> = testPaginatedResponse;
  paginated.items.forEach((doc: Document) => {
    console.log(doc.filename);
  });
}

// ============================================================================
// Export verification function
// ============================================================================

export function verifyTypes(): void {
  console.log('All types verified successfully!');
  testTypeGuards();
  handleStreamChunk(testStreamChunkToken);
  testTypeInference();
}
