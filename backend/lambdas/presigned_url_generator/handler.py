"""
Pre-signed URL Generator Lambda
Generates secure S3 upload URLs for HR document uploads.
"""
import json
import os
import uuid
from datetime import datetime, timezone
from typing import Any, Dict

import boto3
from aws_lambda_powertools import Logger, Tracer
from aws_lambda_powertools.utilities.typing import LambdaContext
from botocore.exceptions import ClientError
from pydantic import BaseModel, Field, validator

# Initialize AWS services
s3_client = boto3.client("s3")
dynamodb = boto3.resource("dynamodb")
logger = Logger()
tracer = Tracer()

# Environment variables
S3_BUCKET_NAME = os.environ["S3_BUCKET_NAME"]
DYNAMODB_TABLE_NAME = os.environ["DYNAMODB_TABLE_NAME"]
PRESIGNED_URL_EXPIRATION = int(os.environ.get("PRESIGNED_URL_EXPIRATION", "3600"))  # 1 hour default
MAX_FILE_SIZE_MB = int(os.environ.get("MAX_FILE_SIZE_MB", "100"))

# DynamoDB table
table = dynamodb.Table(DYNAMODB_TABLE_NAME)


class PresignedUrlRequest(BaseModel):
    """Request model for pre-signed URL generation."""
    
    filename: str = Field(..., min_length=1, max_length=255, description="Original filename")
    content_type: str = Field(..., description="MIME type of the file")
    hr_manager_id: str = Field(..., min_length=1, description="HR manager identifier")
    file_size_bytes: int = Field(..., gt=0, description="File size in bytes")
    
    @validator("content_type")
    def validate_content_type(cls, v: str) -> str:
        """Validate that content type is PDF only."""
        allowed_types = ["application/pdf"]
        if v not in allowed_types:
            raise ValueError(f"Invalid content type. Only PDF files are allowed. Got: {v}")
        return v
    
    @validator("file_size_bytes")
    def validate_file_size(cls, v: int) -> int:
        """Validate file size does not exceed maximum."""
        max_bytes = MAX_FILE_SIZE_MB * 1024 * 1024
        if v > max_bytes:
            raise ValueError(f"File size exceeds maximum allowed size of {MAX_FILE_SIZE_MB}MB")
        return v
    
    @validator("filename")
    def validate_filename(cls, v: str) -> str:
        """Validate filename ends with .pdf extension."""
        if not v.lower().endswith(".pdf"):
            raise ValueError("Filename must have .pdf extension")
        return v


class PresignedUrlResponse(BaseModel):
    """Response model for pre-signed URL generation."""
    
    document_id: str = Field(..., description="Unique document identifier")
    upload_url: str = Field(..., description="Pre-signed S3 upload URL")
    expires_at: str = Field(..., description="ISO 8601 timestamp when URL expires")
    s3_key: str = Field(..., description="S3 object key for the upload")


class ErrorResponse(BaseModel):
    """Error response model."""
    
    error: str = Field(..., description="Error type")
    message: str = Field(..., description="Human-readable error message")
    details: Dict[str, Any] | None = Field(None, description="Additional error details")


@tracer.capture_method
def generate_s3_key(document_id: str, filename: str) -> str:
    """
    Generate S3 key for document upload.
    
    Args:
        document_id: Unique document identifier
        filename: Original filename
        
    Returns:
        S3 object key
    """
    # Extract file extension
    extension = filename.split(".")[-1].lower()
    
    # Structure: documents/{document_id}/original.{extension}
    return f"documents/{document_id}/original.{extension}"


@tracer.capture_method
def create_presigned_upload_url(s3_key: str, content_type: str, file_size_bytes: int) -> str:
    """
    Generate pre-signed URL for S3 upload with validation conditions.
    
    Args:
        s3_key: S3 object key
        content_type: MIME type
        file_size_bytes: Expected file size
        
    Returns:
        Pre-signed upload URL
        
    Raises:
        ClientError: If S3 operation fails
    """
    try:
        # Generate pre-signed POST URL with conditions
        presigned_post = s3_client.generate_presigned_post(
            Bucket=S3_BUCKET_NAME,
            Key=s3_key,
            Fields={
                "Content-Type": content_type,
            },
            Conditions=[
                {"Content-Type": content_type},
                ["content-length-range", file_size_bytes, file_size_bytes + 1024],  # Allow small variance
            ],
            ExpiresIn=PRESIGNED_URL_EXPIRATION,
        )
        
        logger.info(
            "Generated pre-signed URL",
            extra={
                "s3_key": s3_key,
                "bucket": S3_BUCKET_NAME,
                "expiration_seconds": PRESIGNED_URL_EXPIRATION,
            },
        )
        
        return presigned_post["url"]
        
    except ClientError as e:
        logger.error(
            "Failed to generate pre-signed URL",
            extra={
                "error": str(e),
                "s3_key": s3_key,
                "bucket": S3_BUCKET_NAME,
            },
        )
        raise


@tracer.capture_method
def store_document_metadata(
    document_id: str,
    filename: str,
    hr_manager_id: str,
    s3_key: str,
    file_size_bytes: int,
    content_type: str,
) -> None:
    """
    Store initial document metadata in DynamoDB.
    
    Args:
        document_id: Unique document identifier
        filename: Original filename
        hr_manager_id: HR manager identifier
        s3_key: S3 object key
        file_size_bytes: File size in bytes
        content_type: MIME type
        
    Raises:
        ClientError: If DynamoDB operation fails
    """
    timestamp = datetime.now(timezone.utc).isoformat()
    
    try:
        table.put_item(
            Item={
                "document_id": document_id,
                "filename": filename,
                "hr_manager_id": hr_manager_id,
                "s3_key": s3_key,
                "s3_bucket": S3_BUCKET_NAME,
                "file_size_bytes": file_size_bytes,
                "content_type": content_type,
                "status": "uploading",
                "created_at": timestamp,
                "updated_at": timestamp,
            }
        )
        
        logger.info(
            "Stored document metadata",
            extra={
                "document_id": document_id,
                "filename": filename,
                "hr_manager_id": hr_manager_id,
                "status": "uploading",
            },
        )
        
    except ClientError as e:
        logger.error(
            "Failed to store document metadata",
            extra={
                "error": str(e),
                "document_id": document_id,
            },
        )
        raise


@logger.inject_lambda_context(log_event=True)
@tracer.capture_lambda_handler
def handler(event: Dict[str, Any], context: LambdaContext) -> Dict[str, Any]:
    """
    Lambda handler for pre-signed URL generation.
    
    Args:
        event: Lambda event containing request body
        context: Lambda context
        
    Returns:
        API Gateway response with pre-signed URL or error
    """
    try:
        # Parse request body
        body = json.loads(event.get("body", "{}"))
        
        # Validate request using Pydantic
        request = PresignedUrlRequest(**body)
        
        # Generate unique document ID
        document_id = str(uuid.uuid4())
        
        # Generate S3 key
        s3_key = generate_s3_key(document_id, request.filename)
        
        # Generate pre-signed URL
        upload_url = create_presigned_upload_url(
            s3_key=s3_key,
            content_type=request.content_type,
            file_size_bytes=request.file_size_bytes,
        )
        
        # Store metadata in DynamoDB
        store_document_metadata(
            document_id=document_id,
            filename=request.filename,
            hr_manager_id=request.hr_manager_id,
            s3_key=s3_key,
            file_size_bytes=request.file_size_bytes,
            content_type=request.content_type,
        )
        
        # Calculate expiration timestamp
        expires_at = datetime.now(timezone.utc).timestamp() + PRESIGNED_URL_EXPIRATION
        expires_at_iso = datetime.fromtimestamp(expires_at, tz=timezone.utc).isoformat()
        
        # Build response
        response = PresignedUrlResponse(
            document_id=document_id,
            upload_url=upload_url,
            expires_at=expires_at_iso,
            s3_key=s3_key,
        )
        
        logger.info(
            "Successfully generated pre-signed URL",
            extra={
                "document_id": document_id,
                "hr_manager_id": request.hr_manager_id,
            },
        )
        
        return {
            "statusCode": 200,
            "headers": {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",  # Configure appropriately for production
                "Access-Control-Allow-Headers": "Content-Type,Authorization",
            },
            "body": response.model_dump_json(),
        }
        
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
            message="Failed to generate upload URL",
            details={"aws_error": e.response.get("Error", {}).get("Message", str(e))},
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
