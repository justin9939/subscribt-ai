"""
Simple Lambda handler using Bedrock RetrieveAndGenerate API
Queries a knowledge base and returns grounded responses.
"""
import json
import os
from typing import Any, Dict, List, Optional

import boto3
from aws_lambda_powertools import Logger, Tracer
from aws_lambda_powertools.utilities.typing import LambdaContext
from botocore.exceptions import ClientError
from pydantic import BaseModel, Field, validator

# Initialize AWS services
bedrock_agent_runtime = boto3.client("bedrock-agent-runtime")
logger = Logger()
tracer = Tracer()

# Environment variables
KNOWLEDGE_BASE_ID = os.environ["KNOWLEDGE_BASE_ID"]
BEDROCK_MODEL_ARN = os.environ["BEDROCK_MODEL_ARN"]
AWS_REGION = os.environ.get("AWS_REGION", "us-east-1")


class QueryRequest(BaseModel):
    """Request model for knowledge base queries."""

    query: str = Field(..., min_length=1, max_length=2000, description="User query")

    @validator("query")
    def validate_query(cls, v: str) -> str:
        """Validate query is not empty after stripping whitespace."""
        if not v.strip():
            raise ValueError("Query cannot be empty")
        return v.strip()


class Citation(BaseModel):
    """Citation from retrieved sources."""

    text: str = Field(..., description="Retrieved text excerpt")
    location: Dict[str, Any] = Field(default_factory=dict, description="Source location metadata")


class QueryResponse(BaseModel):
    """Response model for knowledge base queries."""

    answer: str = Field(..., description="Generated answer")
    citations: List[Citation] = Field(default_factory=list, description="Source citations")
    session_id: str = Field(..., description="Session identifier for follow-up queries")


class ErrorResponse(BaseModel):
    """Error response model."""

    error: str = Field(..., description="Error type")
    message: str = Field(..., description="Human-readable error message")


@tracer.capture_method
def query_knowledge_base(query: str, session_id: Optional[str] = None) -> Dict[str, Any]:
    """
    Query knowledge base using RetrieveAndGenerate API.

    Args:
        query: User query text
        session_id: Optional session ID for conversation continuity

    Returns:
        Response from RetrieveAndGenerate API

    Raises:
        ClientError: If Bedrock operation fails
    """
    try:
        request_params = {
            "input": {
                "text": query
            },
            "retrieveAndGenerateConfiguration": {
                "type": "KNOWLEDGE_BASE",
                "knowledgeBaseConfiguration": {
                    "knowledgeBaseId": KNOWLEDGE_BASE_ID,
                    "modelArn": BEDROCK_MODEL_ARN,
                    "retrievalConfiguration": {
                        "vectorSearchConfiguration": {
                            "numberOfResults": 5
                        }
                    }
                }
            }
        }

        # Include session ID if provided for conversation continuity
        if session_id:
            request_params["sessionId"] = session_id

        logger.info(
            "Querying knowledge base",
            extra={
                "query_length": len(query),
                "has_session": bool(session_id),
            },
        )

        response = bedrock_agent_runtime.retrieve_and_generate(**request_params)

        logger.info(
            "Knowledge base query successful",
            extra={
                "session_id": response.get("sessionId"),
                "num_citations": len(response.get("citations", [])),
            },
        )

        return response

    except ClientError as e:
        logger.error(
            "Failed to query knowledge base",
            extra={"error": str(e)},
        )
        raise


@tracer.capture_method
def extract_citations(bedrock_response: Dict[str, Any]) -> List[Citation]:
    """
    Extract citations from Bedrock response.

    Args:
        bedrock_response: Response from RetrieveAndGenerate API

    Returns:
        List of citations
    """
    citations = []

    for citation_data in bedrock_response.get("citations", []):
        for retrieved_ref in citation_data.get("retrievedReferences", []):
            content = retrieved_ref.get("content", {})
            location = retrieved_ref.get("location", {})

            citation = Citation(
                text=content.get("text", ""),
                location=location
            )
            citations.append(citation)

    return citations


@logger.inject_lambda_context(log_event=True)
@tracer.capture_lambda_handler
def handler(event: Dict[str, Any], context: LambdaContext) -> Dict[str, Any]:
    """
    Lambda handler for knowledge base queries.

    Args:
        event: Lambda event containing request body
        context: Lambda context

    Returns:
        Query response or error
    """
    try:
        # Parse request body
        body = json.loads(event.get("body", "{}"))

        # Validate request using Pydantic
        request = QueryRequest(**body)

        # Extract optional session ID from request
        session_id = body.get("session_id")

        logger.info(
            "Processing query",
            extra={
                "query_length": len(request.query),
                "has_session": bool(session_id),
            },
        )

        # Query knowledge base
        bedrock_response = query_knowledge_base(request.query, session_id)

        # Extract answer and citations
        answer = bedrock_response.get("output", {}).get("text", "")
        citations = extract_citations(bedrock_response)
        response_session_id = bedrock_response.get("sessionId", "")

        # Build response
        response = QueryResponse(
            answer=answer,
            citations=citations,
            session_id=response_session_id,
        )

        logger.info(
            "Successfully processed query",
            extra={
                "answer_length": len(answer),
                "num_citations": len(citations),
            },
        )

        return {
            "statusCode": 200,
            "headers": {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Headers": "Content-Type",
                "Access-Control-Allow-Methods": "POST, OPTIONS",
            },
            "body": response.model_dump_json(),
        }

    except ValueError as e:
        # Pydantic validation errors
        error_response = ErrorResponse(
            error="ValidationError",
            message=str(e),
        )

        logger.warning(
            "Validation error",
            extra={"error": str(e)},
        )

        return {
            "statusCode": 400,
            "headers": {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
            },
            "body": error_response.model_dump_json(),
        }

    except ClientError as e:
        # AWS service errors
        error_response = ErrorResponse(
            error="ServiceError",
            message=f"Failed to process query: {e.response.get('Error', {}).get('Message', str(e))}",
        )

        logger.error(
            "AWS service error",
            extra={"error": str(e)},
        )

        return {
            "statusCode": 500,
            "headers": {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
            },
            "body": error_response.model_dump_json(),
        }

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

        return {
            "statusCode": 500,
            "headers": {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
            },
            "body": error_response.model_dump_json(),
        }
