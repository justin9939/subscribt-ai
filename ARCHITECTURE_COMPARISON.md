# Architecture Comparison: Custom RAG vs RetrieveAndGenerate

## Overview

This document compares the original custom RAG implementation with the simplified RetrieveAndGenerate API approach.

## Architecture Diagrams

### Original Custom RAG Pipeline

```
┌──────────────┐
│   Frontend   │
│  (Next.js)   │
└──────┬───────┘
       │
       ▼
┌─────────────────────────────────────────────────────────────┐
│                    Lambda Function                          │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ 1. Generate Query Embedding (Titan)                  │  │
│  └────────────────────┬─────────────────────────────────┘  │
│                       ▼                                     │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ 2. Vector Similarity Search (OpenSearch)             │  │
│  └────────────────────┬─────────────────────────────────┘  │
│                       ▼                                     │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ 3. Construct Chain-of-Thought Prompt                 │  │
│  └────────────────────┬─────────────────────────────────┘  │
│                       ▼                                     │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ 4. Stream Response from Claude (Bedrock)             │  │
│  └────────────────────┬─────────────────────────────────┘  │
│                       ▼                                     │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ 5. Extract Citations from Retrieved Chunks           │  │
│  └────────────────────┬─────────────────────────────────┘  │
│                       ▼                                     │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ 6. Log to DynamoDB for Analytics                     │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
       │                    │                    │
       ▼                    ▼                    ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│  OpenSearch  │  │   Bedrock    │  │  DynamoDB    │
│  Serverless  │  │   (Claude)   │  │              │
└──────────────┘  └──────────────┘  └──────────────┘
```

### Simplified RetrieveAndGenerate

```
┌──────────────┐
│   Frontend   │
│  (Next.js)   │
└──────┬───────┘
       │
       ▼
┌─────────────────────────────────────────┐
│         Lambda Function                 │
│  ┌───────────────────────────────────┐  │
│  │ Call RetrieveAndGenerate API      │  │
│  │ (Single API call)                 │  │
│  └─────────────┬─────────────────────┘  │
└────────────────┼─────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────┐
│    Bedrock RetrieveAndGenerate API      │
│  ┌───────────────────────────────────┐  │
│  │ 1. Retrieve from Knowledge Base   │  │
│  │ 2. Generate with Claude           │  │
│  │ 3. Extract Citations              │  │
│  └───────────────────────────────────┘  │
└─────────────────┬───────────────────────┘
                  │
                  ▼
         ┌──────────────────┐
         │ Knowledge Base   │
         │ (Managed Vector  │
         │  Store)          │
         └──────────────────┘
```

## Component Comparison

| Component | Custom RAG | RetrieveAndGenerate |
|-----------|------------|---------------------|
| **Vector Database** | OpenSearch Serverless (self-managed) | Bedrock Knowledge Base (managed) |
| **Embedding Generation** | Manual (Titan API calls) | Automatic (handled by KB) |
| **Vector Search** | Manual (OpenSearch queries) | Automatic (handled by API) |
| **Prompt Engineering** | Full control (custom CoT prompts) | Limited control (API defaults) |
| **Response Generation** | Direct Bedrock API calls | Managed by RetrieveAndGenerate |
| **Citation Extraction** | Manual parsing | Automatic |
| **Streaming** | Supported (Function URL streaming) | Not supported |
| **Analytics/Logging** | DynamoDB integration | Not included |
| **Session Management** | Custom implementation | Built-in |

## Code Complexity

### Custom RAG
- **Lines of Code**: ~500 lines (handler.py)
- **Dependencies**: boto3, opensearchpy, pydantic, aws4auth
- **AWS Services**: Lambda, Bedrock, OpenSearch, DynamoDB, CloudWatch
- **Configuration Complexity**: High (OpenSearch cluster, IAM roles, DynamoDB tables)

### RetrieveAndGenerate
- **Lines of Code**: ~200 lines (handler.py)
- **Dependencies**: boto3, pydantic
- **AWS Services**: Lambda, Bedrock (Knowledge Base)
- **Configuration Complexity**: Low (just Knowledge Base ID)

## Feature Comparison

| Feature | Custom RAG | RetrieveAndGenerate |
|---------|------------|---------------------|
| **Grounded Responses** | ✅ (manual implementation) | ✅ (automatic) |
| **Citations** | ✅ (manual extraction) | ✅ (automatic) |
| **Streaming** | ✅ | ❌ |
| **Custom Prompts** | ✅ (full control) | ⚠️ (limited) |
| **Query Analytics** | ✅ (DynamoDB) | ❌ |
| **Conversation Memory** | ⚠️ (custom) | ✅ (built-in) |
| **Retrieval Tuning** | ✅ (full control) | ⚠️ (limited) |
| **Cost Optimization** | ✅ (granular control) | ⚠️ (bundled pricing) |

## Performance

### Custom RAG
- **Latency**: Higher (multiple API calls)
  - Embedding: ~100-200ms
  - Vector search: ~50-100ms
  - Generation: ~2-5s (streaming)
  - Total: ~2.5-5.5s
- **Throughput**: Limited by OpenSearch capacity
- **Cold Start**: ~2-3s (OpenSearch client initialization)

### RetrieveAndGenerate
- **Latency**: Lower (single API call)
  - RetrieveAndGenerate: ~2-4s
  - Total: ~2-4s
- **Throughput**: Managed by AWS (auto-scaling)
- **Cold Start**: ~1-2s (simpler initialization)

## Cost Comparison

### Custom RAG (per 1000 queries)

| Service | Cost |
|---------|------|
| Lambda (512MB, 5s avg) | ~$0.08 |
| Bedrock Titan Embeddings | ~$0.10 |
| OpenSearch Serverless | ~$700/month (fixed) |
| Bedrock Claude Invocations | ~$15 |
| DynamoDB | ~$0.25 |
| **Total** | **~$715.43/month** |

### RetrieveAndGenerate (per 1000 queries)

| Service | Cost |
|---------|------|
| Lambda (512MB, 3s avg) | ~$0.05 |
| Bedrock RetrieveAndGenerate | ~$20 |
| Knowledge Base Storage | ~$0.30/GB/month |
| **Total** | **~$20.35 + storage** |

**Note**: OpenSearch Serverless has a high fixed cost (~$700/month minimum), making RetrieveAndGenerate significantly cheaper for low-to-medium volume use cases.

## Flexibility & Control

### Custom RAG Advantages
1. **Full prompt control**: Customize Chain-of-Thought prompting
2. **Retrieval tuning**: Adjust similarity thresholds, top-k, filters
3. **Custom grounding logic**: Implement specific "not addressed" rules
4. **Analytics integration**: Track queries, trends, user behavior
5. **Streaming responses**: Better UX for long responses
6. **Multi-stage processing**: Add custom pre/post-processing steps

### RetrieveAndGenerate Advantages
1. **Simplicity**: Single API call handles everything
2. **Managed infrastructure**: No OpenSearch cluster to maintain
3. **Automatic updates**: AWS improves retrieval/generation over time
4. **Built-in session management**: Conversation continuity out-of-the-box
5. **Lower operational overhead**: Less code to maintain
6. **Cost-effective**: No fixed infrastructure costs

## When to Use Each

### Use Custom RAG When:
- ✅ You need full control over prompts and retrieval
- ✅ You require streaming responses
- ✅ You need custom analytics and logging
- ✅ You have high query volume (>100k/month) to justify OpenSearch costs
- ✅ You need complex multi-stage processing
- ✅ You want to implement custom grounding rules

### Use RetrieveAndGenerate When:
- ✅ You want to get started quickly
- ✅ You have low-to-medium query volume (<100k/month)
- ✅ You prefer managed services over custom infrastructure
- ✅ You don't need streaming responses
- ✅ You're okay with limited prompt customization
- ✅ You want to minimize operational overhead

## Migration Path

### From Custom RAG to RetrieveAndGenerate

1. **Create Knowledge Base**: Migrate documents from OpenSearch to Bedrock KB
2. **Deploy new Lambda**: Use the `retrieve_generate` handler
3. **Update frontend**: Point to new Function URL
4. **Test thoroughly**: Verify response quality matches expectations
5. **Deprecate old stack**: Remove OpenSearch, old Lambda, DynamoDB

### From RetrieveAndGenerate to Custom RAG

1. **Set up OpenSearch**: Create OpenSearch Serverless collection
2. **Migrate embeddings**: Re-embed documents and load into OpenSearch
3. **Deploy custom Lambda**: Use the `streaming_chat` handler
4. **Implement analytics**: Set up DynamoDB for query logging
5. **Update frontend**: Handle streaming responses

## Hybrid Approach

You can also use both:
- **RetrieveAndGenerate** for simple queries
- **Custom RAG** for complex queries requiring streaming or custom logic

Route based on query complexity or user preference.

## Recommendations

### For Prototyping/MVP
**Use RetrieveAndGenerate**
- Faster time to market
- Lower initial costs
- Less complexity

### For Production at Scale
**Consider Custom RAG if:**
- Query volume > 100k/month
- Need streaming responses
- Require custom analytics
- Need full control over retrieval/generation

**Stick with RetrieveAndGenerate if:**
- Query volume < 100k/month
- Simplicity is priority
- Limited engineering resources
- Managed services preferred

## Conclusion

Both approaches are valid. RetrieveAndGenerate is excellent for getting started quickly and keeping things simple. Custom RAG provides more control and can be more cost-effective at scale, but requires more engineering effort.

Choose based on your specific requirements, scale, and team capabilities.
