import React, { useState } from 'react';
import Head from 'next/head';
import FileUpload from '@/components/FileUpload';
import ChatInterface from '@/components/ChatInterface';

export default function Home() {
  const [documentId, setDocumentId] = useState<string | null>(null);

  const handleUploadComplete = (result: any) => {
    setDocumentId(result.documentId); // Assume backend returns a document ID
  };

  return (
    <div>
      <Head>
        <title>RAG-based Financial Q&A System</title>
        <meta name="description" content="AI-powered Q&A system for financial documents" />
      </Head>
      {/* TODO: Implement your components here */}
        {/* 
          Suggested components to implement:
          - FileUpload component for PDF upload
          - ChatInterface component for Q&A
          - DocumentViewer component for document display
        */}
      <main>
        <h1>RAG-based Financial Statement Q&A System</h1>
        <p>Upload a financial statement PDF and start asking questions.</p>

        <FileUpload
          onUploadComplete={(res) => {
            console.log('Uploaded:', res);
            setDocumentId(res.filename); // or res.documentId depending on backend
          }}
          onUploadError={(msg) => alert(`Upload error: ${msg}`)}
        />

        {documentId && <ChatInterface documentId={documentId} />}

      </main>
    </div>
  );
}
