from typing import List, Dict, Any
from langchain.schema import Document
from langchain_core.prompts import PromptTemplate
from langchain.chat_models import ChatOpenAI
from services.vector_store import VectorStoreService
from config import settings
import logging

logger = logging.getLogger(__name__)

class RAGPipeline:
    def __init__(self):
        # Inisialisasi layanan vector store dan LLM client
        self.vector_store = VectorStoreService()
        self.llm = ChatOpenAI(temperature=0.3, openai_api_key=settings.openai_api_key)

        # Template prompt dasar
        self.prompt_template = PromptTemplate(
            input_variables=["context", "question"],
            template="""
You are a smart assistant that helps answer questions based on the following document:
Document:
{context}

Question:
{question}

Complete and clear answer:
"""
        )

    def generate_answer(self, question: str, chat_history: List[Dict[str, str]] = None) -> Dict[str, Any]:
        """Generate answer using RAG pipeline"""
        logger.info(f"Generating answer for question: {question}")
        
        # 1. Retrieve relevant documents
        documents = self._retrieve_documents(question)

        # 2. Generate context from retrieved documents
        context = self._generate_context(documents)

        # 3. Generate answer using LLM
        answer = self._generate_llm_response(question, context, chat_history)

        # 4. Return answer with sources
        sources = [doc.metadata.get("source", "unknown") for doc in documents]

        # return {
        #     "answer": answer,
        #     "sources": sources
        # }

        return {
            "answer": answer,
            "sources": [
                {
                    "content": doc.page_content,
                    "page": doc.metadata.get("page", -1),
                    "score": 0.0,  # bisa diganti skor jika tersedia
                    "metadata": doc.metadata
                }
                for doc in documents
            ]
        }


    def _retrieve_documents(self, query: str) -> List[Document]:
        """Retrieve relevant documents for the query"""
        try:
            documents = self.vector_store.similarity_search(query, k=5)
            logger.info(f"Retrieved {len(documents)} documents.")
            return [doc for doc, _ in documents]
        except Exception as e:
            logger.error(f"Document retrieval failed: {e}")
            return []

    def _generate_context(self, documents: List[Document]) -> str:
        """Generate context from retrieved documents"""
        return "\n\n".join([doc.page_content for doc in documents])

    def _generate_llm_response(self, question: str, context: str, chat_history: List[Dict[str, str]] = None) -> str:
        """Generate response using LLM"""
        try:
            prompt = self.prompt_template.format(context=context, question=question)
            response = self.llm.predict(prompt)
            return response.strip()
        except Exception as e:
            logger.error(f"LLM response generation failed: {e}")
            return "Sorry, there was an error while generating the answer."

