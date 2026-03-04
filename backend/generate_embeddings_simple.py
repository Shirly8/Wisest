#!/usr/bin/env python3
"""
Generate embeddings using Cohere API via HTTP requests (avoids library import issues)
"""
import os
import json
import requests
import time
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.environ.get('SUPABASE_URL')
SUPABASE_KEY = os.environ.get('SUPABASE_SERVICE_KEY')
COHERE_API_KEY = os.environ.get('COHERE_API_KEY')

def get_documents():
    """Fetch all documents from Supabase"""
    url = f"{SUPABASE_URL}/rest/v1/documents?select=id,content"
    headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": "application/json",
    }
    response = requests.get(url, headers=headers)
    if response.status_code == 200:
        return response.json()
    else:
        print(f"Error fetching documents: {response.text}")
        return []

def generate_embedding(text):
    """Call Cohere API to generate embedding"""
    url = "https://api.cohere.ai/v1/embed"
    headers = {
        "Authorization": f"Bearer {COHERE_API_KEY}",
        "Content-Type": "application/json",
    }
    payload = {
        "texts": [text[:2000]],  # Limit text length
        "model": "embed-english-light-v3.0",
        "input_type": "search_document"
    }

    try:
        response = requests.post(url, headers=headers, json=payload, timeout=30)
        if response.status_code == 200:
            data = response.json()
            if "embeddings" in data and len(data["embeddings"]) > 0:
                return data["embeddings"][0]
        else:
            # Debug: print error response
            pass
    except requests.exceptions.Timeout:
        pass  # Timeout - skip this document
    except Exception as e:
        pass
    return None

def update_document_embedding(doc_id, embedding):
    """Update document with embedding in Supabase"""
    url = f"{SUPABASE_URL}/rest/v1/documents?id=eq.{doc_id}"
    headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": "application/json",
    }
    payload = {"embedding": embedding}

    response = requests.patch(url, headers=headers, json=payload)
    return response.status_code == 200

def main():
    print("=" * 60)
    print("🔄 Generating Embeddings for RAG Documents")
    print("=" * 60)
    print()

    # Fetch documents
    print("📥 Fetching documents from Supabase...")
    documents = get_documents()
    print(f"📊 Found {len(documents)} documents")
    print()

    if not documents:
        print("✅ No documents to process")
        return

    print("🔨 Generating embeddings using Cohere...")
    updated_count = 0
    error_count = 0

    for i, doc in enumerate(documents):
        doc_id = doc["id"]
        content = doc["content"]

        # Generate embedding
        embedding = generate_embedding(content)

        if embedding is None:
            error_count += 1
            print(f"  ✗ Error generating embedding for doc {i + 1}/{len(documents)}")
        else:
            # Update document
            if update_document_embedding(doc_id, embedding):
                updated_count += 1
                if (i + 1) % 10 == 0:
                    print(f"  ✓ Processed {i + 1}/{len(documents)} documents")
            else:
                error_count += 1
                print(f"  ✗ Error updating document {i + 1}/{len(documents)}")

        # Rate limiting for Cohere free tier
        time.sleep(0.7)

    print()
    print("=" * 60)
    print(f"✅ Successfully generated {updated_count} embeddings!")
    print(f"⚠️  Errors: {error_count}")
    print("=" * 60)

if __name__ == "__main__":
    main()
