'use client';

import { useState, useCallback } from 'react';
import { Upload, FileText, AlertCircle, CheckCircle2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import type { DocumentUploadResponse } from '@/types/document';

interface UploadingFile {
  file: File;
  progress: number;
  status: 'uploading' | 'processing' | 'complete' | 'error';
  documentId?: string;
  error?: string;
}

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
const ACCEPTED_FILE_TYPES = ['application/pdf'];

export function DocumentUploadInterface() {
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const { toast } = useToast();

  const validateFile = (file: File): string | null => {
    if (!ACCEPTED_FILE_TYPES.includes(file.type)) {
      return 'Only PDF files are supported';
    }
    if (file.size > MAX_FILE_SIZE) {
      return `File size must be less than ${MAX_FILE_SIZE / 1024 / 1024}MB`;
    }
    if (file.size === 0) {
      return 'File is empty';
    }
    return null;
  };

  const uploadFile = async (file: File) => {
    const uploadingFile: UploadingFile = {
      file,
      progress: 0,
      status: 'uploading',
    };

    setUploadingFiles((prev) => [...prev, uploadingFile]);

    try {
      // Step 1: Get pre-signed URL from API
      const response = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filename: file.name,
          contentType: file.type,
          fileSize: file.size,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to initiate upload');
      }

      const data: DocumentUploadResponse = await response.json();

      // Update with document ID
      setUploadingFiles((prev) =>
        prev.map((f) =>
          f.file === file ? { ...f, documentId: data.documentId } : f
        )
      );

      // Step 2: Upload to S3 using pre-signed URL
      const uploadResponse = await fetch(data.uploadUrl, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': file.type,
        },
      });

      if (!uploadResponse.ok) {
        throw new Error('Failed to upload file to S3');
      }

      // Step 3: Update status to processing
      setUploadingFiles((prev) =>
        prev.map((f) =>
          f.file === file
            ? { ...f, progress: 100, status: 'processing' }
            : f
        )
      );

      toast({
        title: 'Upload successful',
        description: `${file.name} is now being processed. This may take a few minutes.`,
      });

      // Poll for processing completion (simplified - in production, use WebSocket or polling)
      setTimeout(() => {
        setUploadingFiles((prev) =>
          prev.map((f) =>
            f.file === file ? { ...f, status: 'complete' } : f
          )
        );
      }, 3000);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Upload failed';

      setUploadingFiles((prev) =>
        prev.map((f) =>
          f.file === file
            ? { ...f, status: 'error', error: errorMessage }
            : f
        )
      );

      toast({
        title: 'Upload failed',
        description: errorMessage,
        variant: 'destructive',
      });
    }
  };

  const handleFiles = useCallback(
    (files: FileList | null) => {
      if (!files) return;

      const fileArray = Array.from(files);

      for (const file of fileArray) {
        const error = validateFile(file);
        if (error) {
          toast({
            title: 'Invalid file',
            description: `${file.name}: ${error}`,
            variant: 'destructive',
          });
          continue;
        }

        uploadFile(file);
      }
    },
    [toast]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      handleFiles(e.dataTransfer.files);
    },
    [handleFiles]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      handleFiles(e.target.files);
      // Reset input so same file can be selected again
      e.target.value = '';
    },
    [handleFiles]
  );

  const removeFile = (file: File) => {
    setUploadingFiles((prev) => prev.filter((f) => f.file !== file));
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-6">
      {/* Upload Area */}
      <Card>
        <CardHeader>
          <CardTitle>Upload Documents</CardTitle>
          <CardDescription>
            Drag and drop PDF files or click to browse. Maximum file size: 50MB.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            className={`
              border-2 border-dashed rounded-lg p-12 text-center transition-colors
              ${
                isDragging
                  ? 'border-primary bg-primary/5'
                  : 'border-muted-foreground/25 hover:border-muted-foreground/50'
              }
            `}
          >
            <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium mb-2">
              Drop PDF files here or click to browse
            </p>
            <p className="text-sm text-muted-foreground mb-4">
              Supported formats: PDF only
            </p>
            <input
              type="file"
              id="file-upload"
              className="hidden"
              accept=".pdf,application/pdf"
              multiple
              onChange={handleFileInput}
            />
            <Button asChild>
              <label htmlFor="file-upload" className="cursor-pointer">
                Select Files
              </label>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Upload Progress */}
      {uploadingFiles.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Upload Progress</CardTitle>
            <CardDescription>
              {uploadingFiles.filter((f) => f.status === 'complete').length} of{' '}
              {uploadingFiles.length} files processed
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {uploadingFiles.map((uploadingFile, index) => (
                <div
                  key={`${uploadingFile.file.name}-${index}`}
                  className="flex items-start gap-3 p-4 border rounded-lg"
                >
                  <FileText className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">
                          {uploadingFile.file.name}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {formatFileSize(uploadingFile.file.size)}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 flex-shrink-0"
                        onClick={() => removeFile(uploadingFile.file)}
                        disabled={uploadingFile.status === 'uploading'}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>

                    {/* Status */}
                    {uploadingFile.status === 'uploading' && (
                      <div className="space-y-2">
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary transition-all duration-300"
                            style={{ width: `${uploadingFile.progress}%` }}
                          />
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Uploading...
                        </p>
                      </div>
                    )}

                    {uploadingFile.status === 'processing' && (
                      <div className="flex items-center gap-2 text-sm text-blue-600">
                        <div className="h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                        Processing document...
                      </div>
                    )}

                    {uploadingFile.status === 'complete' && (
                      <div className="flex items-center gap-2 text-sm text-green-600">
                        <CheckCircle2 className="h-4 w-4" />
                        Processing complete
                      </div>
                    )}

                    {uploadingFile.status === 'error' && (
                      <Alert variant="destructive" className="mt-2">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                          {uploadingFile.error || 'Upload failed'}
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Information */}
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          <strong>Processing time:</strong> Large documents may take several minutes to process.
          Documents will be automatically chunked and indexed for employee queries once processing is complete.
        </AlertDescription>
      </Alert>
    </div>
  );
}
