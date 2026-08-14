# 🧘‍♀️ YogaKickFit.AI
> **Award-Winning 2nd Place Hackathon Project**

**YogaKickFit.AI** is a next-generation fitness and wellness companion. It combines a real-time, fully animated 3D AI avatar with computer vision (pose detection) and advanced Retrieval-Augmented Generation (RAG) to create an interactive, living fitness instructor in your browser.

Whether you're looking for guided yoga sessions with real-time posture correction, high-energy kickboxing routines, or just a wellness companion to talk to—this platform delivers it with sub-second latency audio streaming and perfect lip-syncing.

---

## 🌟 Key Features

- **Interactive 3D AI Companion:** A fully rigged, animated 3D avatar (rendered in React Three Fiber) that acts as your personal instructor.
- **Ultra-Fast Voice & Lip Sync:** Uses **Piper TTS** (local binary) with **Edge-TTS** fallback for lightning-fast voice generation, perfectly mapped to the 3D model's mouth movements.
- **Real-Time Pose Detection:** Integrates `@tensorflow-models/pose-detection` via webcam to analyze your body mechanics in real time and ensure your yoga poses are correct.
- **RAG Knowledge Base:** Upload PDF manuals, wellness guides, or fitness books. The AI uses **Pinecone Vector Database** and **Langchain** to fetch exact answers grounded *only* in your uploaded documents.
- **Guest Mode:** Frictionless onboarding allowing new users to immediately interact with the AI for 3 free messages before requiring registration.

---

## 🏗️ Architecture & Tech Stack

This project is structured as a **Microservices Monorepo** ensuring clean separation of concerns and optimized deployments.

### 1. Frontend (Client UI & 3D Rendering)
*Deployed on Vercel*
- **Framework:** React.js (Vite)
- **Styling:** TailwindCSS
- **3D Engine:** Three.js + React Three Fiber / Drei
- **AI Vision:** TensorFlow.js Pose Detection

### 2. Node.js Backend (Core Engine & WebSockets)
*Deployed on Hostinger VPS*
- **Framework:** Express.js
- **Real-Time:** WebSockets (`ws`) for streaming audio chunks and facial expressions
- **Database:** MySQL2 (Auth & Session tracking)
- **AI Logic:** Google Gemini 2.5 Flash API (Dialogue generation)
- **TTS Engine:** Piper TTS pool architecture (Child Processes)

### 3. Python RAG Service (Knowledge Base)
*Deployed on Render*
- **Framework:** FastAPI
- **LLM Pipeline:** LangChain + Groq (Llama 3.1 8B Instant)
- **Vector Database:** Pinecone Serverless
- **Embeddings:** HuggingFace `all-MiniLM-L6-v2` (Running locally on CPU)

---

## 🚀 Getting Started (Local Development)

### Prerequisites
- Node.js (v18+)
- Python (3.10+)
- MySQL Database

### 1. Database Setup
Create a local MySQL database and run the schema:
```bash
mysql -u root -p your_database_name < backend_yoga_ai/schema-mysql.sql
```

### 2. Python RAG Service
```bash
cd rag-service
python -m venv venv
source venv/Scripts/activate  # Or venv/bin/activate on Mac/Linux
pip install -r requirements.txt

# Start the server
uvicorn main:app --reload --port 8000
```

### 3. Node.js Backend
```bash
cd backend
npm install

# Start the WebSockets & API
npm start
```

### 4. React Frontend
```bash
cd frontend
npm install

# Start Vite dev server
npm run dev
```

---

## 🔐 Environment Variables

You will need `.env` files in all three directories. 

**`backend/.env`**
```env
DB_CLIENT=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=your_db_user
DB_PASSWORD=your_db_password
DB_NAME=your_db_name

JWT_SECRET=super_secret_string
GEMINI_API_KEY=your_google_gemini_key
RAG_SERVICE_URL=http://127.0.0.1:8000
```

**`rag-service/.env`**
```env
PINECONE_API_KEY=your_pinecone_key
PINECONE_ENV=us-east-1
PINECONE_INDEX_NAME=yogaindex2
GROQ_API_KEY=your_groq_api_key
```

**`frontend/.env`**
```env
VITE_API_URL=http://localhost:3000
VITE_RAG_API_URL=http://localhost:8000
```

---

## 🎯 How the RAG Pipeline Works
1. User uploads a PDF via the UI.
2. FastAPI processes the PDF using `RecursiveCharacterTextSplitter`.
3. Chunks are embedded using local HuggingFace sentence-transformers (zero API cost).
4. Vectors and the raw text metadata are upserted to Pinecone.
5. When a user asks a question, the backend queries Pinecone, retrieves the top 3 chunks, injects them into the Groq Llama prompt, and streams the answer back out!

---

*Designed and developed as a Final Year Project.*
