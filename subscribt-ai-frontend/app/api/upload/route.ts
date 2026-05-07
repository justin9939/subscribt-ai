import { NextRequest, NextResponse } from 'next/server';
import type { DocumentUploadRequest, DocumentUploadResponse } from '@/types/document';
import { ErrorCode, HTTPStatus } from '@/types/api';

// This endpoint generates a pre-signed URL for uploading to S3
// The actual upload happens client-side directly to S3
// After upload, S3 triggers EventBridge → Step Functions for processing

export async function POST(request: NextRequest) {
  try {
    const body: DocumentUploadRequest = await request.json();

    // Validate request
    if (!body.filename || !body.contentType || !body.fileSize) {
      return NextResponse.json(
        {
          code: ErrorCode.MISSING_REQUIRED_FIELD,
          message: 'Missing required fields: filename, contentType, fileSize',
          timestamp: new Date().toISOString(),
        },
        { status: HTTPStatus.BAD_REQUEST }
      );
    }

    // Validate file type
    if (body.contentType !== 'application/pdf') {
      return NextResponse.json(
        {
          code: ErrorCode.INVALID_DOCUMENT_FORMAT,
          message: 'Only PDF files are supported',
          timestamp: new Date().toISOString(),
        },
        { status: HTTPStatus.BAD_REQUEST }
      );
    }

    // Validate file size (50MB max)
    const MAX_FILE_SIZE = 50 * 1024 * 1024;
    if (body.fileSize > MAX_FILE_SIZE) {
      return NextResponse.json(
        {
          code: ErrorCode.DOCUMENT_TOO_LARGE,
          message: `File size must be less than ${MAX_FILE_SIZE / 1024 / 1024}MB`,
          timestamp: new Date().toISOString(),
        },
        { status: HTTPStatus.PAYLOAD_TOO_LARGE }
      );
    }

    // Generate unique document ID
    const documentId = `doc_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    
    // Generate S3 key
    const s3Key = `uploads/${documentId}/${body.filename}`;

    // TODO: Call Lambda or API Gateway endpoint to generate pre-signed URL
    // For now, return mock response
    // In production, this would call AWS SDK to generate pre-signed URL:
    // const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
    // const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
    
    const mockUploadUrl = `https://${process.env.S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${s3Key}`;
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString(); // 15 minutes

    // TODO: Store document metadata in DynamoDB with status 'uploading'
    // This would be done via lib/db/documents.ts
    // await createDocument({
    //   id: documentId,
    //   filename: body.filename,
    //   s3Key,
    //   fileSize: body.fileSize,
    //   status: 'uploading',
    //   uploadedBy: 'hr-user-id', // Get from auth context
    //   uploadedAt: new Date().toISOString(),
    //   updatedAt: new Date().toISOString(),
    // });

    const response: DocumentUploadResponse = {
      documentId,
      uploadUrl: mockUploadUrl,
      expiresAt,
    };

    // Log structured event to CloudWatch
    console.log(JSON.stringify({
      event: 'document_upload_initiated',
      documentId,
      filename: body.filename,
      fileSize: body.fileSize,
      timestamp: new Date().toISOString(),
    }));

    return NextResponse.json(response, { status: HTTPStatus.OK });
  } catch (error) {
    console.error('Upload endpoint error:', error);

    return NextResponse.json(
      {
        code: ErrorCode.INTERNAL_SERVER_ERROR,
        message: 'Failed to process upload request',
        timestamp: new Date().toISOString(),
      },
      { status: HTTPStatus.INTERNAL_SERVER_ERROR }
    );
  }
}
