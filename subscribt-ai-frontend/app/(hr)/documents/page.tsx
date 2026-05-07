import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Upload } from 'lucide-react';
import Link from 'next/link';

export default function DocumentsPage() {
  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Manage Documents</h1>
          <p className="text-muted-foreground">
            View and manage all uploaded policy documents
          </p>
        </div>
        <Button asChild>
          <Link href="/hr/upload">
            <Upload className="mr-2 h-4 w-4" />
            Upload New
          </Link>
        </Button>
      </div>

      {/* Empty State */}
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16">
          <FileText className="h-16 w-16 text-muted-foreground mb-4" />
          <h3 className="text-xl font-semibold mb-2">No documents yet</h3>
          <p className="text-muted-foreground text-center mb-6 max-w-md">
            Upload your first policy document to get started. Documents will appear here
            once they've been processed.
          </p>
          <Button asChild>
            <Link href="/hr/upload">Upload Document</Link>
          </Button>
        </CardContent>
      </Card>

      {/* TODO: Document list will go here */}
      {/* Features to implement:
        - List all documents with status
        - Filter by status (uploading, processing, ready, failed)
        - Search by filename
        - Sort by upload date, filename, status
        - View document details
        - Delete documents
        - Re-process failed documents
        - Download original PDFs
      */}
    </div>
  );
}
