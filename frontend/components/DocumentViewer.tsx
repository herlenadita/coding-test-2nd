import React, { useState } from 'react';

interface Source {
  content: string;
  page?: number;
  metadata?: Record<string, any>;
}

interface DocumentViewerProps {
  sources: Source[];
}

const KEYWORDS = ['revenue', 'profit', 'net income', 'sales', 'turnover'];

function parseTextTable(text: string): string[][] {
  const lines = text.trim().split(/\r?\n/);
  const rows: string[][] = [];
  for (const line of lines) {
    const cols = line.trim().split(/\s{2,}|\t+/);
    if (cols.length > 1) rows.push(cols);
  }
  return rows;
}

function highlightKeywords(text: string, keywords: string[]): React.ReactNode {
  if (!keywords || keywords.length === 0) return text;

  const regex = new RegExp(`(${keywords.join('|')})`, 'gi');
  const parts = text.split(regex);
  return parts.map((part, idx) =>
    regex.test(part) ? <mark key={idx}>{part}</mark> : part
  );
}

export default function DocumentViewer({ sources }: DocumentViewerProps) {
  const [expandedMap, setExpandedMap] = useState<{ [key: number]: boolean }>({});
  const [expandAll, setExpandAll] = useState(false);

  const toggleExpand = (idx: number) => {
    setExpandedMap((prev) => ({ ...prev, [idx]: !prev[idx] }));
  };

  const toggleAll = () => {
    const newState = !expandAll;
    const newMap: { [key: number]: boolean } = {};
    sources.forEach((_, idx) => (newMap[idx] = newState));
    setExpandedMap(newMap);
    setExpandAll(newState);
  };

  if (!sources || sources.length === 0) return null;

  const groupedByPage = sources.reduce((acc, src, idx) => {
    const page = src.page ?? src.metadata?.page ?? src.metadata?.page_number ?? '–';
    acc[page] = acc[page] || [];
    acc[page].push({ ...src, idx });
    return acc;
  }, {} as Record<string, { content: string; idx: number; metadata?: any }[]>);

  return (
    <div style={{ marginTop: 20, borderTop: '1px solid #ddd', paddingTop: 12 }}>
      <strong style={{ display: 'block', marginBottom: 8 }}>📄 Source Chunks</strong>
      <button onClick={toggleAll} style={{ marginBottom: '10px' }}>
        {expandAll ? 'Collapse All' : 'Expand All'}
      </button>

      {Object.entries(groupedByPage).map(([page, chunks]) => (
        <div key={page}>
          <h4 style={{ marginTop: 12, marginBottom: 6 }}>📄 Page {page}</h4>
          {chunks.map(({ content, idx }) => {
            const rows = parseTextTable(content);
            const isTable = rows.length >= 2 && rows[0].length > 1;
            const showAll = expandedMap[idx] || expandAll;
            const visibleText = showAll ? content : content.slice(0, 300);

            return (
              <div
                key={idx}
                style={{
                  padding: '10px 14px',
                  backgroundColor: '#fafafa',
                  border: '1px solid #eee',
                  borderRadius: '6px',
                  marginBottom: '10px',
                  fontSize: '0.95rem',
                  lineHeight: '1.5',
                  whiteSpace: 'pre-wrap',
                }}
              >
                {isTable ? (
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ borderCollapse: 'collapse', width: '100%' }}>
                      <thead>
                        <tr>
                          {rows[0].map((col, i) => (
                            <th
                              key={i}
                              style={{ border: '1px solid #ccc', padding: '6px', textAlign: 'left' }}
                            >
                              {highlightKeywords(col, KEYWORDS)}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {rows.slice(1).map((row, ri) => (
                          <tr key={ri}>
                            {row.map((cell, ci) => (
                              <td key={ci} style={{ border: '1px solid #eee', padding: '6px' }}>
                                {highlightKeywords(cell, KEYWORDS)}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div>
                    {highlightKeywords(visibleText, KEYWORDS)}
                    {content.length > 300 && (
                      <span
                        onClick={() => toggleExpand(idx)}
                        style={{
                          marginLeft: '6px',
                          color: '#0070f3',
                          cursor: 'pointer',
                          fontWeight: 500,
                        }}
                      >
                        {showAll ? ' Show less' : '... Show more'}
                      </span>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
