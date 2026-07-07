"""
Lambda handler for uploading a policy document to S3 and syncing it into a
Bedrock Knowledge Base via an ingestion job.
"""
import base64
import binascii
import json
import mimetypes
import os
from typing import Any, Dict, Optional

import boto3
from aws_lambda_powertools import Logger, Tracer
from aws_lambda_powertools.utilities.typing import LambdaContext
from botocore.exceptions import ClientError
from pydantic import BaseModel, Field, ValidationError, validator

s3_client = boto3.client("s3")
bedrock_agent_client = boto3.client("bedrock-agent")
logger = Logger()
tracer = Tracer()

KNOWLEDGE_BASE_ID = os.environ["KNOWLEDGE_BASE_ID"]
DATA_SOURCE_ID = os.environ["DATA_SOURCE_ID"]
S3_BUCKET_NAME = os.environ["S3_BUCKET_NAME"]
DOCUMENTS_PREFIX = os.environ.get("DOCUMENTS_PREFIX", "documents/")

ALLOWED_EXTENSIONS = {".pdf", ".docx", ".txt", ".md"}

CORS_HEADERS = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
}


class UploadRequest(BaseModel):
    """Request model for document uploads."""

    file_name: str = Field(..., min_length=1, max_length=1024)
    file_content: str = Field(..., min_length=1, description="Base64-encoded raw file bytes")

    @validator("file_name")
    def validate_extension(cls, v: str) -> str:
        """Only accept the document types the frontend and README advertise."""
        ext = os.path.splitext(v)[1].lower()
        if ext not in ALLOWED_EXTENSIONS:
            raise ValueError(
                f"Unsupported file type '{ext or '(none)'}'. "
                f"Accepted types: {', '.join(sorted(ALLOWED_EXTENSIONS))}"
            )
        return v


class UploadResponse(BaseModel):
    """Response model for successful uploads."""

    message: str = Field(..., description="Human-readable success message")
    file_name: str = Field(..., description="Uploaded file name")
    ingestion_job_id: Optional[str] = Field(None, description="Bedrock ingestion job ID")


class ErrorResponse(BaseModel):
    """Error response model.

    `error` is read directly by the frontend and shown as-is in the UI, so it
    must be the human-readable message. `error_type` carries the
    machine-readable category. This is the inverse of kb_query's
    {error: category, message: human text} shape -- don't mix the two up.
    """

    error: str = Field(..., description="Human-readable error message")
    error_type: str = Field(..., description="Error category")


def _respond(status_code: int, body: str) -> Dict[str, Any]:
    return {"statusCode": status_code, "headers": CORS_HEADERS, "body": body}


@tracer.capture_method
def decode_file_content(b64: str) -> bytes:
    """Decode the base64-encoded file body, raising ValueError on malformed input."""
    try:
        return base64.b64decode(b64, validate=True)
    except (binascii.Error, ValueError) as e:
        raise ValueError("file_content is not valid base64") from e


@tracer.capture_method
def replace_existing_documents(prefix: str) -> None:
    """Delete any previously uploaded documents so the new upload replaces them."""
    response = s3_client.list_objects_v2(Bucket=S3_BUCKET_NAME, Prefix=prefix)
    existing = response.get("Contents", [])
    for obj in existing:
        s3_client.delete_object(Bucket=S3_BUCKET_NAME, Key=obj["Key"])
    logger.info("Cleared existing documents", extra={"count": len(existing)})


@tracer.capture_method
def upload_document(key: str, content: bytes, file_name: str) -> None:
    """Store the new document in S3."""
    content_type = mimetypes.guess_type(file_name)[0] or "application/octet-stream"
    s3_client.put_object(Bucket=S3_BUCKET_NAME, Key=key, Body=content, ContentType=content_type)


@tracer.capture_method
def start_ingestion() -> str:
    """Trigger an async Bedrock ingestion job to sync the S3 data source.

    Fire-and-forget: this does not poll for completion, since ingestion can
    take longer than the Lambda's timeout allows. The frontend already tells
    users indexing may take 10-30 seconds before queries reflect the change.
    """
    response = bedrock_agent_client.start_ingestion_job(
        knowledgeBaseId=KNOWLEDGE_BASE_ID,
        dataSourceId=DATA_SOURCE_ID,
    )
    return response["ingestionJob"]["ingestionJobId"]


@logger.inject_lambda_context(log_event=True)
@tracer.capture_lambda_handler
def handler(event: Dict[str, Any], context: LambdaContext) -> Dict[str, Any]:
    """Lambda handler for document uploads."""
    try:
        body = json.loads(event.get("body", "{}"))
        request = UploadRequest(**body)

        file_bytes = decode_file_content(request.file_content)
        s3_key = f"{DOCUMENTS_PREFIX}{request.file_name}"

        logger.info(
            "Processing upload",
            extra={"file_name": request.file_name, "size_bytes": len(file_bytes)},
        )

        replace_existing_documents(DOCUMENTS_PREFIX)
        upload_document(s3_key, file_bytes, request.file_name)
        ingestion_job_id = start_ingestion()

        response = UploadResponse(
            message=f'"{request.file_name}" uploaded and ingestion started.',
            file_name=request.file_name,
            ingestion_job_id=ingestion_job_id,
        )

        logger.info(
            "Successfully processed upload",
            extra={"file_name": request.file_name, "ingestion_job_id": ingestion_job_id},
        )

        return _respond(200, response.model_dump_json())

    except ValidationError as e:
        # Pydantic wraps our validators' ValueErrors in a multi-line dump not
        # fit for direct display -- surface just the first error's message.
        message = e.errors()[0]["msg"].removeprefix("Value error, ")
        logger.warning("Validation error", extra={"error": message})
        return _respond(
            400,
            ErrorResponse(error=message, error_type="ValidationError").model_dump_json(),
        )

    except ValueError as e:
        logger.warning("Validation error", extra={"error": str(e)})
        return _respond(
            400,
            ErrorResponse(error=str(e), error_type="ValidationError").model_dump_json(),
        )

    except ClientError as e:
        aws_message = e.response.get("Error", {}).get("Message", str(e))
        logger.error("AWS service error", extra={"error": str(e)})
        return _respond(
            500,
            ErrorResponse(
                error=f"Failed to process upload: {aws_message}",
                error_type="ServiceError",
            ).model_dump_json(),
        )

    except Exception as e:
        logger.error("Unexpected error", extra={"error": str(e)}, exc_info=True)
        return _respond(
            500,
            ErrorResponse(
                error="An unexpected error occurred while uploading the document.",
                error_type="InternalError",
            ).model_dump_json(),
        )
