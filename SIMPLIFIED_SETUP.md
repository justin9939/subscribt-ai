# Simplified Knowledge Base Query Setup

This guide covers the simplified implementation using AWS Bedrock's RetrieveAndGenerate API with a barebones frontend.

## Overview

The simplified architecture consists of:
1. **Backend**: Single Lambda function using Bedrock's RetrieveAndGenerate API
2. **Frontend**: Barebones text input/output interface (no complex UI components)
3. **Knowledge Base**: Pre-configured Amazon Bedrock Knowledge Base with your policy documents

## Architecture

```
┌──────────────┐      ┌─────────────────┐      ┌──────────────────────┐
│   Frontend   │─────▶│  Lambda (URL)   │─────▶│  Bedrock KB API      │
│  (Next.js)   │      │  retrieve_gen   │      │  RetrieveAndGenerate │
└──────────────┘      └─────────────────┘      └──────────────────────┘
                                                          │
                                                          ▼
                                                 ┌──────────────────┐
                                                 │ Knowledge Base   │
                                                 │ (Vector Store)   │
                                                 └──────────────────┘
```

## Prerequisites

1. **Amazon Bedrock Knowledge Base**: You must have a knowledge base already created and populated
   - Follow AWS documentation: https://docs.aws.amazon.com/bedrock/latest/userguide/knowledge-base.html
   - Note your Knowledge Base ID
   
2. **AWS CLI**: Configured with appropriate credentials

3. **AWS SAM CLI**: For deploying the Lambda function
   ```bash
   brew install aws-sam-cli  # macOS
   ```

4. **Node.js 18+**: For the frontend

## Backend Setup

### 1. Deploy the Lambda Function

```bash
cd backend/lambdas/retrieve_generate

# Set your knowledge base ID
export KNOWLEDGE_BASE_ID="your-kb-id-here"

# Optional: Override the default model
export BEDROCK_MODEL_ARN="arn:aws:bedrock:us-east-1::foundation-model/anthropic.claude-3-5-sonnet-20241022-v2:0"

# Deploy
./deploy.sh
```

### 2. Get the Function URL

After deployment, retrieve the Function URL:

```bash
aws cloudformation describe-stacks \
  --stack-name subscribt-kb-query \
  --query 'Stacks[0].Outputs[?OutputKey==`KBQueryFunctionUrl`].OutputValue' \
  --output text
```

Save this URL - you'll need it for the frontend configuration.

## Frontend Setup

### 1. Configure Environment Variables

```bash
cd subscribt-ai-frontend

# Copy the example env file
cp .env.example .env.local

# Edit .env.local and set your Function URL
# NEXT_PUBLIC_KB_FUNCTION_URL=https://your-function-url.lambda-url.us-east-1.on.aws/
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Run the Development Server

```bash
npm run dev
```

The application will be available at http://localhost:3000

## Usage

### Frontend Interface

The barebones interface at the root path (`/`) provides:
- **Text input**: Enter your policy question
- **Submit button**: Send the query to the knowledge base
- **Answer display**: Shows the AI-generated response
- **Citations**: Lists source documents with metadata
- **Session continuity**: Maintains conversation context

### API Usage

You can also query the Lambda directly:

```bash
curl -X POST https://your-function-url.lambda-url.us-east-1.on.aws/ \
  -H "Content-Type: application/json" \
  -d '{
    "query": "What is the policy on remote work?"
  }'
```

Response:
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
  "session_id": "session-id-for-follow-ups"
}
```

### Follow-up Queries

To maintain conversation context, include the `session_id` from the previous response:

```bash
curl -X POST https://your-function-url.lambda-url.us-east-1.on.aws/ \
  -H "Content-Type: application/json" \
  -d '{
    "query": "What about hybrid work arrangements?",
    "session_id": "previous-session-id"
  }'
```

## Key Differences from Previous Implementation

### Removed Components

The simplified version removes:
- ❌ Custom RAG pipeline (embedding generation, vector search, prompt construction)
- ❌ OpenSearch Serverless integration
- ❌ DynamoDB query logging
- ❌ Streaming responses
- ❌ Complex UI components (shadcn/ui, message bubbles, citation lists)
- ❌ Upload functionality
- ❌ Analytics dashboard
- ❌ Multiple user personas (HR/Employee)

### What Remains

The simplified version includes:
- ✅ Single Lambda function using RetrieveAndGenerate API
- ✅ Barebones text input/output interface
- ✅ Citation display
- ✅ Session continuity for follow-up questions
- ✅ Error handling

## Benefits of RetrieveAndGenerate API

1. **Simpler Code**: No manual embedding, vector search, or prompt engineering
2. **Managed Service**: AWS handles retrieval and generation
3. **Automatic Citations**: Built-in citation extraction
4. **Conversation Memory**: Session support for multi-turn conversations
5. **Less Infrastructure**: No OpenSearch or DynamoDB required

## Trade-offs

1. **Less Control**: Cannot customize retrieval parameters or prompts as granularly
2. **Vendor Lock-in**: Tied to AWS Bedrock's implementation
3. **Cost**: May be more expensive than custom RAG for high-volume use cases
4. **Limited Customization**: Cannot implement custom grounding logic or response formatting

## Troubleshooting

### "Knowledge base not found"
- Verify your `KNOWLEDGE_BASE_ID` is correct
- Ensure the Lambda has permissions to access the knowledge base
- Check that the knowledge base is in the same region as your Lambda

### "Model not found"
- Verify your `BEDROCK_MODEL_ARN` is correct
- Ensure you have access to the specified model in your region
- Check Bedrock model availability in your AWS account

### Empty or poor responses
- Verify your knowledge base is properly populated with documents
- Check that documents are correctly indexed
- Try adjusting `numberOfResults` in the Lambda handler (currently set to 5)

### CORS errors
- Verify the Function URL CORS configuration in `template.yaml`
- Check that your frontend URL is allowed (currently set to `*` for development)

## Production Considerations

Before deploying to production:

1. **Authentication**: Add authentication to the Lambda Function URL
   - Change `AuthType: NONE` to `AuthType: AWS_IAM` in `template.yaml`
   - Implement Cognito or similar auth in the frontend

2. **CORS**: Restrict allowed origins
   - Replace `AllowOrigins: ['*']` with your specific domain

3. **Rate Limiting**: Implement rate limiting to prevent abuse

4. **Monitoring**: Add CloudWatch alarms for errors and latency

5. **Logging**: Review and adjust log levels for production

6. **Cost Optimization**: Monitor Bedrock API costs and optimize query patterns

## Next Steps

1. **Populate Knowledge Base**: Add your policy documents to the Bedrock Knowledge Base
2. **Test Queries**: Verify responses are accurate and well-cited
3. **Customize UI**: Enhance the barebones interface as needed
4. **Add Features**: Consider adding document upload, analytics, or user management

## Resources

- [Bedrock RetrieveAndGenerate API](https://docs.aws.amazon.com/bedrock/latest/APIReference/API_agent-runtime_RetrieveAndGenerate.html)
- [Bedrock Knowledge Bases](https://docs.aws.amazon.com/bedrock/latest/userguide/knowledge-base.html)
- [Lambda Function URLs](https://docs.aws.amazon.com/lambda/latest/dg/lambda-urls.html)
- [AWS SAM Documentation](https://docs.aws.amazon.com/serverless-application-model/)
