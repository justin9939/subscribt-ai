# Knowledge Base Query Lambda

Simple Lambda function that uses Amazon Bedrock's RetrieveAndGenerate API to query a knowledge base.

## Overview

This Lambda function provides a straightforward interface to query an Amazon Bedrock Knowledge Base. It:
- Accepts a text query via POST request
- Uses the RetrieveAndGenerate API to retrieve relevant documents and generate a grounded response
- Returns the answer with citations from source documents
- Supports conversation continuity via session IDs

## API Reference

**RetrieveAndGenerate API Documentation:**
https://docs.aws.amazon.com/bedrock/latest/APIReference/API_agent-runtime_RetrieveAndGenerate.html

## Prerequisites

1. **Amazon Bedrock Knowledge Base**: You must have a knowledge base already created and populated with documents
2. **AWS SAM CLI**: For deployment
3. **Python 3.12**: For local development

## Environment Variables

Required:
- `KNOWLEDGE_BASE_ID`: Your Bedrock Knowledge Base ID
- `BEDROCK_MODEL_ARN`: ARN of the Bedrock model to use for generation

Optional:
- `AWS_REGION`: AWS region (defaults to us-east-1)
- `LOG_LEVEL`: Logging level (defaults to INFO)

## Deployment

```bash
# Set your knowledge base ID
export KNOWLEDGE_BASE_ID="your-kb-id-here"

# Optional: Override the default model
export BEDROCK_MODEL_ARN="arn:aws:bedrock:us-east-1::foundation-model/anthropic.claude-3-5-sonnet-20241022-v2:0"

# Deploy
./deploy.sh
```

After deployment, get the Function URL:
```bash
aws cloudformation describe-stacks \
  --stack-name subscribt-kb-query \
  --query 'Stacks[0].Outputs[?OutputKey==`KBQueryFunctionUrl`].OutputValue' \
  --output text
```

## API Usage

### Request

```bash
curl -X POST https://your-function-url.lambda-url.us-east-1.on.aws/ \
  -H "Content-Type: application/json" \
  -d '{
    "query": "What is the policy on remote work?",
    "session_id": "optional-session-id-for-follow-ups"
  }'
```

### Response

```json
{
  "answer": "According to the remote work policy...",
  "citations": [
    {
      "text": "Employees may work remotely up to 3 days per week...",
      "location": {
        "type": "S3",
        "s3Location": {
          "uri": "s3://bucket/document.pdf"
        }
      }
    }
  ],
  "session_id": "session-id-for-follow-up-queries"
}
```

### Error Response

```json
{
  "error": "ValidationError",
  "message": "Query cannot be empty"
}
```

## Request Schema

```typescript
{
  query: string;        // Required: 1-2000 characters
  session_id?: string;  // Optional: For conversation continuity
}
```

## Response Schema

```typescript
{
  answer: string;           // Generated answer from the model
  citations: Array<{        // Source citations
    text: string;           // Retrieved text excerpt
    location: object;       // Source location metadata
  }>;
  session_id: string;       // Session ID for follow-up queries
}
```

## IAM Permissions

The Lambda function requires:
- `bedrock:RetrieveAndGenerate` on the knowledge base
- `bedrock:Retrieve` on the knowledge base
- `bedrock:InvokeModel` on the specified model

These are automatically configured in the SAM template.

## Local Development

```bash
# Install dependencies
pip install -r requirements.txt

# Set environment variables
export KNOWLEDGE_BASE_ID="your-kb-id"
export BEDROCK_MODEL_ARN="your-model-arn"
export AWS_REGION="us-east-1"

# Test locally (requires AWS credentials)
python -c "
import json
from handler import handler

event = {
    'body': json.dumps({'query': 'What is the remote work policy?'})
}
result = handler(event, None)
print(json.dumps(json.loads(result['body']), indent=2))
"
```

## Architecture

```
┌─────────┐      ┌────────────┐      ┌──────────────────┐
│ Client  │─────▶│   Lambda   │─────▶│ Bedrock KB API   │
└─────────┘      │  Function  │      │ RetrieveAndGen   │
                 └────────────┘      └──────────────────┘
                                              │
                                              ▼
                                     ┌──────────────────┐
                                     │  Knowledge Base  │
                                     │  (Vector Store)  │
                                     └──────────────────┘
```

## Key Features

- **Automatic Retrieval**: The RetrieveAndGenerate API handles both retrieval and generation in a single call
- **Grounded Responses**: All answers are grounded in retrieved documents
- **Citations**: Automatic citation extraction from retrieved sources
- **Session Support**: Maintains conversation context across multiple queries
- **CORS Enabled**: Function URL configured for cross-origin requests

## Differences from Custom RAG Pipeline

This implementation uses Bedrock's managed RetrieveAndGenerate API instead of a custom RAG pipeline:

**Advantages:**
- Simpler code (no manual embedding, vector search, or prompt construction)
- Managed retrieval and generation
- Automatic citation handling
- Built-in conversation memory

**Trade-offs:**
- Less control over retrieval parameters
- Less control over prompt engineering
- Tied to Bedrock's knowledge base implementation

## Troubleshooting

**Error: "Knowledge base not found"**
- Verify your `KNOWLEDGE_BASE_ID` is correct
- Ensure the Lambda has permissions to access the knowledge base

**Error: "Model not found"**
- Verify your `BEDROCK_MODEL_ARN` is correct
- Ensure you have access to the specified model in your region

**Empty or poor responses**
- Check that your knowledge base is properly populated
- Verify documents are correctly indexed
- Try adjusting `numberOfResults` in the retrieval configuration
