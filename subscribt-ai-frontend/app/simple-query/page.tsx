'use client';

/**
 * Barebones query interface
 * Simple text input and output for knowledge base queries
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

export default function SimpleQueryPage() {
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
        throw new Error('KB_FUNCTION_URL not configured');
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
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h1 className="text-2xl font-bold mb-6">Policy Query</h1>
          
          {/* Query Form */}
          <form onSubmit={handleSubmit} className="mb-6">
            <div className="mb-4">
              <label htmlFor="query" className="block text-sm font-medium text-gray-700 mb-2">
                Ask a question:
              </label>
              <textarea
                id="query"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="What is the policy on remote work?"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={4}
                disabled={loading}
              />
            </div>
            
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={loading || !query.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {loading ? 'Querying...' : 'Submit'}
              </button>
              
              <button
                type="button"
                onClick={handleClear}
                disabled={loading}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 disabled:bg-gray-100 disabled:cursor-not-allowed"
              >
                Clear
              </button>
            </div>
          </form>

          {/* Error Display */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-800 font-medium">Error:</p>
              <p className="text-red-700">{error}</p>
            </div>
          )}

          {/* Response Display */}
          {response && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-semibold mb-2">Answer:</h2>
                <div className="p-4 bg-gray-50 rounded-md">
                  <p className="whitespace-pre-wrap">{response.answer}</p>
                </div>
              </div>

              {/* Citations */}
              {response.citations.length > 0 && (
                <div>
                  <h2 className="text-lg font-semibold mb-2">Sources:</h2>
                  <div className="space-y-3">
                    {response.citations.map((citation, index) => (
                      <div key={index} className="p-3 bg-blue-50 border border-blue-200 rounded-md">
                        <p className="text-sm text-gray-700 mb-2">{citation.text}</p>
                        {citation.location && (
                          <details className="text-xs text-gray-500">
                            <summary className="cursor-pointer hover:text-gray-700">
                              Source metadata
                            </summary>
                            <pre className="mt-2 p-2 bg-white rounded overflow-x-auto">
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
                <div className="text-xs text-gray-500">
                  Session ID: {sessionId}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
