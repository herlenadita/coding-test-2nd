// pages/index.tsx
import Head from 'next/head';
import ChatInterface from '@/components/ChatInterface'; // Pastikan path sesuai struktur proyek
import Image from 'next/image'

export default function Home() {
  return (
    <div className="chat-wrapper">
      <Head>
        <title>RAG Q&A</title>
      </Head>
      {/* TODO: Implement your components here */}
      {/* 
        Suggested components to implement:
        - FileUpload component for PDF upload
        - ChatInterface component for Q&A
        - DocumentViewer component for document display
      */}
      <header className="chat-header">
        <h1 className="main-title">
          <img src="/images/logo.png" alt="logo" height={40} />
          RAG-based Financial Statement Q&A System
        </h1>
        <p className="main-subtitle">
          Upload a financial statement PDF and start asking questions.
        </p>
      </header>

      <ChatInterface />
    </div>
  );
}
