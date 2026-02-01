'use client';

import { useState } from 'react';

export default function AICoach() {
  const [analysis, setAnalysis] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startAnalysis = async () => {
    setAnalysis('');
    setError(null);
    setIsStreaming(true);

    try {
      const response = await fetch('/api/analysis/stream');

      if (!response.ok) {
        throw new Error('Failed to start analysis');
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error('No response body');
      }

      while (true) {
        const { done, value } = await reader.read();
        
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            
            if (data === '[DONE]') {
              setIsStreaming(false);
              return;
            }

            try {
              const parsed = JSON.parse(data);
              if (parsed.content) {
                setAnalysis((prev) => prev + parsed.content);
              }
              if (parsed.error) {
                setError(parsed.error);
                setIsStreaming(false);
                return;
              }
            } catch (e) {
              // Skip invalid JSON
            }
          }
        }
      }

      setIsStreaming(false);
    } catch (err: any) {
      console.error('Streaming error:', err);
      setError(err.message);
      setIsStreaming(false);
    }
  };

  return (
    <div className="bg-ledger-card p-6 rounded-xl border border-ledger-border h-full">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-lg font-semibold">AI Financial Coach</h3>
          <p className="text-sm text-ledger-text-secondary">Personalized insights</p>
        </div>
        <button
          onClick={startAnalysis}
          disabled={isStreaming}
          className="px-4 py-2 bg-ledger-cyan text-ledger-black font-semibold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-ledger-cyan/90 transition-all"
        >
          {isStreaming ? 'Analyzing...' : 'Get Insights'}
        </button>
      </div>

      {error && (
        <div className="p-4 bg-ledger-red/10 border border-ledger-red rounded-lg mb-4">
          <p className="text-ledger-red text-sm">{error}</p>
        </div>
      )}

      {(analysis || isStreaming) && (
        <div className="prose prose-invert max-w-none">
          <div className="text-sm leading-relaxed whitespace-pre-wrap">
            {analysis || 'Analyzing your finances...'}
            {isStreaming && (
              <span className="inline-block animate-pulse ml-1 text-ledger-green">▊</span>
            )}
          </div>
        </div>
      )}

      {!analysis && !isStreaming && !error && (
        <div className="text-center py-12 text-ledger-text-secondary">
          <p>Click "Get Insights" to receive personalized financial advice</p>
        </div>
      )}
    </div>
  );
}
