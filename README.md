# YogaKickFit AI

YogaKickFit AI is a comprehensive, AI-powered interactive wellness application featuring a real-time 3D avatar. It provides conversational and visual guidance for Yoga and Kickboxing routines, leveraging state-of-the-art LLMs, Text-to-Speech (TTS), and Retrieval-Augmented Generation (RAG).

## Architecture

This is a unified monorepo containing three microservices:

1. **Frontend (React / Vite / Three.js)**
   - Interactive 3D avatar with real-time lip-sync (`wawa-lipsync`)
   - Chat UI with procedural animations and responsive layout
   - Knowledge Base upload interface

2. **Backend (Node.js / Express / WebSocket)**
   - Single-process architecture managing HTTP routes and WebSocket streaming
   - Native integration with Gemini AI for conversational generation
   - Sentence chunking for real-time audio pipeline
   - **TTS Engine:** Local Piper TTS (primary) with Edge-TTS (fallback)
   - PostgreSQL integration for user management and chat history
   - "Guest Mode" for limited unauthenticated access

3. **RAG Service (Python / FastAPI / Pinecone)**
   - Vector database integration via LangChain and Pinecone
   - PDF ingestion and text chunking
   - Retrieval-augmented generation for specialized yoga and kickboxing knowledge

## Step-by-Step Setup Guide

### Prerequisites
- Node.js (v18+)
- Python (3.9+)
- PostgreSQL database
- ffmpeg installed and available in system PATH

### 1. Database Setup
Ensure PostgreSQL is running, and you have a database named `aiyoga`.
Initialize the tables by running the schema script from the `backend` directory:
```bash
psql -U postgres -d aiyoga -f schema.sql
```

### 2. Environment Variables
Ensure all three `.env` files are in place with the correct keys:
- `backend/.env` (Database credentials, Gemini API key, ElevenLabs, etc.)
- `frontend/.env` (`VITE_API_URL`, `VITE_RAG_API_URL`)
- `rag-service/.env` (Pinecone API key, Groq API key, Google API key)

### 3. Start the RAG Service (FastAPI)
Open a new terminal in the root directory:
```bash
cd rag-service
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

### 4. Start the Node.js Backend
Open a second terminal in the root directory:
```bash
cd backend
npm install
npm start
```
*Note: The backend will automatically start the Piper TTS process pool.*

### 5. Start the React Frontend
Open a third terminal in the root directory:
```bash
cd frontend
npm install
npm run dev
```

### 6. Usage
Visit `http://localhost:5173` in your browser. 
- You can chat immediately as a Guest (limited to 3 responses).
- Create an account to bypass the limit.
- Toggle "RAG Mode" in the chat header to leverage the Knowledge Base.
- Use the "Knowledge Base" button in the navigation bar to upload your own PDFs to Pinecone.
