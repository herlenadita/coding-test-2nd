// components/ChatInterface.tsx
import React, { useState, useEffect, useRef } from 'react';
import DocumentViewer from './DocumentViewer';

interface Message {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  sources?: any[];
}

export default function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [documentId, setDocumentId] = useState<string>('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: crypto.randomUUID(),
      type: 'user',
      content: input,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: userMessage.content,
          documentId,
          chatHistory: [],
        }),
      });

      const data = await res.json();

      const assistantMessage: Message = {
        id: crypto.randomUUID(),
        type: 'assistant',
        content: data.answer,
        sources: data.sources || [],
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          type: 'assistant',
          content: '❌ Failed to get response.',
        },
      ]);
    }

    setIsLoading(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleSendMessage();
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) uploadFile(file);
  };

  const uploadFile = async (file: File) => {
    if (!file || file.type !== 'application/pdf') {
      alert('Please select a valid PDF file.');
      return;
    }

    setUploadedFileName(file.name);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Upload failed');

      setUploadedFileName(data.filename || file.name);
      if (data.documentId) {
        setDocumentId(data.documentId);
      }
    } catch (error: any) {
      alert('❌ Upload failed: ' + error.message);
      setUploadedFileName(null);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) uploadFile(file);
  };

  const isLikelyJSON = (text: string) =>
    text?.trim().startsWith('{') || text?.includes('metadata') || text?.includes('"score"');

  return (
    <div
      className="chat-container"
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleDrop}
    >
      <div className="chat-messages">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`chat-bubble ${msg.type === 'user' ? 'user-bubble' : 'bot-bubble'}`}
          >
            <div className="chat-content">{msg.content}</div>

            {/* {msg.sources && msg.sources.length > 0 && (
              <ul className="chat-sources">
                {msg.sources.map((src, idx) => {
                  const text = typeof src === 'string' ? src : src.chunk || src.page_content || '';
                  const page = src.metadata?.page ?? src.metadata?.page_number;
                  if (!text || isLikelyJSON(text)) return null;

                  return (
                    <li key={idx}>
                      {text}
                      {page !== undefined && (
                        <span style={{ color: '#888', marginLeft: '6px' }}>
                          (page {page})
                        </span>
                      )}
                    </li>
                  );
                })}
              </ul>
            )} */}
            {msg.type === 'assistant' && msg.sources && msg.sources.length > 0 && (
              <DocumentViewer sources={msg.sources} />
            )}
          </div>
        ))}
        {isLoading && <p className="chat-loading">Loading...</p>}
        <div ref={messagesEndRef} />
      </div>

      <div className="chat-input-area">
        <label className="upload-button-inline">
          📎
          <input type="file" accept=".pdf" onChange={handleFileSelect} hidden />
        </label>
        <input
          type="text"
          value={input}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder="Ask a question or upload a PDF..."
          className="chat-input wide"
        />
        <button
          onClick={handleSendMessage}
          className="chat-send-button"
          disabled={isLoading}
        >
          Send
        </button>
      </div>

      {uploadedFileName && (
        <div className="uploaded-info">📄 {uploadedFileName} uploaded</div>
      )}
    </div>
  );
}
