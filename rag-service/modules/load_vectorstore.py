import os
import time
import logging
from pathlib import Path
from dotenv import load_dotenv
from tqdm.auto import tqdm

load_dotenv()
logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)

# Config from env
PINECONE_API_KEY = os.getenv("PINECONE_API_KEY")
PINECONE_ENV = os.getenv("PINECONE_ENV", "us-east-1")
PINECONE_INDEX_NAME = os.getenv("PINECONE_INDEX_NAME", "yogaindex2")

UPLOAD_DIR = Path("./uploaded_docs")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

# --- imports with helpful errors ---
try:
    from langchain_community.document_loaders import PyPDFLoader
except Exception:
    logger.exception("Install langchain-community")
    raise

try:
    from langchain_text_splitters import RecursiveCharacterTextSplitter
except Exception:
    logger.exception("Install langchain-text-splitters")
    raise

try:
    from pinecone import Pinecone, ServerlessSpec
except Exception:
    logger.exception("Install pinecone-client")
    raise

# ✅ LAZY LOADING - Embeddings created ONLY when needed (not on startup)
def get_google_embeddings():
    """Load embeddings model only when first called (avoids startup hang)"""
    try:
        from langchain_google_genai import GoogleGenerativeAIEmbeddings
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            raise ValueError("GEMINI_API_KEY is not set in the environment")
        return GoogleGenerativeAIEmbeddings(
            model="models/embedding-001",
            google_api_key=api_key
        )
    except Exception as e:
        logger.exception(f"Failed to load Google embeddings: {e}")
        raise

# --- initialize pinecone index ---
def init_pinecone(api_key: str, environment: str, index_name: str, dimension: int = 768):
    if not api_key:
        raise RuntimeError("PINECONE_API_KEY is not set")
    
    pc = Pinecone(api_key=api_key)
    
    if index_name not in pc.list_indexes().names():
        logger.info(f"Creating index {index_name}...")
        pc.create_index(
            name=index_name,
            dimension=dimension,
            metric="cosine",
            spec=ServerlessSpec(cloud="aws", region=environment),
        )
        while index_name not in pc.list_indexes().names():
            time.sleep(1)
    
    return pc.Index(index_name)

# --- main function to load files and upsert vectors ---
def load_vectorstore(uploaded_files):
    index = init_pinecone(
        api_key=PINECONE_API_KEY,
        environment=PINECONE_ENV,
        index_name=PINECONE_INDEX_NAME,
        dimension=768
    )

    # ✅ LAZY LOAD embeddings here (AFTER startup)
    embed_model = get_google_embeddings()
    file_paths = []

    for file in uploaded_files:
        save_path = UPLOAD_DIR / file.filename
        logger.info(f"Saving uploaded file to {save_path}")
        with open(save_path, "wb") as f:
            f.write(file.file.read())
        file_paths.append(save_path)

    for file_path in file_paths:
        logger.info(f"Loading PDF: {file_path}")
        loader = PyPDFLoader(str(file_path))
        documents = loader.load()

        splitter = RecursiveCharacterTextSplitter(chunk_size=500, chunk_overlap=50)
        chunks = splitter.split_documents(documents)

        texts = [chunk.page_content for chunk in chunks]
        metadatas = []
        for i, chunk in enumerate(chunks):
            md = dict(chunk.metadata) if hasattr(chunk, "metadata") else {}
            md.update({"source": str(file_path), "chunk": i, "text": chunk.page_content})
            metadatas.append(md)

        ids = [f"{Path(file_path).stem}-{i}" for i in range(len(chunks))]

        logger.info(f"🔍 Embedding {len(texts)} chunks from {file_path}...")
        embeddings = embed_model.embed_documents(texts)

        if len(embeddings) != len(ids):
            logger.warning("Embeddings count mismatch, trimming...")
        n = min(len(ids), len(embeddings), len(metadatas))

        vectors = [(ids[i], embeddings[i], metadatas[i]) for i in range(n)]

        logger.info("📤 Uploading to Pinecone...")
        batch_size = 100
        with tqdm(total=len(vectors), desc="Upserting") as progress:
            for i in range(0, len(vectors), batch_size):
                batch = vectors[i : i + batch_size]
                index.upsert(vectors=batch)
                progress.update(len(batch))

        logger.info(f"✅ Upload complete for {file_path}")

    logger.info("All uploads complete.")
