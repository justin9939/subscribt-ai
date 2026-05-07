'use client';

/**
 * Barebones query interface - text input and output only
 */

import { useState } from 'react';

interface Citation {
  text: string;
  location: Record<string, any>;
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
        throw new Error(errorData.message || 'Query failed');
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

  const handleClear = () => {
    setQuery('');
    setResponse(null);
    setError(null);
    setSessionId(null);
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '40px 20px' }}>
      <h1 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '24px' }}>
        Policy Query
      </h1>
      
      {/* Query Form */}
      <form onSubmit={handleSubmit} style={{ marginBottom: '24px' }}>
        <div style={{ marginBottom: '16px' }}>
          <label 
            htmlFor="query" 
            style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}
          >
            Ask a question:
          </label>
          <textarea
            id="query"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="What is the policy on remote work?"
            style={{
              width: '100%',
              padding: '8px',
              border: '1px solid #ccc',
              borderRadius: '4px',
              fontSize: '14px',
              fontFamily: 'inherit',
            }}
            rows={4}
            disabled={loading}
          />
        </div>
        
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            type="submit"
            disabled={loading || !query.trim()}
            style={{
              padding: '8px 16px',
              backgroundColor: loading || !query.trim() ? '#ccc' : '#0070f3',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: loading || !query.trim() ? 'not-allowed' : 'pointer',
              fontSize: '14px',
            }}
          >
            {loading ? 'Querying...' : 'Submit'}
          </button>
          
          <button
            type="button"
            onClick={handleClear}
            disabled={loading}
            style={{
              padding: '8px 16px',
              backgroundColor: '#f0f0f0',
              color: '#333',
              border: 'none',
              borderRadius: '4px',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontSize: '14px',
            }}
          >
            Clear
          </button>
        </div>
      </form>

      {/* Error Display */}
      {error && (
        <div 
          style={{
            marginBottom: '24px',
            padding: '12px',
            backgroundColor: '#fee',
            border: '1px solid #fcc',
            borderRadius: '4px',
          }}
        >
          <p style={{ fontWeight: '500', marginBottom: '4px' }}>Error:</p>
          <p>{error}</p>
        </div>
      )}

      {/* Response Display */}
      {response && (
        <div>
          <div style={{ marginBottom: '24px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px' }}>
              Answer:
            </h2>
            <div 
              style={{
                padding: '12px',
                backgroundColor: '#f9f9f9',
                borderRadius: '4px',
                whiteSpace: 'pre-wrap',
              }}
            >
              {response.answer}
            </div>
          </div>

          {/* Citations */}
          {response.citations.length > 0 && (
            <div style={{ marginBottom: '24px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px' }}>
                Sources:
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {response.citations.map((citation, index) => (
                  <div 
                    key={index}
                    style={{
                      padding: '12px',
                      backgroundColor: '#e6f2ff',
                      border: '1px solid #b3d9ff',
                      borderRadius: '4px',
                    }}
                  >
                    <p style={{ fontSize: '14px', marginBottom: '8px' }}>
                      {citation.text}
                    </p>
                    {citation.location && Object.keys(citation.location).length > 0 && (
                      <details style={{ fontSize: '12px', color: '#666' }}>
                        <summary style={{ cursor: 'pointer' }}>
                          Source metadata
                        </summary>
                        <pre 
                          style={{
                            marginTop: '8px',
                            padding: '8px',
                            backgroundColor: 'white',
                            borderRadius: '4px',
                            overflow: 'auto',
                            fontSize: '11px',
                          }}
                        >
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
            <div style={{ fontSize: '12px', color: '#666' }}>
              Session ID: {sessionId}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
