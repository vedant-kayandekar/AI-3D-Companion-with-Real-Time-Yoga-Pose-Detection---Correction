from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from langchain_groq import ChatGroq
from langchain_core.runnables import RunnablePassthrough
from langchain_core.retrievers import BaseRetriever

import os
from dotenv import load_dotenv

load_dotenv()

GROQ_API_KEY = os.getenv("GROQ_API_KEY")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")


def get_llm_chain(retriever):
    from langchain_google_genai import ChatGoogleGenerativeAI
    import logging
    logger = logging.getLogger(__name__)

    # Default fallback: Google Gemini 3.5 Flash
    gemini_llm = ChatGoogleGenerativeAI(
        model="gemini-3.5-flash",
        google_api_key=GEMINI_API_KEY,
        temperature=0.3
    )

    if GROQ_API_KEY and len(GROQ_API_KEY) > 10:
        try:
            groq_llm = ChatGroq(
                groq_api_key=GROQ_API_KEY,
                model_name="llama-3.1-8b-instant",
                temperature=0.3
            )
            # Automatic fallback: If Groq hits 401/429/timeout, LangChain transparently calls Gemini
            llm = groq_llm.with_fallbacks([gemini_llm])
            logger.info("Initialized Groq LLM with Gemini 3.5 Flash fallback")
        except Exception as e:
            logger.warning(f"Groq init failed: {e}. Using Gemini 3.5 Flash directly.")
            llm = gemini_llm
    else:
        logger.info("Using Gemini 3.5 Flash directly for RAG responses")
        llm = gemini_llm

    # Convert to ChatPromptTemplate for LCEL compatibility
    prompt = ChatPromptTemplate.from_template("""
You are **YogaBot**, an AI-powered Yoga & Wellness Assistant.  
Your purpose is to help users understand yoga techniques, philosophies, benefits, alignment cues, and general wellness information **based only on the provided context**.

⚠️ **Important Rules**  
- Use ONLY the information from the context below.  
- If the context does not contain the answer, say:  
  **"I'm sorry, but I couldn't find relevant information in the provided documents."**  
- Do NOT invent new poses, benefits, or health facts.  
- Do NOT give medical advice, diagnoses, or personalized treatment plans.  
- Keep the tone calm, supportive, and easy to understand.

🧘 **Context**:
{context}

🙋 **User Question**:
{question}

💬 **Answer**:
""")

    # LCEL chain: format_docs -> llm -> parse output
    def format_docs(docs):
        return "\n\n".join(doc.page_content for doc in docs)

    chain = (
        {"context": retriever | format_docs, "question": RunnablePassthrough()}
        | prompt
        | llm
        | StrOutputParser()
    )

    print(chain)

    return chain
