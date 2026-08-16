from fastapi import APIRouter, Form
from fastapi.responses import JSONResponse
from modules.llm import get_llm_chain
from modules.query_handlers import query_chain
from langchain_core.documents import Document
from langchain_core.retrievers import BaseRetriever
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from pinecone import Pinecone
from pydantic import Field
from typing import List, Optional
from logger import logger
import os

router = APIRouter()

@router.post("/ask/")
async def ask_question(question: str = Form(...)):
    try:
        logger.info(f"user querry:{question}")

        # embed model + pinecone setup
        pc = Pinecone(api_key=os.environ.get("PINECONE_API_KEY"))
        index = pc.Index(os.environ.get("PINECONE_INDEX_NAME", "yogaindex2"))
        api_key = os.environ.get("GEMINI_API_KEY")
        if not api_key:
            raise ValueError("GEMINI_API_KEY is not set in the environment")
        embed_model = GoogleGenerativeAIEmbeddings(model="models/embedding-001", google_api_key=api_key)
        embedded_query = embed_model.embed_query(question)
        res = index.query(vector=embedded_query, top_k=3, include_metadata=True)

        docs = [
            Document(
                page_content=match["metadata"].get("text", ""),
                metadata=match["metadata"]
            ) for match in res["matches"]
        ]
        
        logger.info(f"🧠 RAG Retrieved {len(docs)} document chunks from Pinecone.")
        for i, doc in enumerate(docs):
            logger.info(f"   Chunk {i+1} preview: {doc.page_content[:100]}...")

        class SimpleRetriever(BaseRetriever):
            tags: Optional[List[str]] = Field(default_factory=list)
            metadata: Optional[dict] = Field(default_factory=dict)

            def __init__(self, documents: List[Document]):
                super().__init__()
                self._docs = documents

            def _get_relevant_documents(self, query: str) -> List[Document]:
                return self._docs

        retriever = SimpleRetriever(docs)
        chain = get_llm_chain(retriever)
        result = query_chain(chain, question)

        # Extract unique sources (just the filename)
        sources = list(set([os.path.basename(doc.metadata.get("source", "Unknown")) for doc in docs]))
        result["sources"] = sources

        logger.info(f"query successful with sources: {sources}")
        return result

    except Exception as e:
        logger.exception("Error during question ask")
        return JSONResponse(status_code=500, content={"error": str(e)})
