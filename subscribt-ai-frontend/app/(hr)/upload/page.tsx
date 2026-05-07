import { DocumentUploadInterface } from '@/components/hr/document-upload-interface';

export default function UploadPage() {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Upload Policy Documents</h1>
        <p className="text-muted-foreground">
          Upload Codes of Conduct, workplace policies, employment laws, and other policy documents.
          Documents will be processed and made available for employee queries.
        </p>
      </div>
      <DocumentUploadInterface />
    </div>
  );
}
