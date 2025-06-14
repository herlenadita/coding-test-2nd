import React, { useRef, useState } from 'react';

interface FileUploadProps {
  onUploadComplete?: (result: any) => void;
  onUploadError?: (error: string) => void;
}

export default function FileUpload({ onUploadComplete, onUploadError }: FileUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [progressText, setProgressText] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected || selected.type !== 'application/pdf') {
      onUploadError?.('Only PDF files are allowed.');
      return;
    }
    setFile(selected);
    setProgressText(`Selected file: ${selected.name}`);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const dropped = e.dataTransfer.files[0];
    if (!dropped || dropped.type !== 'application/pdf') {
      onUploadError?.('Only PDF files are allowed.');
      return;
    }
    setFile(dropped);
    setProgressText(`Dropped file: ${dropped.name}`);
  };

  const handleUpload = async () => {
    if (!file) return;

    setIsUploading(true);
    setProgressText('Uploading...');

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const result = await res.json();

      if (!res.ok) {
        // Show FastAPI error detail if available
        const errorMsg =
          result.detail || result.error || 'Upload failed with unknown error.';
        throw new Error(errorMsg);
      }

      onUploadComplete?.(result);
      setProgressText('✅ Upload complete!');
      setFile(null);
    } catch (err: any) {
      const message = err.message || 'Upload failed.';
      onUploadError?.(message);
      setProgressText(`❌ ${message}`);
    } finally {
      setIsUploading(false);
    }
  };


  return (
    <div className="file-upload-container">
      <div
        className="drop-area"
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
      >
        <p>Drag & drop a PDF here or click to select</p>
        {file && <p className="file-name">{file.name}</p>}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept=".pdf"
        onChange={handleFileSelect}
        style={{ display: 'none' }}
      />

      <button
        onClick={handleUpload}
        disabled={!file || isUploading}
        className="upload-button"
      >
        {isUploading ? 'Uploading...' : 'Upload PDF'}
      </button>

      <p
        className="progress-text"
        style={{
          color: progressText.startsWith('✅')
            ? 'green'
            : progressText.startsWith('❌')
            ? 'red'
            : 'black',
        }}
      >
        {progressText}
      </p>

    </div>
  );
}
