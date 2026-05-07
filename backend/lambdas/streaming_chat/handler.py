"""
Streaming Chat Lambda with Function URL
Handles RAG pipeline with Chain-of-Thought prompting and streaming responses.
"""
import json
import os
import uuid
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

import boto3
from aws_lambda_powertools import Logger, Tracer
from aws_lambda_powertools.utilities.typing import LambdaContext
from botocore.exceptions import ClientError
from opensearchpy import OpenSearch, RequestsHttpConnection
from pydantic import BaseModel, Field, validator
from requests_aws4auth import AWS4Auth

# Initialize AWS services
bedrock_runtime = boto3.client("bedrock-runtime")
dynamodb = boto3.resource("dynamodb")
logger = Logger()
tracer = Tracer()

# Environment variables
BEDROCK_MODEL_ID = os.environ["BEDROCK_MODEL_ID"]
BEDROCK_EMBEDDING_MODEL_ID = os.environ["BEDROCK_EMBEDDING_MODEL_ID"]
OPENSEARCH_ENDPOINT = os.environ["OPENSEARCH_ENDPOINT"]
DYNAMODB_TABLE_NAME = os.environ["DYNAMODB_TABLE_NAME"]
SIMILARITY_THRESHOLD = float(os.environ.get("SIMILARITY_THRESHOLD", "0.7"))
TOP_K_RESULTS = int(os.environ.get("TOP_K_RESULTS", "5"))
AWS_REGION = os.environ.get("AWS_REGION", "us-east-1")

# DynamoDB table
table = dynamodb.Table(DYNAMODB_TABLE_NAME)

# OpenSearch client with AWS authentication
credentials = boto3.Session().get_credentials()
awsauth = AWS4Auth(
    credentials.access_key,
    credentials.secret_key,
    AWS_REGION,
    "aoss",  # Amazon OpenSearch Serverless
    session_token=credentials.token,
)

opensearch_client = OpenSearch(
    hosts=[{"host": OPENSEARCH_ENDPOINT.replace("https://", ""), "port": 443}],
    http_auth=awsauth,
    use_ssl=True,
    verify_certs=True,
    connection_class=RequestsHttpConnection,
    timeout=30,
)


class Citation(BaseModel):
    """Citation model for source references."""
    
    document_id: str = Field(..., description="Source document ID")
    document_name: str = Field(..., description="Source document filename")
    chunk_id: str = Field(..., description="Chunk identifier")
    text: str = Field(..., description="Relevant text excerpt")
    page_number: Optional[int] = Field(None, description="Page number if available")
    section_heading: Optional[str] = Field(None, description="Section heading if available")
    similarity_score: float = Field(..., ge=0.0, le=1.0, description="Similarity score")


class ChatRequest(BaseModel):
    """Request model for chat queries."""
    
    query: str = Field(..., min_length=1, max_length=2000, description="User query")
    document_ids: Optional[List[str]] = Field(None, description="Optional document ID filter")
    user_id: str = Field(..., min_length=1, description="User identifier")
    session_id: Optional[str] = Field(None, description="Session identifier for conversation tracking")
    
    @validator("query")
    def validate_query(cls, v: str) -> str:
        """Validate query is not empty after stripping whitespace."""
        if not v.strip():
            raise ValueError("Query cannot be empty")
        return v.strip()


class ChatResponse(BaseModel):
    """Response model for chat queries."""
    
    query_id: str = Field(..., description="Unique query identifier")
    answer: str = Field(..., description="AI-generated answer")
    citations: List[Citation] = Field(default_factory=list, description="Source citations")
    is_grounded: bool = Field(..., description="Whether answer is grounded in retrieved documents")
    timestamp: str = Field(..., description="ISO 8601 timestamp")


class ErrorResponse(BaseModel):
    """Error response model."""
    
    error: str = Field(..., description="Error type")
    message: str = Field(..., description="Human-readable error message")
    details: Optional[Dict[str, Any]] = Field(None, description="Additional error details")


@tracer.capture_method
def generate_query_embedding(query: str) -> List[float]:
    """
    Generate embedding for user query using Titan.
    
    Args:
        query: User query text
        
    Returns:
        Query embedding vector
        
    Raises:
        ClientError: If Bedrock operation fails
    """
    try:
        response = bedrock_runtime.invoke_model(
            modelId=BEDROCK_EMBEDDING_MODEL_ID,
            contentType="application/json",
            accept="application/json",
            body=json.dumps({"inputText": query}),
        )
        
        response_body = json.loads(response["body"].read())
        embedding = response_body["embedding"]
        
        logger.info(
            "Generated query embedding",
            extra={
                "query_length": len(query),
                "embedding_dimension": len(embedding),
            },
        )
        
        return embedding
        
    except ClientError as e:
        logger.error(
            "Failed to generate query embedding",
            extra={"error": str(e)},
        )
        raise


@tracer.capture_method
def search_similar_chunks(
    query_embedding: List[float],
    document_ids: Optional[List[str]] = None,
    top_k: int = TOP_K_RESULTS,
) -> List[Dict[str, Any]]:
    """
    Search for similar document chunks in OpenSearch.
    
    Args:
        query_embedding: Query embedding vector
        document_ids: Optional document ID filter
        top_k: Number of results to return
        
    Returns:
        List of similar chunks with metadata
        
    Raises:
        Exception: If OpenSearch operation fails
    """
    try:
        # Build query
        query_body = {
            "size": top_k,
            "query": {
                "knn": {
                    "embedding": {
                        "vector": query_embedding,
                        "k": top_k,
                    }
                }
            },
            "_source": [
                "document_id",
                "document_name",
                "chunk_id",
                "text",
                "page_number",
                "section_heading",
            ],
        }
        
        # Add document filter if provided
        if document_ids:
            query_body["query"] = {
                "bool": {
                    "must": [
                        {"knn": {"embedding": {"vector": query_embedding, "k": top_k}}},
                        {"terms": {"document_id": document_ids}},
                    ]
                }
            }
        
        # Execute search
        response = opensearch_client.search(
            index="policy-documents",
            body=query_body,
        )
        
        # Extract results
        results = []
        for hit in response["hits"]["hits"]:
            source = hit["_source"]
            results.append({
                "document_id": source["document_id"],
                "document_name": source["document_name"],
                "chunk_id": source["chunk_id"],
                "text": source["text"],
                "page_number": source.get("page_number"),
                "section_heading": source.get("section_heading"),
                "similarity_score": hit["_score"],
            })
        
        logger.info(
            "Retrieved similar chunks",
            extra={
                "num_results": len(results),
                "document_filter": document_ids,
            },
        )
        
        return results
        
    except Exception as e:
        logger.error(
            "Failed to search similar chunks",
            extra={"error": str(e)},
        )
        raise


@tracer.capture_method
def construct_cot_prompt(query: str, chunks: List[Dict[str, Any]]) -> str:
    """
    Construct Chain-of-Thought prompt with retrieved chunks.
    
    Args:
        query: User query
        chunks: Retrieved document chunks
        
    Returns:
        Formatted prompt for Claude
    """
    # Build context from chunks
    context_parts = []
    for i, chunk in enumerate(chunks, 1):
        section = f"[Source {i}]"
        if chunk.get("section_heading"):
            section += f" {chunk['section_heading']}"
        if chunk.get("page_number"):
            section += f" (Page {chunk['page_number']})"
        section += f"\nDocument: {chunk['document_name']}\n\n{chunk['text']}"
        context_parts.append(section)
    
    context = "\n\n---\n\n".join(context_parts)
    
    # Construct Chain-of-Thought prompt
    prompt = f"""You are a policy analysis assistant. Your role is to answer questions based ONLY on the provided policy documents.

<retrieved_context>
{context}
</retrieved_context>

<user_query>
{query}
</user_query>

<instructions>
1. First, analyze the retrieved context carefully. Think through which sources are relevant to the query.
2. If the answer is found in the context, provide a clear, accurate response based on the source material.
3. Always cite your sources by referencing the source numbers (e.g., "According to Source 1...").
4. If the query is NOT addressed in the provided context, respond EXACTLY with: "Not addressed in the provided policy."
5. NEVER use external knowledge or make assumptions beyond what is explicitly stated in the context.
6. NEVER hallucinate or infer information not present in the sources.
</instructions>

Think step-by-step:
1. What is the user asking?
2. Which sources (if any) contain relevant information?
3. What do those sources say?
4. Can I answer the question based solely on these sources?

Now provide your response:"""
    
    return prompt


@tracer.capture_method
def stream_claude_response(prompt: str) -> Any:
    """
    Stream response from Claude 4.6 Sonnet via Bedrock.
    
    Args:
        prompt: Formatted prompt
        
    Yields:
        Response chunks from Claude
        
    Raises:
        ClientError: If Bedrock operation fails
    """
    try:
        request_body = {
            "anthropic_version": "bedrock-2023-05-31",
            "max_tokens": 4096,
            "temperature": 0.0,  # Deterministic for policy analysis
            "messages": [
                {
                    "role": "user",
                    "content": prompt,
                }
            ],
        }
        
        response = bedrock_runtime.invoke_model_with_response_stream(
            modelId=BEDROCK_MODEL_ID,
            contentType="application/json",
            accept="application/json",
            body=json.dumps(request_body),
        )
        
        logger.info("Started streaming Claude response")
        
        # Stream response
        stream = response["body"]
        for event in stream:
            chunk = event.get("chunk")
            if chunk:
                chunk_data = json.loads(chunk["bytes"].decode())
                yield chunk_data
        
    except ClientError as e:
        logger.error(
            "Failed to stream Claude response",
            extra={"error": str(e)},
        )
        raise


@tracer.capture_method
def extract_citations_from_chunks(chunks: List[Dict[str, Any]]) -> List[Citation]:
    """
    Extract citations from retrieved chunks.
    
    Args:
        chunks: Retrieved document chunks
        
    Returns:
        List of citations
    """
    citations = []
    for chunk in chunks:
        citation = Citation(
            document_id=chunk["document_id"],
            document_name=chunk["document_name"],
            chunk_id=chunk["chunk_id"],
            text=chunk["text"][:500],  # Truncate to 500 chars for display
            page_number=chunk.get("page_number"),
            section_heading=chunk.get("section_heading"),
            similarity_score=chunk["similarity_score"],
        )
        citations.append(citation)
    
    return citations


@tracer.capture_method
def log_query_to_dynamodb(
    query_id: str,
    user_id: str,
    query: str,
    answer: str,
    is_grounded: bool,
    citations: List[Citation],
    session_id: Optional[str] = None,
) -> None:
    """
    Log query and response to DynamoDB for analytics.
    
    Args:
        query_id: Unique query identifier
        user_id: User identifier
        query: User query
        answer: AI response
        is_grounded: Whether answer is grounded
        citations: Source citations
        session_id: Optional session identifier
        
    Raises:
        ClientError: If DynamoDB operation fails
    """
    timestamp = datetime.now(timezone.utc).isoformat()
    
    try:
        table.put_item(
            Item={
                "query_id": query_id,
                "user_id": user_id,
                "session_id": session_id or "none",
                "query": query,
                "answer": answer,
                "is_grounded": is_grounded,
                "num_citations": len(citations),
                "citation_document_ids": [c.document_id for c in citations],
                "timestamp": timestamp,
                "created_at": timestamp,
            }
        )
        
        logger.info(
            "Logged query to DynamoDB",
            extra={
                "query_id": query_id,
                "user_id": user_id,
                "is_grounded": is_grounded,
            },
        )
        
    except ClientError as e:
        logger.error(
            "Failed to log query to DynamoDB",
            extra={
                "error": str(e),
                "query_id": query_id,
            },
        )
        # Don't raise - logging failure shouldn't break the response


def format_streaming_response(chunk_type: str, data: Any) -> bytes:
    """
    Format streaming response chunk for Lambda Function URL.
    
    Args:
        chunk_type: Type of chunk (token, citations, metadata, error)
        data: Chunk data
        
    Returns:
        Formatted response bytes
    """
    response = {
        "type": chunk_type,
        "data": data,
    }
    return (json.dumps(response) + "\n").encode("utf-8")


@logger.inject_lambda_context(log_event=True)
@tracer.capture_lambda_handler
def handler(event: Dict[str, Any], context: LambdaContext) -> Dict[str, Any]:
    """
    Lambda handler for streaming chat with Function URL.
    
    Args:
        event: Lambda event containing request body
        context: Lambda context
        
    Returns:
        Streaming response or error
    """
    try:
        # Parse request body
        body = json.loads(event.get("body", "{}"))
        
        # Validate request using Pydantic
        request = ChatRequest(**body)
        
        # Generate unique query ID
        query_id = str(uuid.uuid4())
        
        logger.info(
            "Processing chat query",
            extra={
                "query_id": query_id,
                "user_id": request.user_id,
                "query_length": len(request.query),
                "document_filter": request.document_ids,
            },
        )
        
        # Step 1: Generate query embedding
        query_embedding = generate_query_embedding(request.query)
        
        # Step 2: Similarity search in OpenSearch
        chunks = search_similar_chunks(
            query_embedding=query_embedding,
            document_ids=request.document_ids,
            top_k=TOP_K_RESULTS,
        )
        
        # Step 3: Check similarity threshold
        if not chunks or chunks[0]["similarity_score"] < SIMILARITY_THRESHOLD:
            # Below threshold - return not addressed message
            not_addressed_response = "Not addressed in the provided policy."
            
            # Log to DynamoDB
            log_query_to_dynamodb(
                query_id=query_id,
                user_id=request.user_id,
                query=request.query,
                answer=not_addressed_response,
                is_grounded=False,
                citations=[],
                session_id=request.session_id,
            )
            
            # Return non-streaming response for this case
            response = ChatResponse(
                query_id=query_id,
                answer=not_addressed_response,
                citations=[],
                is_grounded=False,
                timestamp=datetime.now(timezone.utc).isoformat(),
            )
            
            return {
                "statusCode": 200,
                "headers": {
                    "Content-Type": "application/json",
                    "Access-Control-Allow-Origin": "*",
                },
                "body": response.model_dump_json(),
            }
        
        # Step 4: Construct Chain-of-Thought prompt
        prompt = construct_cot_prompt(request.query, chunks)
        
        # Step 5: Stream Claude response
        # For Lambda Function URL with response streaming
        response_stream = []
        
        # Send metadata first
        yield format_streaming_response("metadata", {
            "query_id": query_id,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        })
        
        # Stream tokens
        full_answer = ""
        for chunk in stream_claude_response(prompt):
            if chunk.get("type") == "content_block_delta":
                delta = chunk.get("delta", {})
                if delta.get("type") == "text_delta":
                    text = delta.get("text", "")
                    full_answer += text
                    yield format_streaming_response("token", {"text": text})
        
        # Step 6: Extract and send citations
        citations = extract_citations_from_chunks(chunks)
        yield format_streaming_response("citations", {
            "citations": [c.model_dump() for c in citations]
        })
        
        # Send completion marker
        yield format_streaming_response("done", {
            "query_id": query_id,
            "is_grounded": True,
        })
        
        # Step 7: Log to DynamoDB (async, don't block response)
        log_query_to_dynamodb(
            query_id=query_id,
            user_id=request.user_id,
            query=request.query,
            answer=full_answer,
            is_grounded=True,
            citations=citations,
            session_id=request.session_id,
        )
        
        logger.info(
            "Successfully processed chat query",
            extra={
                "query_id": query_id,
                "user_id": request.user_id,
                "num_citations": len(citations),
                "answer_length": len(full_answer),
            },
        )
        
    except ValueError as e:
        # Pydantic validation errors
        error_response = ErrorResponse(
            error="ValidationError",
            message="Invalid request parameters",
            details={"validation_error": str(e)},
        )
        
        logger.warning(
            "Validation error",
            extra={"error": str(e)},
        )
        
        yield format_streaming_response("error", error_response.model_dump())
        
    except ClientError as e:
        # AWS service errors
        error_response = ErrorResponse(
            error="ServiceError",
            message="Failed to process query",
            details={"aws_error": e.response.get("Error", {}).get("Message", str(e))},
        )
        
        logger.error(
            "AWS service error",
            extra={"error": str(e)},
        )
        
        yield format_streaming_response("error", error_response.model_dump())
        
    except Exception as e:
        # Unexpected errors
        error_response = ErrorResponse(
            error="InternalError",
            message="An unexpected error occurred",
        )
        
        logger.error(
            "Unexpected error",
            extra={"error": str(e)},
            exc_info=True,
        )
        
        yield format_streaming_response("error", error_response.model_dump())
