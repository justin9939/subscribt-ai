'use client';

import { useRef, useState } from 'react';
import styles from './page.module.css';

interface Citation {
  text: string;
  location: Record<string, unknown>;
}

interface QueryResponse {
  answer: string;
  citations: Citation[];
  session_id: string;
}

export default function HomePage() {
  const [query, setQuery] = useState('');
  const [response, setResponse] = useState<QueryResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [uploadMessage, setUploadMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!query.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const functionUrl = process.env.NEXT_PUBLIC_KB_FUNCTION_URL;

      if (!functionUrl) {
        throw new Error('NEXT_PUBLIC_KB_FUNCTION_URL not configured in environment');
      }

      const res = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: query.trim(),
          session_id: sessionId,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error((errorData as { message?: string }).message ?? 'Query failed');
      }

      const data: QueryResponse = await res.json();
      setResponse(data);
      setSessionId(data.session_id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const uploadUrl = process.env.NEXT_PUBLIC_UPLOAD_FUNCTION_URL;
    if (!uploadUrl) {
      setUploadStatus('error');
      setUploadMessage('NEXT_PUBLIC_UPLOAD_FUNCTION_URL not configured');
      return;
    }

    setUploadStatus('uploading');
    setUploadMessage(null);

    try {
      const arrayBuffer = await file.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);
      let binary = '';
      const chunkSize = 8192;
      for (let i = 0; i < bytes.length; i += chunkSize) {
        binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
      }
      const base64 = btoa(binary);

      const res = await fetch(uploadUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ file_name: file.name, file_content: base64 }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error((err as { error?: string }).error ?? 'Upload failed');
      }

      setUploadStatus('success');
      setUploadMessage(`"${file.name}" uploaded and indexed successfully.`);
    } catch (err) {
      setUploadStatus('error');
      setUploadMessage(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleClear = () => {
    setQuery('');
    setResponse(null);
    setError(null);
    setSessionId(null);
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>Subscribt AI</h1>
        <p className={styles.subtitle}>Get concise insights from dense policies and guidelines, every one backed by a citation.</p>
      </header>

      {/* Document Upload */}
      <div className={styles.uploadSection}>
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.docx,.txt,.md"
          className={styles.hiddenInput}
          onChange={handleFileUpload}
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploadStatus === 'uploading'}
          className={styles.uploadButton}
        >
          {uploadStatus === 'uploading' ? 'Uploading…' : 'Upload Document'}
        </button>

        {uploadMessage && (
          <p className={`${styles.uploadMessage} ${
            uploadStatus === 'success' ? styles.uploadMessageSuccess : styles.uploadMessageError
          }`}>
            {uploadMessage}
          </p>
        )}
      </div>

      {/* Query Form */}
      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.formGroup}>
          <label htmlFor="query" className={styles.label}>
            Your question
          </label>
          <textarea
            id="query"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="What is the policy on remote work?"
            className={styles.textarea}
            rows={4}
            disabled={loading}
          />
        </div>

        <div className={styles.buttonRow}>
          <button
            type="submit"
            disabled={loading || !query.trim()}
            className={styles.buttonPrimary}
          >
            {loading ? 'Querying…' : 'Submit'}
          </button>

          <button
            type="button"
            onClick={handleClear}
            disabled={loading}
            className={styles.buttonSecondary}
          >
            Clear
          </button>
        </div>
      </form>

      {/* Error Display */}
      {error && (
        <div className={styles.errorCard}>
          <p className={styles.errorCardLabel}>Error</p>
          <p className={styles.errorCardMessage}>{error}</p>
        </div>
      )}

      {/* Response Display */}
      {response && (
        <div className={styles.responseSection}>
          <div>
            <h2 className={styles.sectionHeading}>Answer</h2>
            <div className={styles.answerCard}>
              {response.answer}
            </div>
          </div>

          {/* Citations */}
          {response.citations.length > 0 && (
            <div>
              <h2 className={styles.sectionHeading}>Sources</h2>
              <div className={styles.citationsGrid}>
                {response.citations.map((citation, index) => (
                  <div key={index} className={styles.citationCard}>
                    <p className={styles.citationText}>
                      {citation.text}
                    </p>
                    {citation.location && Object.keys(citation.location).length > 0 && (
                      <details className={styles.citationDetails}>
                        <summary>Source metadata</summary>
                        <pre className={styles.citationPre}>
                          {JSON.stringify(citation.location, null, 2)}
                        </pre>
                      </details>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Session Info */}
          {sessionId && (
            <div className={styles.sessionInfo}>
              Session: {sessionId}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
