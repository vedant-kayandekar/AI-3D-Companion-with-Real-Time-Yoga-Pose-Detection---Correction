from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from langchain_groq import ChatGroq
from langchain_core.runnables import RunnablePassthrough
from langchain_core.retrievers import BaseRetriever

import os
from dotenv import load_dotenv

load_dotenv()

GROQ_API_KEY = os.getenv("GROQ_API_KEY")


def get_llm_chain(retriever):
    llm = ChatGroq(
        groq_api_key=GROQ_API_KEY,
        model_name="llama-3.1-8b-instant"   ,
    )

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
