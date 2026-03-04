#!/usr/bin/env python3
"""
Minimal RAG update script (no Groq/Cohere import)
Only imports what's needed to clear and reload RAG documents
"""
import os
from dotenv import load_dotenv
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain.schema.document import Document
from supabase import create_client, Client
import requests
import time

load_dotenv()

# Supabase config
SUPABASE_URL = os.environ.get('SUPABASE_URL')
SUPABASE_KEY = os.environ.get('SUPABASE_SERVICE_KEY', os.environ.get('SUPABASE_ANON_KEY'))
DATA_PATH = 'Shirly8/ShirleyHuang-Data'

def initialize_supabase():
    """Initialize Supabase client"""
    return create_client(SUPABASE_URL, SUPABASE_KEY)

def clear_database(db):
    """Clear all documents from Supabase"""
    try:
        print("🗑️  Clearing old RAG database...")
        db.table('documents').delete().neq('id', 0).execute()
        print("✅ Database cleared successfully!")
        return True
    except Exception as e:
        print(f"❌ Error clearing database: {e}")
        return False

def load_documents():
    """Load markdown and text files from GitHub repo RAG folder"""
    print("📥 Loading documents from GitHub...")
    api_url = f"https://api.github.com/repos/{DATA_PATH}/git/trees/main?recursive=1"

    headers = {}
    github_token = os.environ.get('GITHUB_TOKEN')
    if github_token:
        headers['Authorization'] = f'token {github_token}'

    try:
        response = requests.get(api_url, headers=headers)
        response.raise_for_status()
    except Exception as e:
        print(f"❌ Error fetching from GitHub: {e}")
        return []

    tree = response.json()
    documents = []

    for item in tree.get('tree', []):
        # Only process files in the RAG/ folder
        if item['type'] == 'blob' and item['path'].startswith('RAG/') and (item['path'].endswith('.md') or item['path'].endswith('.txt')):
            try:
                # Fetch content
                content_url = f"https://raw.githubusercontent.com/{DATA_PATH}/main/{item['path']}"
                content_response = requests.get(content_url, headers=headers)

                # Create Document object
                doc = Document(
                    page_content=content_response.text,
                    metadata={
                        'source': item['path'],
                        'page': 0
                    }
                )
                documents.append(doc)
                print(f"  ✓ Loaded: {item['path']}")
            except Exception as e:
                print(f"  ✗ Error loading {item['path']}: {e}")

    print(f"📊 Total documents loaded: {len(documents)}")
    return documents

def split_documents(documents):
    """Split text into chunks"""
    print("📑 Splitting documents into chunks...")
    chunk_size = 800
    chunk_overlap = int(chunk_size * 0.1)  # 10% overlap

    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=chunk_size,
        chunk_overlap=chunk_overlap,
        length_function=len,
        is_separator_regex=False,
    )
    chunks = text_splitter.split_documents(documents)
    print(f"📊 Total chunks created: {len(chunks)}")
    return chunks

def create_ids(chunks):
    """Create page IDs for chunks"""
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

        id = f"{page_id}:{index}"
        last_page_id = page_id
        chunk.metadata["id"] = id

    return chunks

def add_to_supabase_simple(db, chunks):
    """Add chunks to Supabase WITHOUT using Cohere (uses simpler method)"""
    print(f"💾 Adding {len(chunks)} chunks to Supabase...")

    id_chunks = create_ids(chunks)

    # Check existing items
    try:
        existing_items = db.table('documents').select('metadata').execute()
        existing_ids = set()
        if existing_items.data:
            for item in existing_items.data:
                if item['metadata'] and 'id' in item['metadata']:
                    existing_ids.add(item['metadata']['id'])
        print(f"📊 Existing documents in database: {len(existing_ids)}")
    except Exception as e:
        print(f"⚠️  Could not check existing items: {e}")
        existing_ids = set()

    # Filter new chunks
    new_chunks = [chunk for chunk in id_chunks if chunk.metadata["id"] not in existing_ids]

    if not new_chunks:
        print("✅ No new documents to add")
        return

    print(f"➕ Adding {len(new_chunks)} new documents...")

    added_count = 0
    for i, chunk in enumerate(new_chunks):
        try:
            # Insert into Supabase (without embedding for now)
            db.table('documents').insert({
                'content': chunk.page_content,
                'metadata': chunk.metadata,
                'embedding': None  # We'll generate embeddings via the API endpoint
            }).execute()

            added_count += 1
            if (i + 1) % 5 == 0:
                print(f"  ✓ Added {i + 1}/{len(new_chunks)} documents")

        except Exception as e:
            print(f"  ✗ Error adding {chunk.metadata['id']}: {e}")

    print(f"✅ Successfully added {added_count} documents to Supabase!")

def main():
    print("=" * 60)
    print("🔄 RAG Database Update Script")
    print("=" * 60)

    # Initialize Supabase
    db = initialize_supabase()
    print(f"✅ Connected to Supabase")

    # Clear database
    if not clear_database(db):
        return

    # Load, split, and add documents
    documents = load_documents()
    if not documents:
        print("❌ No documents loaded. Aborting.")
        return

    chunks = split_documents(documents)
    if not chunks:
        print("❌ No chunks created. Aborting.")
        return

    add_to_supabase_simple(db, chunks)

    print("=" * 60)
    print("✨ RAG Database update complete!")
    print("=" * 60)

if __name__ == "__main__":
    main()
