# Subscribt AI - Simplified Knowledge Base Query System

A barebones policy query system using AWS Bedrock's RetrieveAndGenerate API.

## Quick Start

### 1. Prerequisites
- Amazon Bedrock Knowledge Base (already created and populated)
- AWS CLI configured
- SAM CLI installed
- Node.js 18+

### 2. Deploy Backend (5 minutes)

```bash
cd backend/lambdas/retrieve_generate
export KNOWLEDGE_BASE_ID="your-kb-id"
./deploy.sh
```

Get the Function URL:
```bash
aws cloudformation describe-stacks \
  --stack-name subscribt-kb-query \
  --query 'Stacks[0].Outputs[?OutputKey==`KBQueryFunctionUrl`].OutputValue' \
  --output text
```

### 3. Configure Frontend (2 minutes)

```bash
cd subscribt-ai-frontend
cp .env.example .env.local
# Edit .env.local and set NEXT_PUBLIC_KB_FUNCTION_URL
npm install
npm run dev
```

Visit http://localhost:3000

## Architecture

```
┌──────────────┐
│   Frontend   │  Simple text input/output
│  (Next.js)   │
└──────┬───────┘
       │
       ▼
┌─────────────────┐
│  Lambda (URL)   │  Single API call
│  retrieve_gen   │
└────────┬────────┘
         │
         ▼
┌──────────────────────┐
│  Bedrock KB API      │  Managed retrieval + generation
│  RetrieveAndGenerate │
└──────────┬───────────┘
           │
           ▼
  ┌──────────────────┐
  │ Knowledge Base   │  Your policy documents
  │ (Vector Store)   │
  └──────────────────┘
```

## What's Included

### Backend
- **Single Lambda function** using RetrieveAndGenerate API
- **~200 lines of code** (vs ~500 in custom RAG)
- **Automatic citations** from retrieved sources
- **Session support** for follow-up questions

### Frontend
- **Barebones interface** with text input/output
- **No complex UI components** (pure HTML/CSS)
- **Citation display** with source metadata
- **Error handling** and loading states

## What's NOT Included

This simplified version removes:
- ❌ Custom RAG pipeline (embedding, vector search, prompt engineering)
- ❌ OpenSearch Serverless
- ❌ DynamoDB query logging
- ❌ Streaming responses
- ❌ Complex UI components (shadcn/ui)
- ❌ Document upload functionality
- ❌ Analytics dashboard
- ❌ User authentication

## API Usage

### Request
```bash
curl -X POST https://your-function-url.lambda-url.us-east-1.on.aws/ \
  -H "Content-Type: application/json" \
  -d '{
    "query": "What is the remote work policy?",
    "session_id": "optional-for-follow-ups"
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
  "session_id": "session-id-for-next-query"
}
```

## Documentation

- **[SIMPLIFIED_SETUP.md](SIMPLIFIED_SETUP.md)** - Complete setup guide
- **[ARCHITECTURE_COMPARISON.md](ARCHITECTURE_COMPARISON.md)** - Custom RAG vs RetrieveAndGenerate
- **[MIGRATION_TO_SIMPLIFIED.md](MIGRATION_TO_SIMPLIFIED.md)** - Migration guide from custom RAG
- **[SIMPLIFIED_IMPLEMENTATION_SUMMARY.md](SIMPLIFIED_IMPLEMENTATION_SUMMARY.md)** - What was changed
- **[backend/lambdas/retrieve_generate/README.md](backend/lambdas/retrieve_generate/README.md)** - Lambda documentation
- **[backend/lambdas/retrieve_generate/QUICK_START.md](backend/lambdas/retrieve_generate/QUICK_START.md)** - Quick reference

## Cost Comparison

### Custom RAG (Original)
- OpenSearch Serverless: ~$700/month (fixed)
- Lambda + Bedrock: ~$15/1000 queries
- **Total**: ~$715/month minimum

### RetrieveAndGenerate (Simplified)
- Knowledge Base Storage: ~$0.30/GB/month
- Lambda + Bedrock: ~$20/1000 queries
- **Total**: ~$20/1000 queries + storage

**Savings**: ~$695/month for low-volume use cases

## When to Use This

✅ **Use RetrieveAndGenerate when:**
- Getting started / MVP
- Low-to-medium query volume (<100k/month)
- Prefer simplicity over control
- Limited engineering resources
- Want managed infrastructure

❌ **Use Custom RAG when:**
- High query volume (>100k/month)
- Need streaming responses
- Require custom analytics
- Need full control over prompts/retrieval
- Complex multi-stage processing

## Key Benefits

1. **Simplicity**: 60% less code to maintain
2. **Cost**: Significant savings for low-volume use cases
3. **Speed**: Faster development and deployment
4. **Reliability**: Managed service with AWS SLAs
5. **Maintenance**: No infrastructure to manage

## Trade-offs

1. **Less Control**: Limited prompt customization
2. **No Streaming**: Responses are not streamed
3. **No Analytics**: No built-in query logging
4. **Vendor Lock-in**: Tied to AWS Bedrock

## Troubleshooting

### "Knowledge base not found"
- Verify your `KNOWLEDGE_BASE_ID` is correct
- Check Lambda has permissions to access the KB

### Empty or poor responses
- Verify KB is populated with documents
- Check document sync status
- Try adjusting `numberOfResults` in handler

### CORS errors
- Verify Function URL CORS configuration
- Check frontend URL is allowed

## Production Checklist

Before deploying to production:
- [ ] Add authentication to Lambda Function URL
- [ ] Restrict CORS to specific domains
- [ ] Implement rate limiting
- [ ] Set up CloudWatch alarms
- [ ] Review and adjust log levels
- [ ] Monitor Bedrock API costs

## Next Steps

1. **Test thoroughly** with your policy documents
2. **Customize UI** as needed (it's intentionally barebones)
3. **Add features** like authentication, analytics, or document upload
4. **Monitor costs** and optimize query patterns
5. **Gather feedback** and iterate

## Support

For issues:
1. Check the documentation files listed above
2. Review CloudWatch logs
3. Verify Knowledge Base configuration
4. Check AWS Bedrock documentation

## License

See [LICENSE](LICENSE) file for details.

---

**Note**: This is a simplified implementation focused on core functionality. The original custom RAG implementation is still available in `backend/lambdas/streaming_chat/` for reference or if you need more control.
