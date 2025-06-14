// components/DocumentViewer.tsx
import React from 'react';

interface Source {
  content: string;
  page?: number;
  metadata?: Record<string, any>;
}

interface DocumentViewerProps {
  sources: Source[];
}

export default function DocumentViewer({ sources }: DocumentViewerProps) {
  if (!sources || sources.length === 0) return null;

  return (
    <div className="document-viewer">
      <h3>📑 Source Chunks</h3>
      <ul>
        {sources.map((src, idx) => (
          <li key={idx} style={{ marginBottom: '1rem', padding: '8px', background: '#f8f8f8', borderRadius: '4px' }}>
            <div style={{ whiteSpace: 'pre-wrap', fontSize: '0.95rem' }}>
              {src.content}
            </div>
            {src.page !== undefined && (
              <div style={{ fontSize: '0.8rem', color: '#666' }}>
                Page {src.page}
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
