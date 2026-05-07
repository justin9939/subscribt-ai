"""
Unit tests for pre-signed URL generator Lambda
"""
import json
import os
from datetime import datetime, timezone
from unittest.mock import MagicMock, patch

import pytest
from botocore.exceptions import ClientError

# Set environment variables before importing handler
os.environ["S3_BUCKET_NAME"] = "test-bucket"
os.environ["DYNAMODB_TABLE_NAME"] = "test-table"
os.environ["PRESIGNED_URL_EXPIRATION"] = "3600"
os.environ["MAX_FILE_SIZE_MB"] = "100"
os.environ["AWS_REGION"] = "us-east-1"
os.environ["POWERTOOLS_SERVICE_NAME"] = "test-service"

from handler import (
    ErrorResponse,
    PresignedUrlRequest,
    PresignedUrlResponse,
    create_presigned_upload_url,
    generate_s3_key,
    handler,
    store_document_metadata,
)


class TestPresignedUrlRequest:
    """Tests for PresignedUrlRequest validation."""

    def test_valid_request(self):
        """Test valid request passes validation."""
        request = PresignedUrlRequest(
            filename="test.pdf",
            content_type="application/pdf",
            hr_manager_id="hr-123",
            file_size_bytes=1024000,
        )
        assert request.filename == "test.pdf"
        assert request.content_type == "application/pdf"
        assert request.hr_manager_id == "hr-123"
        assert request.file_size_bytes == 1024000

    def test_invalid_content_type(self):
        """Test invalid content type raises validation error."""
        with pytest.raises(ValueError, match="Invalid content type"):
            PresignedUrlRequest(
                filename="test.pdf",
                content_type="application/msword",
                hr_manager_id="hr-123",
                file_size_bytes=1024000,
            )

    def test_file_size_exceeds_maximum(self):
        """Test file size exceeding maximum raises validation error."""
        max_bytes = 100 * 1024 * 1024
        with pytest.raises(ValueError, match="File size exceeds maximum"):
            PresignedUrlRequest(
                filename="test.pdf",
                content_type="application/pdf",
                hr_manager_id="hr-123",
                file_size_bytes=max_bytes + 1,
            )

    def test_invalid_filename_extension(self):
        """Test filename without .pdf extension raises validation error."""
        with pytest.raises(ValueError, match="must have .pdf extension"):
            PresignedUrlRequest(
                filename="test.docx",
                content_type="application/pdf",
                hr_manager_id="hr-123",
                file_size_bytes=1024000,
            )

    def test_zero_file_size(self):
        """Test zero file size raises validation error."""
        with pytest.raises(ValueError):
            PresignedUrlRequest(
                filename="test.pdf",
                content_type="application/pdf",
                hr_manager_id="hr-123",
                file_size_bytes=0,
            )


class TestGenerateS3Key:
    """Tests for S3 key generation."""

    def test_generates_correct_key(self):
        """Test S3 key generation with correct format."""
        document_id = "test-doc-123"
        filename = "employee-handbook.pdf"
        
        key = generate_s3_key(document_id, filename)
        
        assert key == "documents/test-doc-123/original.pdf"

    def test_handles_uppercase_extension(self):
        """Test S3 key generation handles uppercase extension."""
        document_id = "test-doc-123"
        filename = "DOCUMENT.PDF"
        
        key = generate_s3_key(document_id, filename)
        
        assert key == "documents/test-doc-123/original.pdf"


class TestCreatePresignedUploadUrl:
    """Tests for pre-signed URL creation."""

    @patch("handler.s3_client")
    def test_creates_presigned_url(self, mock_s3_client):
        """Test pre-signed URL creation."""
        mock_s3_client.generate_presigned_post.return_value = {
            "url": "https://test-bucket.s3.amazonaws.com/upload",
            "fields": {},
        }
        
        url = create_presigned_upload_url(
            s3_key="documents/test/original.pdf",
            content_type="application/pdf",
            file_size_bytes=1024000,
        )
        
        assert url == "https://test-bucket.s3.amazonaws.com/upload"
        mock_s3_client.generate_presigned_post.assert_called_once()

    @patch("handler.s3_client")
    def test_handles_s3_error(self, mock_s3_client):
        """Test handling of S3 client errors."""
        mock_s3_client.generate_presigned_post.side_effect = ClientError(
            {"Error": {"Code": "AccessDenied", "Message": "Access denied"}},
            "GeneratePresignedPost",
        )
        
        with pytest.raises(ClientError):
            create_presigned_upload_url(
                s3_key="documents/test/original.pdf",
                content_type="application/pdf",
                file_size_bytes=1024000,
            )


class TestStoreDocumentMetadata:
    """Tests for DynamoDB metadata storage."""

    @patch("handler.table")
    def test_stores_metadata(self, mock_table):
        """Test metadata storage in DynamoDB."""
        mock_table.put_item.return_value = {}
        
        store_document_metadata(
            document_id="test-doc-123",
            filename="test.pdf",
            hr_manager_id="hr-123",
            s3_key="documents/test-doc-123/original.pdf",
            file_size_bytes=1024000,
            content_type="application/pdf",
        )
        
        mock_table.put_item.assert_called_once()
        call_args = mock_table.put_item.call_args[1]
        item = call_args["Item"]
        
        assert item["document_id"] == "test-doc-123"
        assert item["filename"] == "test.pdf"
        assert item["hr_manager_id"] == "hr-123"
        assert item["status"] == "uploading"
        assert item["file_size_bytes"] == 1024000

    @patch("handler.table")
    def test_handles_dynamodb_error(self, mock_table):
        """Test handling of DynamoDB errors."""
        mock_table.put_item.side_effect = ClientError(
            {"Error": {"Code": "ResourceNotFoundException", "Message": "Table not found"}},
            "PutItem",
        )
        
        with pytest.raises(ClientError):
            store_document_metadata(
                document_id="test-doc-123",
                filename="test.pdf",
                hr_manager_id="hr-123",
                s3_key="documents/test-doc-123/original.pdf",
                file_size_bytes=1024000,
                content_type="application/pdf",
            )


class TestHandler:
    """Tests for Lambda handler."""

    @patch("handler.store_document_metadata")
    @patch("handler.create_presigned_upload_url")
    @patch("handler.generate_s3_key")
    @patch("handler.uuid.uuid4")
    def test_successful_request(
        self,
        mock_uuid,
        mock_generate_key,
        mock_create_url,
        mock_store_metadata,
    ):
        """Test successful pre-signed URL generation."""
        mock_uuid.return_value = MagicMock(hex="test-doc-123")
        mock_generate_key.return_value = "documents/test-doc-123/original.pdf"
        mock_create_url.return_value = "https://test-bucket.s3.amazonaws.com/upload"
        mock_store_metadata.return_value = None
        
        event = {
            "body": json.dumps({
                "filename": "test.pdf",
                "content_type": "application/pdf",
                "hr_manager_id": "hr-123",
                "file_size_bytes": 1024000,
            })
        }
        
        response = handler(event, None)
        
        assert response["statusCode"] == 200
        body = json.loads(response["body"])
        assert "document_id" in body
        assert "upload_url" in body
        assert "expires_at" in body
        assert "s3_key" in body

    def test_validation_error(self):
        """Test validation error response."""
        event = {
            "body": json.dumps({
                "filename": "test.docx",  # Invalid extension
                "content_type": "application/pdf",
                "hr_manager_id": "hr-123",
                "file_size_bytes": 1024000,
            })
        }
        
        response = handler(event, None)
        
        assert response["statusCode"] == 400
        body = json.loads(response["body"])
        assert body["error"] == "ValidationError"
        assert "pdf extension" in body["message"].lower()

    def test_file_size_validation_error(self):
        """Test file size validation error."""
        max_bytes = 100 * 1024 * 1024
        event = {
            "body": json.dumps({
                "filename": "test.pdf",
                "content_type": "application/pdf",
                "hr_manager_id": "hr-123",
                "file_size_bytes": max_bytes + 1,
            })
        }
        
        response = handler(event, None)
        
        assert response["statusCode"] == 400
        body = json.loads(response["body"])
        assert body["error"] == "ValidationError"

    @patch("handler.create_presigned_upload_url")
    @patch("handler.generate_s3_key")
    @patch("handler.uuid.uuid4")
    def test_s3_error(self, mock_uuid, mock_generate_key, mock_create_url):
        """Test S3 error handling."""
        mock_uuid.return_value = MagicMock(hex="test-doc-123")
        mock_generate_key.return_value = "documents/test-doc-123/original.pdf"
        mock_create_url.side_effect = ClientError(
            {"Error": {"Code": "AccessDenied", "Message": "Access denied"}},
            "GeneratePresignedPost",
        )
        
        event = {
            "body": json.dumps({
                "filename": "test.pdf",
                "content_type": "application/pdf",
                "hr_manager_id": "hr-123",
                "file_size_bytes": 1024000,
            })
        }
        
        response = handler(event, None)
        
        assert response["statusCode"] == 500
        body = json.loads(response["body"])
        assert body["error"] == "ServiceError"

    def test_missing_body(self):
        """Test handling of missing request body."""
        event = {}
        
        response = handler(event, None)
        
        assert response["statusCode"] == 400

    def test_invalid_json(self):
        """Test handling of invalid JSON."""
        event = {"body": "invalid json"}
        
        response = handler(event, None)
        
        assert response["statusCode"] in [400, 500]


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
