from typing import List, Tuple
from langchain.schema import Document
from chromadb import Client
from chromadb.config import Settings
from sentence_transformers import SentenceTransformer
import logging
import uuid

logger = logging.getLogger(__name__)

class VectorStoreService:
    def __init__(self):
        # Initialize vector store and local embedding model
        self.client = Client(Settings())
        self.collection = self.client.get_or_create_collection("documents")
        
        # Use a local transformer model for embeddings
        self.embedding_model = SentenceTransformer("all-MiniLM-L6-v2")
        logger.info("Initialized VectorStoreService with local sentence-transformers model.")

    def add_documents(self, documents: List[Document]) -> None:
        """Add documents to the vector store"""
        try:
            texts = [doc.page_content for doc in documents]
            metadatas = [doc.metadata for doc in documents]
            embeddings = self._generate_embedding_batch(texts)

            self.collection.add(
                ids=[str(uuid.uuid4()) for _ in documents],
                documents=texts,
                metadatas=metadatas,
                embeddings=embeddings
            )

            logger.info(f"Added {len(documents)} documents to the vector store.")
        except Exception as e:
            logger.error(f"Failed to add documents to vector store: {e}")
            raise

    def similarity_search(self, query: str, k: int = 5) -> List[Tuple[Document, float]]:
        """Search for similar documents"""
        try:
            query_embedding = self._generate_embedding(query)
            results = self.collection.query(
                query_embeddings=[query_embedding],
                n_results=k
            )
            return [
                (Document(page_content=doc, metadata=meta), score)
                for doc, meta, score in zip(
                    results["documents"][0],
                    results["metadatas"][0],
                    results["distances"][0]
                )
            ]
        except Exception as e:
            logger.error(f"Failed to perform similarity search: {e}")
            raise

    def delete_documents(self, document_ids: List[str]) -> None:
        """Delete documents from vector store"""
        try:
            self.collection.delete(ids=document_ids)
            logger.info(f"Deleted {len(document_ids)} documents from the vector store.")
        except Exception as e:
            logger.error(f"Failed to delete documents from vector store: {e}")
            raise

    def get_document_count(self) -> int:
        """Get total number of documents in vector store"""
        try:
            count = self.collection.count()
            logger.info(f"Total documents in vector store: {count}")
            return count
        except Exception as e:
            logger.error(f"Failed to get document count: {e}")
            raise

    def _generate_embedding(self, text: str) -> List[float]:
        """Generate a single embedding using local model"""
        try:
            return self.embedding_model.encode(text).tolist()
        except Exception as e:
            logger.error(f"Embedding generation failed: {e}")
            raise

    def _generate_embedding_batch(self, texts: List[str]) -> List[List[float]]:
        """Generate embeddings for a batch of texts using local model"""
        try:
            return self.embedding_model.encode(texts, convert_to_numpy=True).tolist()
        except Exception as e:
            logger.error(f"Batch embedding generation failed: {e}")
            raise
