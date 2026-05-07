# Pre-signed URL Generator - Architecture

## System Overview

The pre-signed URL generator enables secure, direct-to-S3 file uploads without routing files through application servers. This architecture provides better performance, lower costs, and improved security.

## High-Level Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                         Upload Flow                                  │
└─────────────────────────────────────────────────────────────────────┘

1. User selects PDF file in browser
   │
   ├─→ Client validates file (type, size, extension)
   │
2. Frontend requests pre-signed URL
   │
   POST /api/upload/presigned-url
   {
     filename: "handbook.pdf",
     content_type: "application/pdf",
     hr_manager_id: "hr-123",
     file_size_bytes: 5242880
   }
   │
   ↓
3. API Gateway → Lambda
   │
   ├─→ Lambda validates request (Pydantic)
   ├─→ Lambda generates document_id (UUID)
   ├─→ Lambda generates S3 key
   ├─→ Lambda creates pre-signed URL (S3)
   ├─→ Lambda stores metadata (DynamoDB)
   │
   ↓
4. Lambda returns response
   {
     document_id: "uuid",
     upload_url: "https://s3.amazonaws.com/...",
     expires_at: "2026-05-07T15:30:00Z",
     s3_key: "documents/uuid/original.pdf"
   }
   │
   ↓
5. Frontend uploads file directly to S3
   │
   PUT https://s3.amazonaws.com/...
   Content-Type: application/pdf
   Body: <file binary data>
   │
   ↓
6. S3 stores file
   │
   ├─→ S3 emits event to EventBridge
   │
   ↓
7. EventBridge triggers Step Functions
   │
   └─→ Document processing pipeline begins
```

## Component Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                         Frontend (Next.js)                        │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │  Upload Component                                           │  │
│  │  - File selection                                           │  │
│  │  - Client-side validation                                   │  │
│  │  - Progress tracking                                        │  │
│  │  - Error handling                                           │  │
│  └────────────────────────────────────────────────────────────┘  │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │  lib/api/upload.ts                                          │  │
│  │  - validateFile()                                           │  │
│  │  - getPresignedUrl()                                        │  │
│  │  - uploadToS3()                                             │  │
│  │  - uploadDocument()                                         │  │
│  └────────────────────────────────────────────────────────────┘  │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │  types/upload.ts                                            │  │
│  │  - TypeScript interfaces                                    │  │
│  │  - Type definitions                                         │  │
│  └────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────┘
                              │
                              │ HTTPS
                              ↓
┌──────────────────────────────────────────────────────────────────┐
│                      API Gateway                                  │
│  - CORS configuration                                             │
│  - Request routing                                                │
│  - Throttling                                                     │
└──────────────────────────────────────────────────────────────────┘
                              │
                              ↓
┌──────────────────────────────────────────────────────────────────┐
│              Lambda: Pre-signed URL Generator                     │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │  handler.py                                                 │  │
│  │  ┌──────────────────────────────────────────────────────┐  │  │
│  │  │  1. Parse and validate request (Pydantic)            │  │  │
│  │  │     - Check file type (PDF only)                     │  │  │
│  │  │     - Check file size (≤ 100MB)                      │  │  │
│  │  │     - Check filename extension                       │  │  │
│  │  └──────────────────────────────────────────────────────┘  │  │
│  │  ┌──────────────────────────────────────────────────────┐  │  │
│  │  │  2. Generate document ID (UUID)                      │  │  │
│  │  └──────────────────────────────────────────────────────┘  │  │
│  │  ┌──────────────────────────────────────────────────────┐  │  │
│  │  │  3. Generate S3 key                                  │  │  │
│  │  │     documents/{document_id}/original.pdf             │  │  │
│  │  └──────────────────────────────────────────────────────┘  │  │
│  │  ┌──────────────────────────────────────────────────────┐  │  │
│  │  │  4. Create pre-signed URL (S3)                       │  │  │
│  │  │     - Set expiration (1 hour)                        │  │  │
│  │  │     - Enforce content type                           │  │  │
│  │  │     - Enforce content length                         │  │  │
│  │  └──────────────────────────────────────────────────────┘  │  │
│  │  ┌──────────────────────────────────────────────────────┐  │  │
│  │  │  5. Store metadata (DynamoDB)                        │  │  │
│  │  │     - document_id, filename, hr_manager_id           │  │  │
│  │  │     - s3_key, s3_bucket, file_size_bytes             │  │  │
│  │  │     - status: "uploading"                            │  │  │
│  │  │     - created_at, updated_at                         │  │  │
│  │  └──────────────────────────────────────────────────────┘  │  │
│  │  ┌──────────────────────────────────────────────────────┐  │  │
│  │  │  6. Return response                                  │  │  │
│  │  │     - document_id, upload_url, expires_at, s3_key    │  │  │
│  │  └──────────────────────────────────────────────────────┘  │  │
│  └────────────────────────────────────────────────────────────┘  │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │  AWS Lambda Powertools                                      │  │
│  │  - Structured logging (CloudWatch)                          │  │
│  │  - Distributed tracing (X-Ray)                              │  │
│  │  - Metrics (CloudWatch)                                     │  │
│  └────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────┘
                    │                        │
                    │                        │
                    ↓                        ↓
┌─────────────────────────────┐  ┌─────────────────────────────┐
│         S3 Bucket            │  │        DynamoDB              │
│  - Private access            │  │  - Document metadata         │
│  - Versioning enabled        │  │  - Status tracking           │
│  - Encryption at rest        │  │  - Query logs                │
│  - Lifecycle policies        │  │  - Streams enabled           │
└─────────────────────────────┘  └─────────────────────────────┘
                    │
                    │ S3 Event
                    ↓
┌─────────────────────────────┐
│       EventBridge            │
│  - S3 upload events          │
│  - Event filtering           │
└─────────────────────────────┘
                    │
                    ↓
┌─────────────────────────────┐
│     Step Functions           │
│  - Document processing       │
│  - OCR pipeline              │
│  - Chunking & embedding      │
└─────────────────────────────┘
```

## Data Flow

### Request Flow

```
┌─────────────┐
│   Browser   │
└──────┬──────┘
       │
       │ 1. User selects file
       │
       ↓
┌──────────────────────────────────────┐
│  Client-side Validation               │
│  ✓ File type: application/pdf         │
│  ✓ File size: ≤ 100MB                 │
│  ✓ Filename: ends with .pdf           │
└──────┬───────────────────────────────┘
       │
       │ 2. POST request
       │
       ↓
┌──────────────────────────────────────┐
│  API Gateway                          │
│  - Route to Lambda                    │
│  - Apply throttling                   │
└──────┬───────────────────────────────┘
       │
       │ 3. Invoke Lambda
       │
       ↓
┌──────────────────────────────────────┐
│  Lambda Handler                       │
│  ┌────────────────────────────────┐  │
│  │ Parse JSON body                │  │
│  └────────────────────────────────┘  │
│  ┌────────────────────────────────┐  │
│  │ Validate with Pydantic         │  │
│  │ - content_type = "app/pdf"     │  │
│  │ - file_size ≤ 100MB            │  │
│  │ - filename ends with .pdf      │  │
│  └────────────────────────────────┘  │
│  ┌────────────────────────────────┐  │
│  │ Generate UUID                  │  │
│  │ document_id = uuid4()          │  │
│  └────────────────────────────────┘  │
│  ┌────────────────────────────────┐  │
│  │ Generate S3 key                │  │
│  │ documents/{uuid}/original.pdf  │  │
│  └────────────────────────────────┘  │
└──────┬───────────────────────────────┘
       │
       │ 4. Generate pre-signed URL
       │
       ↓
┌──────────────────────────────────────┐
│  S3 Client                            │
│  generate_presigned_post()            │
│  - Bucket: subscribt-ai-documents     │
│  - Key: documents/{uuid}/original.pdf │
│  - Conditions:                        │
│    • Content-Type = application/pdf   │
│    • Content-Length ≤ file_size       │
│  - Expires: 3600 seconds (1 hour)     │
└──────┬───────────────────────────────┘
       │
       │ 5. Store metadata
       │
       ↓
┌──────────────────────────────────────┐
│  DynamoDB                             │
│  put_item()                           │
│  {                                    │
│    document_id: "uuid",               │
│    filename: "handbook.pdf",          │
│    hr_manager_id: "hr-123",           │
│    s3_key: "documents/uuid/...",      │
│    status: "uploading",               │
│    created_at: "2026-05-07T...",      │
│    ...                                │
│  }                                    │
└──────┬───────────────────────────────┘
       │
       │ 6. Return response
       │
       ↓
┌──────────────────────────────────────┐
│  API Gateway                          │
│  200 OK                               │
│  {                                    │
│    document_id: "uuid",               │
│    upload_url: "https://s3...",       │
│    expires_at: "2026-05-07T...",      │
│    s3_key: "documents/uuid/..."       │
│  }                                    │
└──────┬───────────────────────────────┘
       │
       │ 7. Response to browser
       │
       ↓
┌──────────────────────────────────────┐
│  Browser                              │
│  - Receives pre-signed URL            │
│  - Uploads file directly to S3        │
└───────────────────────────────────────┘
```

### Upload Flow

```
┌─────────────┐
│   Browser   │
└──────┬──────┘
       │
       │ PUT request to pre-signed URL
       │ Content-Type: application/pdf
       │ Body: <file binary>
       │
       ↓
┌──────────────────────────────────────┐
│  S3 Bucket                            │
│  - Validates signature                │
│  - Validates content type             │
│  - Validates content length           │
│  - Stores file                        │
│  - Returns 200 OK                     │
└──────┬───────────────────────────────┘
       │
       │ S3 Event Notification
       │
       ↓
┌──────────────────────────────────────┐
│  EventBridge                          │
│  - Receives s3:ObjectCreated event    │
│  - Filters for documents/* prefix     │
│  - Triggers Step Functions            │
└──────┬───────────────────────────────┘
       │
       │ Start execution
       │
       ↓
┌──────────────────────────────────────┐
│  Step Functions                       │
│  Document Processing Pipeline         │
│  1. Update status → "processing"      │
│  2. Start Textract OCR                │
│  3. Poll for completion               │
│  4. Convert to Markdown               │
│  5. Semantic chunking                 │
│  6. Generate embeddings               │
│  7. Store in OpenSearch               │
│  8. Update status → "ready"           │
└───────────────────────────────────────┘
```

## Security Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      Security Layers                             │
└─────────────────────────────────────────────────────────────────┘

Layer 1: Client-Side Validation
├─ File type validation (PDF only)
├─ File size validation (≤ 100MB)
└─ Filename validation (.pdf extension)

Layer 2: API Gateway
├─ HTTPS enforcement
├─ CORS configuration
├─ Request throttling
└─ API key validation (optional)

Layer 3: Lambda Validation
├─ Pydantic schema validation
├─ Content type enforcement
├─ File size enforcement
└─ Input sanitization

Layer 4: Pre-signed URL
├─ Time-limited (1 hour expiration)
├─ Content-Type condition
├─ Content-Length condition
└─ Signature-based authentication

Layer 5: S3 Bucket
├─ Private access (no public reads)
├─ Bucket policies
├─ Encryption at rest (AES-256)
└─ Versioning enabled

Layer 6: IAM Permissions
├─ Lambda execution role (least privilege)
├─ S3 write-only access
├─ DynamoDB write-only access
└─ CloudWatch logging access
```

## Error Handling

```
┌─────────────────────────────────────────────────────────────────┐
│                      Error Flow                                  │
└─────────────────────────────────────────────────────────────────┘

Client-Side Errors
├─ Invalid file type
│  └─→ Show error: "Only PDF files are allowed"
├─ File too large
│  └─→ Show error: "File exceeds 100MB limit"
└─ Empty file
   └─→ Show error: "File is empty"

Server-Side Errors
├─ Validation Error (400)
│  ├─ Invalid content type
│  ├─ File size exceeded
│  └─ Invalid filename
│  └─→ Return: { error: "ValidationError", message: "..." }
│
├─ Service Error (500)
│  ├─ S3 unavailable
│  ├─ DynamoDB unavailable
│  └─ AWS service error
│  └─→ Return: { error: "ServiceError", message: "..." }
│
└─ Internal Error (500)
   └─ Unexpected exception
   └─→ Return: { error: "InternalError", message: "..." }

Upload Errors
├─ Network error
│  └─→ Retry with exponential backoff
├─ S3 upload failed
│  └─→ Get new pre-signed URL and retry
└─ Upload cancelled
   └─→ Clean up and notify user
```

## Monitoring & Observability

```
┌─────────────────────────────────────────────────────────────────┐
│                   Observability Stack                            │
└─────────────────────────────────────────────────────────────────┘

CloudWatch Logs
├─ Structured JSON logs
├─ Request/response logging
├─ Error logging with stack traces
└─ 30-day retention

CloudWatch Metrics
├─ Invocation count
├─ Error count
├─ Duration (avg, p50, p99)
├─ Throttles
└─ Concurrent executions

CloudWatch Alarms
├─ Error rate > 5% → Alert
├─ Any throttles → Alert
└─ P99 duration > 5s → Alert

X-Ray Tracing
├─ End-to-end request tracing
├─ Service map visualization
├─ Latency analysis
└─ Error analysis

Custom Metrics (via Powertools)
├─ Successful uploads
├─ Failed validations
├─ S3 operation latency
└─ DynamoDB operation latency
```

## Scalability

```
┌─────────────────────────────────────────────────────────────────┐
│                   Scalability Characteristics                    │
└─────────────────────────────────────────────────────────────────┘

Lambda
├─ Concurrent executions: 1000 (default)
├─ Can scale to 10,000+ with limit increase
├─ Cold start: ~500ms (with Powertools)
└─ Warm execution: ~50-100ms

API Gateway
├─ 10,000 requests/second (default)
├─ Can scale to 100,000+ with limit increase
└─ Automatic scaling

S3
├─ 3,500 PUT requests/second per prefix
├─ Unlimited storage
└─ Automatic scaling

DynamoDB
├─ On-demand mode: automatic scaling
├─ Or provisioned mode with auto-scaling
└─ Unlimited storage

Bottlenecks
├─ Lambda concurrent execution limit
├─ API Gateway throttling limit
└─ DynamoDB write capacity (if provisioned)

Optimization Strategies
├─ Use S3 Transfer Acceleration for large files
├─ Implement client-side retry with backoff
├─ Use DynamoDB on-demand mode
└─ Request limit increases for production
```

## Cost Estimation

```
┌─────────────────────────────────────────────────────────────────┐
│                   Cost Breakdown (Monthly)                       │
└─────────────────────────────────────────────────────────────────┘

Assumptions:
- 10,000 uploads per month
- Average file size: 5MB
- Average Lambda duration: 100ms

Lambda
├─ Requests: 10,000 × $0.20/1M = $0.002
├─ Duration: 10,000 × 100ms × 256MB
│  └─ 10,000 × 0.1s × 0.25GB = 250 GB-seconds
│  └─ 250 × $0.0000166667 = $0.004
└─ Total: ~$0.01/month

API Gateway
├─ Requests: 10,000 × $3.50/1M = $0.035
└─ Total: ~$0.04/month

S3
├─ Storage: 10,000 × 5MB = 50GB
│  └─ 50GB × $0.023/GB = $1.15
├─ PUT requests: 10,000 × $0.005/1000 = $0.05
└─ Total: ~$1.20/month

DynamoDB
├─ Write requests: 10,000 × $1.25/1M = $0.0125
├─ Storage: ~1GB × $0.25/GB = $0.25
└─ Total: ~$0.26/month

CloudWatch
├─ Logs: ~1GB × $0.50/GB = $0.50
└─ Total: ~$0.50/month

Total Monthly Cost: ~$2.00

At scale (1M uploads/month):
- Lambda: ~$1
- API Gateway: ~$3.50
- S3: ~$120
- DynamoDB: ~$1.50
- CloudWatch: ~$50
Total: ~$176/month
```

## Performance Characteristics

```
┌─────────────────────────────────────────────────────────────────┐
│                   Performance Metrics                            │
└─────────────────────────────────────────────────────────────────┘

Latency Breakdown (Typical Request)
├─ API Gateway: 5-10ms
├─ Lambda cold start: 500-800ms (first request)
├─ Lambda warm execution: 50-100ms
│  ├─ Request parsing: 5ms
│  ├─ Validation: 5ms
│  ├─ UUID generation: 1ms
│  ├─ S3 pre-signed URL: 20-30ms
│  ├─ DynamoDB write: 10-20ms
│  └─ Response formatting: 5ms
└─ Total (warm): 60-120ms
└─ Total (cold): 560-920ms

Upload Performance
├─ Pre-signed URL generation: 60-120ms
├─ File upload to S3: depends on file size and network
│  ├─ 1MB file: ~1-2 seconds
│  ├─ 10MB file: ~5-10 seconds
│  └─ 100MB file: ~30-60 seconds
└─ Total upload time: generation + upload

Throughput
├─ Lambda: 1000 concurrent executions
├─ API Gateway: 10,000 requests/second
└─ Effective throughput: ~1000 uploads/second
```

This architecture provides a secure, scalable, and cost-effective solution for document uploads with proper validation, monitoring, and error handling.
