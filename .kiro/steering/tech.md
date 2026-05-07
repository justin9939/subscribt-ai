# Tech Stack

## Frontend
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript (strict mode — all frontend code must be TypeScript, no `.js` files)
- **Styling**: Tailwind CSS
- **Component Library**: shadcn/ui
- **Hosting**: AWS Amplify

## Backend
- **Runtime**: AWS Lambda (Serverless)
- **Framework**: FastAPI with Mangum (ASGI adapter for Lambda)
- **Language**: Python — all backend code must use type hints and Pydantic models for request/response validation
- **Chat endpoint**: Deployed as a **Lambda Function URL with Response Streaming** to bypass the 29-second API Gateway timeout during Claude 4.6 Sonnet Chain-of-Thought generation. The frontend calls this Function URL directly for streaming responses.
- **Document ingestion**: Event-driven pipeline orchestrated by **AWS Step Functions** (Standard Workflow), triggered automatically by S3 upload events via EventBridge — replaces the previous synchronous Lambda approach to avoid the 15-minute Lambda hard limit on large PDFs

## AI / ML
- **Platform**: Amazon Bedrock
- **Chat/Reasoning Model**: Claude 4.6 Sonnet (via Bedrock) — use Chain-of-Thought prompting for all RAG interactions
- **Embeddings Model**: Amazon Titan Embeddings
- **Document Processing**: Event-driven pipeline orchestrated by AWS Step Functions:
  1. **OCR**: `StartDocumentAnalysis` (async Textract API) — avoids Lambda timeout on large PDFs; Step Functions polls for job completion
  2. **Markdown conversion**: Full document converted to structured Markdown before any splitting, preserving layout context (headings, tables, lists)
  3. **Semantic chunking**: Document split on Markdown structural headers (H1 → H2 → H3) rather than arbitrary character counts or page breaks — chunks map to logical document sections

## Data & Storage
- **Vector Database**: Amazon OpenSearch Serverless (Vector Engine)
- **Primary Database**: Amazon DynamoDB — user data, document metadata, query logs
- **File Storage**: Amazon S3 (PDF uploads and processed document artifacts)
- **Analytics**: DynamoDB Streams + Lambda aggregator for query trend analytics
  - Queries written to DynamoDB trigger a Stream → Lambda computes aggregates
  - Analytics dashboard reads from a separate aggregates table
  - AppSync is not used; analytics are batch-aggregated summaries, not live subscriptions

## Security
- **S3 access**: All S3 buckets are private; access via pre-signed URLs or Lambda with scoped IAM roles only

## Observability
- **Logging**: All API endpoints must emit structured logs to AWS CloudWatch for audit trails
- **Tracing**: AWS X-Ray for distributed request tracing across Lambda functions

---

## Key Architectural Patterns

- **RAG (Retrieval-Augmented Generation)**: All AI responses are grounded in document chunks retrieved from OpenSearch. No freeform generation without a retrieved source.
- **Chain-of-Thought prompting**: All RAG interactions must use CoT prompt patterns — the model should reason through retrieved chunks before producing a final answer.
- **Strict Grounding**: If no relevant chunk is retrieved, the response must be "Not addressed in the provided policy." This logic lives in the prompt layer, not the UI.
- **Pydantic everywhere**: All Lambda handler inputs and outputs use Pydantic models. No untyped dicts crossing API boundaries.
- **Event-driven ingestion pipeline**: S3 upload event (via EventBridge) → Step Functions Standard Workflow → async Textract OCR (`StartDocumentAnalysis` + polling) → Markdown conversion → header-based semantic chunking → Titan embedding → OpenSearch upsert. Each stage is a discrete Lambda invoked by the state machine; no single Lambda owns the full pipeline.
- **Streaming chat via Lambda Function URLs**: The chat Lambda is exposed directly via a Function URL (not API Gateway) with `InvokeMode: RESPONSE_STREAM`. This removes the 29-second gateway timeout and allows Claude's CoT response to stream token-by-token to the client. The frontend calls this Function URL directly.
- **Markdown-first chunking**: Documents are always converted to Markdown before splitting. Chunks follow document structure (H1/H2/H3 boundaries) so each chunk is a semantically coherent section, not an arbitrary text window. This improves retrieval precision and citation accuracy.

---

## AWS Services Summary

| Concern | Service |
|---|---|
| Frontend hosting | AWS Amplify |
| Chat streaming | AWS Lambda Function URL (Response Streaming) |
| Document ingestion orchestration | AWS Step Functions (Standard Workflow) |
| Document ingestion trigger | Amazon EventBridge (S3 upload events) |
| AI reasoning | Amazon Bedrock (Claude 4.6 Sonnet) |
| Embeddings | Amazon Bedrock (Titan Embeddings) |
| OCR | AWS Textract (async `StartDocumentAnalysis`) |
| Markdown conversion + chunking | Custom Lambda (header-based semantic chunking) |
| Vector search | Amazon OpenSearch Serverless |
| Primary database | Amazon DynamoDB |
| File storage | Amazon S3 |
| Analytics | DynamoDB Streams + Lambda |
| Logging / audit | AWS CloudWatch |
| Tracing | AWS X-Ray |

---

## Common Commands

```bash
# Frontend (Next.js on Amplify)
npm install
npm run dev           # local dev server
npm run build         # production build
npm run lint          # ESLint
npx tsc --noEmit      # type check without emitting

# Backend (FastAPI + Lambda)
pip install -r requirements.txt
uvicorn main:app --reload          # local dev (without Lambda wrapper)
python -m pytest                   # run tests

# Deploy
amplify push                       # deploy frontend via Amplify CLI
# Lambda/infra deployment via AWS SAM or CDK (check deploy/ or infra/ directory)
```

---

## Environment Variables

Key env vars — never commit to source control:

```
# AWS
AWS_REGION
AWS_ACCESS_KEY_ID
AWS_SECRET_ACCESS_KEY
BEDROCK_MODEL_ID                   # e.g. anthropic.claude-4-6-sonnet-20250514-v1:0
BEDROCK_EMBEDDING_MODEL_ID         # e.g. amazon.titan-embed-text-v2:0
OPENSEARCH_ENDPOINT
DYNAMODB_TABLE_NAME
DYNAMODB_AGGREGATES_TABLE_NAME
S3_BUCKET_NAME
CHAT_LAMBDA_FUNCTION_URL           # The streaming Lambda Function URL for chat
```
