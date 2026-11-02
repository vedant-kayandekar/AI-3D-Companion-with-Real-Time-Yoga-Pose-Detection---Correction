"""
Local Knowledge Base Ingestion Script for YogaKickFit AI
========================================================
Extracts text from PDFs and PPTXs in your local directory, chunks them,
generates embeddings using Google Generative AI (text-embedding-004),
and upserts them directly into Pinecone ('yogaindex2') from your local PC.

Bypasses Render free-tier RAM limits and protects Pinecone Free Tier quotas!
"""

import os
import sys
import time
import argparse
from pathlib import Path
from dotenv import load_dotenv
from tqdm.auto import tqdm

# Ensure UTF-8 output on Windows console
if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")

# Load environment
dotenv_path = Path(__file__).resolve().parent / ".env"
load_dotenv(dotenv_path)

PINECONE_API_KEY = os.getenv("PINECONE_API_KEY")
PINECONE_ENV = os.getenv("PINECONE_ENV", "us-east-1")
PINECONE_INDEX_NAME = os.getenv("PINECONE_INDEX_NAME", "yogaindex2")

def extract_pdf_text(file_path):
    try:
        from pypdf import PdfReader
        reader = PdfReader(str(file_path))
        text_chunks = []
        for i, page in enumerate(reader.pages):
            content = page.extract_text()
            if content and content.strip():
                text_chunks.append({"page": i + 1, "text": content.strip()})
        return text_chunks
    except Exception as e:
        print(f"  [!] Error reading PDF {file_path.name}: {e}")
        return []

def extract_pptx_text(file_path):
    try:
        from pptx import Presentation
        prs = Presentation(str(file_path))
        slide_chunks = []
        for i, slide in enumerate(prs.slides):
            slide_text = []
            for shape in slide.shapes:
                if shape.has_text_frame:
                    slide_text.append(shape.text.strip())
            joined = "\n".join([t for t in slide_text if t])
            if joined:
                slide_chunks.append({"page": i + 1, "text": joined})
        return slide_chunks
    except Exception as e:
        print(f"  [!] Error reading PPTX {file_path.name}: {e}")
        return []

def main():
    parser = argparse.ArgumentParser(description="Ingest local PDFs/PPTXs into Pinecone")
    parser.add_argument(
        "--docs-dir",
        default=r"C:\Users\hp\Downloads\Aviyog group-20251125T162057Z-1-001\Aviyog group",
        help="Path to folder containing PDFs & PPTXs"
    )
    parser.add_argument("--gemini-key", default=None, help="Google Gemini API Key for embeddings")
    parser.add_argument("--max-mb", type=float, default=25.0, help="Skip files larger than this to protect quotas (default: 25MB)")
    parser.add_argument("--dry-run", action="store_true", help="Extract and chunk without uploading to Pinecone")
    args = parser.parse_args()

    docs_dir = Path(args.docs_dir)
    if not docs_dir.exists():
        print(f"❌ Directory not found: {docs_dir}")
        sys.exit(1)

    gemini_key = args.gemini_key or os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")

    print("=" * 65)
    print("🌿 YogaKickFit AI — Local Knowledge Base Ingestion Pipeline")
    print("=" * 65)
    print(f"📁 Source directory: {docs_dir}")
    print(f"🌲 Pinecone index : {PINECONE_INDEX_NAME} (AWS: {PINECONE_ENV})")
    print(f"🛡️  Max file size   : {args.max_mb} MB (safeguards Pinecone & Gemini free tiers)")

    # 1. Discover files
    raw_files = list(docs_dir.rglob("*.pdf")) + list(docs_dir.rglob("*.pptx"))
    files = []
    skipped_large = []

    for f in raw_files:
        size_mb = f.stat().st_size / (1024 * 1024)
        if size_mb <= args.max_mb:
            files.append(f)
        else:
            skipped_large.append((f.name, round(size_mb, 1)))

    print(f"📑 Discovered {len(raw_files)} documents total.")
    if skipped_large:
        print(f"⚡ Skipped {len(skipped_large)} oversized file(s) to protect free-tier quotas:")
        for name, sz in skipped_large:
            print(f"   - {name} ({sz} MB)")
    print(f"✨ Ready to process {len(files)} high-yield documents (Yoga Therapy PPTs, Session Guides, Mudras, Anatomy).")

    if len(files) == 0:
        print("No files to process.")
        return

    # 2. Extract & Chunk
    from langchain_text_splitters import RecursiveCharacterTextSplitter
    splitter = RecursiveCharacterTextSplitter(chunk_size=500, chunk_overlap=50)

    all_chunks = []
    print("\n🔍 Extracting and chunking documents...")
    for f in tqdm(files, desc="Parsing documents"):
        if f.suffix.lower() == ".pdf":
            pages = extract_pdf_text(f)
        elif f.suffix.lower() == ".pptx":
            pages = extract_pptx_text(f)
        else:
            continue

        for p in pages:
            sub_chunks = splitter.split_text(p["text"])
            for idx, text in enumerate(sub_chunks):
                clean_id = f"{f.stem[:25]}-p{p['page']}-c{idx}".replace(" ", "_")
                all_chunks.append({
                    "id": clean_id,
                    "text": text,
                    "metadata": {
                        "source": f.name,
                        "page": p["page"],
                        "category": f.parent.name,
                        "text": text
                    }
                })

    print(f"\n✅ Total knowledge chunks prepared: {len(all_chunks)}")
    print(f"📊 Estimated Pinecone storage: ~{round(len(all_chunks) * 0.003, 2)} MB (<3% of Free Tier)")

    if args.dry_run:
        print("\n[DRY RUN] Extraction and chunking complete. No vectors upserted.")
        return

    # 3. Check API Key
    if not gemini_key:
        print("\n⚠️ No GEMINI_API_KEY provided!")
        print("Please run with your fresh Gemini key:")
        print("  python yogakickfit-ai/rag-service/local_ingest_knowledge_base.py --gemini-key YOUR_NEW_KEY")
        return

    # 4. Initialize Pinecone & Embeddings
    from pinecone import Pinecone
    from langchain_google_genai import GoogleGenerativeAIEmbeddings

    print(f"\n🤖 Connecting to Pinecone...")
    try:
        pc = Pinecone(api_key=PINECONE_API_KEY)
        index = pc.Index(PINECONE_INDEX_NAME)
        stats = index.describe_index_stats()
        print(f"📊 Current vectors in Pinecone: {stats.total_vector_count}")
    except Exception as e:
        print(f"❌ Failed to connect to Pinecone: {e}")
        return

    print(f"🧠 Generating embeddings with Google 'models/text-embedding-004'...")
    try:
        embed_model = GoogleGenerativeAIEmbeddings(
            model="models/text-embedding-004",
            google_api_key=gemini_key
        )
        # Test one sample to verify key works before loop
        _ = embed_model.embed_query("Yoga knowledge base check")
        print("✅ Gemini API Key verified active!")
    except Exception as e:
        print(f"\n❌ Gemini API Key Error: {e}")
        print("Your key might be leaked, expired, or invalid.")
        print("Please get a fresh key from: https://aistudio.google.com/")
        print("Then run:")
        print("  python yogakickfit-ai/rag-service/local_ingest_knowledge_base.py --gemini-key YOUR_NEW_KEY")
        return

    # 5. Batch Embed & Upsert
    batch_size = 50
    total = len(all_chunks)
    print(f"\n📤 Embedding and upserting {total} chunks in batches of {batch_size}...")

    success_count = 0
    for i in tqdm(range(0, total, batch_size), desc="Upserting batches"):
        batch = all_chunks[i : i + batch_size]
        texts = [b["text"] for b in batch]
        try:
            embeddings = embed_model.embed_documents(texts)
            vectors = [
                (batch[j]["id"], embeddings[j], batch[j]["metadata"])
                for j in range(len(batch))
            ]
            index.upsert(vectors=vectors)
            success_count += len(vectors)
            time.sleep(0.3)  # Gentle delay to respect Gemini 15 RPM quota
        except Exception as e:
            print(f"\n[!] Error in batch {i}-{i+batch_size}: {e}")
            break

    print("\n" + "=" * 65)
    print(f"🎉 INGESTION COMPLETE! {success_count}/{total} chunks live in Pinecone index '{PINECONE_INDEX_NAME}'!")
    print("=" * 65)

if __name__ == "__main__":
    main()
