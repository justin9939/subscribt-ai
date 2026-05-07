# Requirements Document

## Introduction

Subscribt AI is a policy analysis platform that enables users to upload, manage, and query policy documents using AI. The platform translates dense legal language into actionable guidance while maintaining 100% fidelity to source material through strict grounding and verifiable citations.

## Glossary

- **System**: The Subscribt AI platform (frontend and backend components)
- **Document_Ingestion_Pipeline**: The event-driven AWS Step Functions workflow that processes uploaded PDFs through OCR, Markdown conversion, semantic chunking, embedding generation, and vector storage
- **Chat_Service**: The Lambda Function URL endpoint that handles streaming AI responses using RAG and Chain-of-Thought prompting
- **RAG_Engine**: The Retrieval-Augmented Generation system that retrieves relevant document chunks from OpenSearch and generates grounded responses via Amazon Bedrock
- **Vector_Store**: Amazon OpenSearch Serverless instance storing document embeddings
- **Metadata_Store**: Amazon DynamoDB tables storing user data, document metadata, and query logs
- **Analytics_Aggregator**: Lambda function triggered by DynamoDB Streams that computes aggregated query trend data for HR dashboards
- **HR_Manager**: User persona with document upload, management, and analytics access
- **Employee**: Default user persona with document query access
- **Policy_Document**: PDF file containing organizational policies, codes of conduct, laws, or workplace rights documents
- **Document_Chunk**: Semantically coherent section of a Policy_Document split on Markdown header boundaries (H1/H2/H3)
- **Citation**: Direct reference to source material including snippet, page number, section heading, or clause identifier
- **Strict_Grounding**: Requirement that AI responses contain only information present in uploaded Policy_Documents with no hallucination or external knowledge
- **Gap_Analysis**: HR feature identifying topics not covered by current Policy_Documents
- **Query_Log**: Record of an Employee query stored in Metadata_Store (without user identity for HR access)
- **Trend_Data**: Aggregated statistics on query topics computed by Analytics_Aggregator

## Requirements

### Requirement 1: Document Upload and Storage

**User Story:** As an HR_Manager, I want to upload Policy_Documents, so that Employees can query them for policy guidance.

#### Acceptance Criteria

1. WHEN an HR_Manager uploads a PDF file, THE System SHALL store the file in S3 with a unique identifier
2. WHEN a PDF file is stored in S3, THE System SHALL trigger the Document_Ingestion_Pipeline via EventBridge
3. THE System SHALL generate and return a pre-signed URL for secure file upload
4. WHEN a PDF upload exceeds 100MB, THE System SHALL reject the upload and return an error message
5. THE System SHALL store document metadata (filename, upload timestamp, HR_Manager identifier, document status) in Metadata_Store

### Requirement 2: Document OCR Processing

**User Story:** As an HR_Manager, I want uploaded Policy_Documents to be automatically processed, so that their content becomes queryable.

#### Acceptance Criteria

1. WHEN the Document_Ingestion_Pipeline receives an S3 upload event, THE System SHALL invoke AWS Textract StartDocumentAnalysis API
2. THE Document_Ingestion_Pipeline SHALL poll Textract job status until completion or timeout
3. WHEN Textract job completes successfully, THE System SHALL retrieve the OCR results
4. WHEN Textract job fails, THE System SHALL update document status to "failed" in Metadata_Store and log the error to CloudWatch
5. IF Textract processing exceeds 30 minutes, THEN THE Document_Ingestion_Pipeline SHALL timeout and mark the document as failed

### Requirement 3: Markdown Conversion and Semantic Chunking

**User Story:** As a developer, I want Policy_Documents converted to structured Markdown and semantically chunked, so that retrieval precision and citation accuracy are maximized.

#### Acceptance Criteria

1. WHEN OCR results are available, THE System SHALL convert the full document to Markdown preserving headings, tables, and lists
2. THE System SHALL split the Markdown document on header boundaries (H1, H2, H3) to create Document_Chunks
3. WHEN a Document_Chunk exceeds 2000 characters, THE System SHALL split it further while preserving semantic coherence
4. THE System SHALL preserve the document hierarchy and section context for each Document_Chunk
5. THE System SHALL store the original page number and section heading with each Document_Chunk

### Requirement 4: Embedding Generation and Vector Storage

**User Story:** As a developer, I want Document_Chunks embedded and stored in Vector_Store, so that semantic similarity search can retrieve relevant content for queries.

#### Acceptance Criteria

1. WHEN Document_Chunks are created, THE System SHALL generate embeddings using Amazon Titan Embeddings via Bedrock
2. THE System SHALL upsert each Document_Chunk with its embedding, metadata, and source reference into Vector_Store
3. WHEN all Document_Chunks are successfully stored, THE System SHALL update document status to "ready" in Metadata_Store
4. IF embedding generation fails for any chunk, THEN THE System SHALL retry up to 3 times before marking the document as failed
5. THE System SHALL emit structured logs to CloudWatch for each stage of the Document_Ingestion_Pipeline

### Requirement 5: Employee Query Interface

**User Story:** As an Employee, I want to ask questions about Policy_Documents in plain English, so that I can understand my rights and obligations without reading dense legal text.

#### Acceptance Criteria

1. THE System SHALL provide a text input interface for Employees to submit natural language queries
2. WHEN an Employee submits a query, THE System SHALL call the Chat_Service Lambda Function URL
3. THE System SHALL display streaming AI responses token-by-token as they are generated
4. THE System SHALL display Citations alongside each AI response
5. WHEN no Policy_Documents are available, THE System SHALL display a message indicating no documents are queryable

### Requirement 6: RAG-Based Query Processing

**User Story:** As an Employee, I want AI responses grounded in uploaded Policy_Documents, so that I receive accurate policy guidance without hallucinations.

#### Acceptance Criteria

1. WHEN the Chat_Service receives a query, THE RAG_Engine SHALL generate a query embedding using Amazon Titan Embeddings
2. THE RAG_Engine SHALL perform similarity search in Vector_Store to retrieve the top 5 most relevant Document_Chunks
3. THE RAG_Engine SHALL construct a Chain-of-Thought prompt including the retrieved Document_Chunks and the user query
4. THE RAG_Engine SHALL invoke Claude 3.5 Sonnet via Bedrock with the constructed prompt
5. THE RAG_Engine SHALL stream the response tokens to the client via Lambda Function URL response streaming

### Requirement 7: Strict Grounding Enforcement

**User Story:** As an Employee, I want to know when my question is not addressed in the Policy_Documents, so that I do not receive hallucinated or inferred information.

#### Acceptance Criteria

1. WHEN no relevant Document_Chunks are retrieved (similarity score below threshold), THE RAG_Engine SHALL return "Not addressed in the provided policy."
2. THE RAG_Engine SHALL include prompt instructions that prohibit Claude from using external knowledge or making inferences beyond retrieved Document_Chunks
3. THE RAG_Engine SHALL validate that every statement in the AI response references at least one retrieved Document_Chunk
4. IF the AI response contains information not present in retrieved Document_Chunks, THEN THE System SHALL replace the response with "Not addressed in the provided policy."
5. THE System SHALL log all queries and responses to CloudWatch for audit purposes

### Requirement 8: Citation Generation

**User Story:** As an Employee, I want every AI response to include Citations, so that I can verify the information against the source Policy_Document.

#### Acceptance Criteria

1. WHEN the RAG_Engine generates a response, THE System SHALL extract Citations from the retrieved Document_Chunks
2. THE System SHALL include at least one of the following for each Citation: snippet excerpt, page number, section heading, or clause identifier
3. THE System SHALL display Citations in a visually distinct format alongside the AI response
4. THE System SHALL link each statement in the AI response to its corresponding Citation
5. WHEN multiple Document_Chunks support a statement, THE System SHALL include all relevant Citations

### Requirement 9: Query Logging and Privacy

**User Story:** As an Employee, I want my queries logged for analytics without revealing my identity to HR_Managers, so that my privacy is protected while enabling trend analysis.

#### Acceptance Criteria

1. WHEN an Employee submits a query, THE System SHALL store a Query_Log in Metadata_Store
2. THE Query_Log SHALL include query text, timestamp, document identifiers, and anonymized user identifier
3. THE Query_Log SHALL NOT include any personally identifiable information that could reveal the Employee's identity to HR_Managers
4. WHEN a Query_Log is written to Metadata_Store, THE System SHALL trigger a DynamoDB Stream event
5. THE System SHALL retain Query_Logs for 90 days before automatic deletion

### Requirement 10: HR Analytics Aggregation

**User Story:** As an HR_Manager, I want to see aggregated Trend_Data on Employee queries, so that I can identify common concerns and policy gaps.

#### Acceptance Criteria

1. WHEN a Query_Log is written to Metadata_Store, THE Analytics_Aggregator SHALL process the DynamoDB Stream event
2. THE Analytics_Aggregator SHALL extract query topics and update aggregate counts in a separate aggregates table
3. THE Analytics_Aggregator SHALL compute daily, weekly, and monthly query volume statistics
4. THE Analytics_Aggregator SHALL identify the top 10 most queried topics per time period
5. THE Analytics_Aggregator SHALL emit structured logs to CloudWatch for all aggregation operations

### Requirement 11: HR Analytics Dashboard

**User Story:** As an HR_Manager, I want to view Trend_Data on a dashboard, so that I can understand which policy topics are most frequently queried.

#### Acceptance Criteria

1. THE System SHALL provide an HR_Manager dashboard displaying Trend_Data from the aggregates table
2. THE dashboard SHALL display query volume trends over time (daily, weekly, monthly views)
3. THE dashboard SHALL display the top 10 most queried topics with query counts
4. THE dashboard SHALL allow filtering by date range and Policy_Document
5. THE dashboard SHALL NOT display individual Employee queries or any information that could identify specific Employees

### Requirement 12: Gap Analysis

**User Story:** As an HR_Manager, I want to identify topics not covered by current Policy_Documents, so that I can address policy gaps.

#### Acceptance Criteria

1. WHEN an Employee query returns "Not addressed in the provided policy," THE System SHALL flag the query topic for Gap_Analysis
2. THE System SHALL aggregate flagged query topics in the Gap_Analysis section of the HR dashboard
3. THE Gap_Analysis SHALL display the frequency of queries for topics not covered by Policy_Documents
4. THE Gap_Analysis SHALL rank uncovered topics by query frequency
5. THE System SHALL allow HR_Managers to mark gap topics as "addressed" after uploading new Policy_Documents

### Requirement 13: Document Management

**User Story:** As an HR_Manager, I want to view and manage uploaded Policy_Documents, so that I can keep policy content current.

#### Acceptance Criteria

1. THE System SHALL provide an HR_Manager interface listing all uploaded Policy_Documents with metadata
2. THE interface SHALL display document status (processing, ready, failed) for each Policy_Document
3. THE System SHALL allow HR_Managers to delete Policy_Documents
4. WHEN an HR_Manager deletes a Policy_Document, THE System SHALL remove the file from S3, delete associated Document_Chunks from Vector_Store, and update Metadata_Store
5. THE System SHALL display processing errors for failed Policy_Documents with actionable error messages

### Requirement 14: Persona-Based Routing

**User Story:** As a user, I want to be automatically routed to the appropriate interface based on my persona, so that I see only relevant features.

#### Acceptance Criteria

1. THE System SHALL route HR_Managers to the (hr) route group
2. THE System SHALL route all other users to the (employee) route group as the default persona
3. THE System SHALL enforce persona separation at the routing level
4. THE System SHALL prevent Employees from accessing HR_Manager routes
5. THE System SHALL display persona-specific navigation and layouts

### Requirement 15: Security and Access Control

**User Story:** As a system administrator, I want all S3 buckets private and access controlled via IAM, so that Policy_Documents are not publicly accessible.

#### Acceptance Criteria

1. THE System SHALL configure all S3 buckets as private with no public access
2. THE System SHALL use pre-signed URLs for file uploads with expiration times
3. THE System SHALL use scoped IAM roles for Lambda functions accessing S3, OpenSearch, DynamoDB, and Bedrock
4. THE System SHALL enforce HTTPS for all API communications
5. THE System SHALL validate and sanitize all user inputs before processing

### Requirement 16: Observability and Tracing

**User Story:** As a developer, I want structured logging and distributed tracing, so that I can debug issues and audit system behavior.

#### Acceptance Criteria

1. THE System SHALL emit structured JSON logs to CloudWatch for all Lambda functions
2. THE logs SHALL include request identifiers, user identifiers (anonymized for Employees), timestamps, and operation outcomes
3. THE System SHALL enable AWS X-Ray tracing for all Lambda functions
4. THE X-Ray traces SHALL capture the full request path from frontend through Chat_Service, RAG_Engine, Vector_Store, and Bedrock
5. THE System SHALL log all Document_Ingestion_Pipeline state transitions to CloudWatch

### Requirement 17: Error Handling and User Feedback

**User Story:** As a user, I want clear error messages when operations fail, so that I understand what went wrong and how to proceed.

#### Acceptance Criteria

1. WHEN a document upload fails, THE System SHALL display a specific error message (file too large, invalid format, network error)
2. WHEN the Chat_Service is unavailable, THE System SHALL display a retry message with estimated wait time
3. WHEN document processing fails, THE System SHALL notify the HR_Manager with the failure reason
4. THE System SHALL provide user-friendly error messages that do not expose internal system details
5. THE System SHALL log detailed error information to CloudWatch for debugging

### Requirement 18: Frontend Type Safety

**User Story:** As a developer, I want all frontend code written in TypeScript with strict mode, so that type errors are caught at compile time.

#### Acceptance Criteria

1. THE System SHALL use TypeScript for all frontend code with strict mode enabled
2. THE System SHALL define shared types in the /types directory
3. THE System SHALL use Pydantic models for all Lambda handler inputs and outputs
4. THE System SHALL validate API request and response types at runtime
5. THE System SHALL fail the build if TypeScript compilation errors are present

### Requirement 19: Component Library Standards

**User Story:** As a developer, I want to use shadcn/ui components consistently, so that the UI is cohesive and maintainable.

#### Acceptance Criteria

1. THE System SHALL use shadcn/ui components as the base for all UI elements
2. THE System SHALL place shared UI components in components/ui/
3. THE System SHALL place feature-specific components in components/

### Requirement 20: Centralized Business Logic

**User Story:** As a developer, I want all database and AI operations centralized in lib/, so that business logic is auditable and reusable.

#### Acceptance Criteria

1. THE System SHALL place all DynamoDB queries in lib/db/
2. THE System SHALL place all AI prompt construction and model calls in lib/ai/
3. THE System SHALL place all OpenSearch operations in lib/opensearch/
4. THE System SHALL place all Chat_Service client utilities in lib/chat/
5. THE System SHALL NOT include database or AI calls outside these designated directories
