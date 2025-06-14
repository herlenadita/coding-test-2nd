from typing import List, Tuple
from langchain.schema import Document
from chromadb import Client
from chromadb.config import Settings
from config import settings
from openai import OpenAI
import logging

logger = logging.getLogger(__name__)

class VectorStoreService:
    def __init__(self):
        # Initialize vector store with REST client
        self.client = Client(Settings())  # Ini cukup

        self.collection = self.client.get_or_create_collection("documents")
        self.openai_client = OpenAI(api_key=settings.openai_api_key)

    def add_documents(self, documents: List[Document]) -> None:
        """Add documents to the vector store"""
        try:
            embeddings = [self._generate_embedding(doc.page_content) for doc in documents]
            import uuid

            self.collection.add(
                ids=[str(uuid.uuid4()) for _ in documents],
                documents=[doc.page_content for doc in documents],
                metadatas=[doc.metadata for doc in documents],
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
        """Generate embeddings for the given text using OpenAI"""
        try:
            response = self.openai_client.embeddings.create(
                input=text,
                model=settings.embedding_model
            )
            return response.data[0].embedding
        except Exception as e:
            logger.error(f"Embedding generation failed: {e}")
            raise
