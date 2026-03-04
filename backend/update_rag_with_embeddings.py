#!/usr/bin/env python3
"""
Reload RAG documents WITH embeddings using Cohere batch API
"""
import os
import json
import requests
import time
from dotenv import load_dotenv
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain.schema.document import Document

load_dotenv()

SUPABASE_URL = os.environ.get('SUPABASE_URL')
SUPABASE_KEY = os.environ.get('SUPABASE_SERVICE_KEY')
COHERE_API_KEY = os.environ.get('COHERE_API_KEY')
DATA_PATH = 'Shirly8/ShirleyHuang-Data'

def clear_database():
    """Clear all documents"""
    url = f"{SUPABASE_URL}/rest/v1/documents?id=gte.0"
    headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": "application/json",
    }
    response = requests.delete(url, headers=headers)
    print(f"✅ Database cleared")

def load_documents():
    """Load documents from GitHub"""
    api_url = f"https://api.github.com/repos/{DATA_PATH}/git/trees/main?recursive=1"
    headers = {}
    github_token = os.environ.get('GITHUB_TOKEN')
    if github_token:
        headers['Authorization'] = f'token {github_token}'

    response = requests.get(api_url, headers=headers)
    response.raise_for_status()

    tree = response.json()
    documents = []

    for item in tree.get('tree', []):
        if item['type'] == 'blob' and item['path'].startswith('RAG/') and (item['path'].endswith('.md') or item['path'].endswith('.txt')):
            content_url = f"https://raw.githubusercontent.com/{DATA_PATH}/main/{item['path']}"
            content_response = requests.get(content_url, headers=headers)
            doc = Document(
                page_content=content_response.text,
                metadata={'source': item['path'], 'page': 0}
            )
            documents.append(doc)
            print(f"  ✓ Loaded: {item['path']}")

    return documents

def split_documents(documents):
    """Split into chunks"""
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=800,
        chunk_overlap=80,
        length_function=len,
        is_separator_regex=False,
    )
    return splitter.split_documents(documents)

def create_ids(chunks):
    """Create chunk IDs"""
    last_page_id = None
    index = 0

    for chunk in chunks:
        source = chunk.metadata.get("source")
        page = chunk.metadata.get("page")
        page_id = f"{source}:{page}"

        if page_id == last_page_id:
            index += 1
        else:
            index = 0

        chunk.metadata["id"] = f"{page_id}:{index}"
        last_page_id = page_id

    return chunks

def generate_embeddings_batch(texts):
    """Generate embeddings for multiple texts using batch API"""
    url = "https://api.cohere.ai/v1/embed"
    headers = {
        "Authorization": f"Bearer {COHERE_API_KEY}",
        "Content-Type": "application/json",
    }

    # Limit to 10 texts per request (smaller batches to avoid 400 errors)
    batch_size = 10
    all_embeddings = []

    for i in range(0, len(texts), batch_size):
        batch = texts[i:i+batch_size]
        payload = {
            "texts": batch,
            "model": "embed-english-light-v3.0",
            "input_type": "search_document"
        }

        try:
            response = requests.post(url, headers=headers, json=payload, timeout=60)
            if response.status_code == 200:
                data = response.json()
                if "embeddings" in data:
                    all_embeddings.extend(data["embeddings"])
            else:
                print(f"⚠️  API error: {response.status_code}")
                # Return None for failed batch
                all_embeddings.extend([None] * len(batch))
        except Exception as e:
            print(f"⚠️  Error: {e}")
            all_embeddings.extend([None] * len(batch))

        # Rate limiting
        time.sleep(1)

    return all_embeddings

def add_to_supabase(chunks):
    """Add chunks with embeddings to Supabase"""
    print(f"\n💾 Adding {len(chunks)} chunks with embeddings...")

    # Get embeddings for all chunks
    print("🔨 Generating embeddings...")
    texts = [chunk.page_content for chunk in chunks]
    embeddings = generate_embeddings_batch(texts)

    # Add to Supabase
    url = f"{SUPABASE_URL}/rest/v1/documents"
    headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": "application/json",
    }

    added_count = 0
    for i, (chunk, embedding) in enumerate(zip(chunks, embeddings)):
        if embedding is None:
            continue

        payload = {
            "content": chunk.page_content,
            "metadata": chunk.metadata,
            "embedding": embedding
        }

        try:
            response = requests.post(url, headers=headers, json=payload)
            if response.status_code == 201:
                added_count += 1
                if (i + 1) % 20 == 0:
                    print(f"  ✓ Added {i + 1}/{len(chunks)} documents")
        except Exception as e:
            pass

    return added_count

def main():
    print("=" * 60)
    print("🔄 RAG Database Update (With Embeddings)")
    print("=" * 60)
    print()

    print("🗑️  Clearing database...")
    clear_database()

    print("📥 Loading documents from GitHub...")
    documents = load_documents()
    print(f"📊 Total: {len(documents)} documents")

    print("📑 Splitting documents...")
    chunks = split_documents(documents)
    chunks = create_ids(chunks)
    print(f"📊 Created: {len(chunks)} chunks")

    print("\n" + "=" * 60)
    added = add_to_supabase(chunks)
    print(f"\n✅ Successfully added {added} documents with embeddings!")
    print("=" * 60)

if __name__ == "__main__":
    main()
