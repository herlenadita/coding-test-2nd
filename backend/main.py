from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from models.schemas import ChatRequest, ChatResponse, DocumentsResponse, UploadResponse
from services.pdf_processor import PDFProcessor
from services.vector_store import VectorStoreService
from services.rag_pipeline import RAGPipeline
from config import settings
import logging
import time
import os
import shutil
import chromadb
from datetime import datetime
from models.schemas import DocumentInfo

# Configure logging
logging.basicConfig(level=settings.log_level)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="RAG-based Financial Statement Q&A System",
    description="AI-powered Q&A system for financial documents using RAG",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize services
pdf_processor = None
vector_store = None
rag_pipeline = None
uploaded_documents = []
document_chunks = []

@app.on_event("startup")
async def startup_event():
    """Initialize services on startup"""
    global pdf_processor, vector_store, rag_pipeline, uploaded_documents, document_chunks
    pdf_processor = PDFProcessor()
    vector_store = VectorStoreService()
    rag_pipeline = RAGPipeline()
    uploaded_documents.clear()
    document_chunks.clear()
    logger.info("Starting RAG Q&A System...")

@app.get("/")
async def root():
    """Health check endpoint"""
    return {"message": "RAG-based Financial Statement Q&A System is running"}

@app.post("/api/upload")
async def upload_pdf(file: UploadFile = File(...)):
    """Upload and process PDF file"""
    # 1. Validate file type (PDF)
    if file.content_type != "application/pdf":
        raise HTTPException(status_code=400, detail="Only PDF files are supported.")
    
    # 1.1 Check for duplicate upload by filename
    # if any(doc.filename == file.filename for doc in uploaded_documents):
    #     raise HTTPException(status_code=409, detail="This file has already been uploaded.")


    # 2. Save uploaded file to configured path
    upload_dir = settings.pdf_upload_path
    os.makedirs(upload_dir, exist_ok=True)

    if not os.access(upload_dir, os.W_OK):
        raise HTTPException(status_code=500, detail="Upload folder is not writable.")
    
    file_location = os.path.join(upload_dir, file.filename)

    try:
        with open(file_location, "wb") as f:
            shutil.copyfileobj(file.file, f)
    except Exception as e:
        logger.error(f"Failed to save uploaded file: {e}")
        raise HTTPException(status_code=500, detail="Failed to save uploaded file.")
    finally:
        file.file.close()

    # 3. Process PDF and extract text into chunks
    start_time = time.time()
    try:
        documents = pdf_processor.process_pdf(file_location)
        if not documents:
            raise HTTPException(status_code=500, detail="No documents were extracted from the PDF.")

        # 4. Store documents in vector database
        vector_store.add_documents(documents)
        processing_time = time.time() - start_time
        chunks_count = len(documents)
        document_chunks = documents  # store chunks globally

        # 5. Save metadata to memory
        upload_date = datetime.now()
        document_info = DocumentInfo(
            filename=file.filename,
            upload_date=upload_date,
            chunks_count=chunks_count,
            status="processed"
        )

        uploaded_documents.append(document_info)

        # 6. Return response
        return UploadResponse(
            message="File uploaded and processed successfully.",
            filename=file.filename,
            chunks_count=chunks_count,
            processing_time=processing_time
        )
    except Exception as e:
        logger.error(f"Failed to process and store PDF file: {e}")
        raise HTTPException(status_code=500, detail="Failed to process PDF file.")

@app.post("/api/chat")
async def chat(request: ChatRequest):
    """Process chat request and return AI response"""
    try:
        start_time = time.time()
        result = rag_pipeline.generate_answer(
            question=request.question,
            chat_history=request.chat_history
        )
        processing_time = time.time() - start_time
        response = ChatResponse(
            answer=result["answer"],
            sources=result["sources"],
            processing_time=processing_time
        )
        return response
    except Exception as e:
        logger.error(f"Failed to generate response: {e}")
        raise HTTPException(status_code=500, detail="Failed to generate answer.")

@app.get("/api/documents", response_model=DocumentsResponse)
async def get_documents():
    return DocumentsResponse(documents=uploaded_documents)

@app.get("/api/chunks")
async def get_chunks():
    """Return chunks of last uploaded document"""
    if not document_chunks:
        raise HTTPException(status_code=404, detail="No chunks available.")

    return [
        {
            "page_content": chunk.page_content,
            "metadata": chunk.metadata
        }
        for chunk in document_chunks
    ]


@app.post("/api/reset")
async def reset_uploaded_documents():
    """Clear all uploaded document metadata from memory"""
    global uploaded_documents
    uploaded_documents.clear()
    return {"message": "All uploaded document metadata has been cleared."}

# Run FastAPI app with Uvicorn if executed directly
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host=settings.host, port=settings.port, reload=settings.debug)