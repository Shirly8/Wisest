#!/usr/bin/env python3
"""
Generate embeddings for all documents in Supabase using Cohere
"""
import os
from dotenv import load_dotenv
from supabase import create_client
import cohere
import time

load_dotenv()

SUPABASE_URL = os.environ.get('SUPABASE_URL')
SUPABASE_KEY = os.environ.get('SUPABASE_SERVICE_KEY')
COHERE_API_KEY = os.environ.get('COHERE_API_KEY')

def generate_embeddings():
    print("=" * 60)
    print("🔄 Generating Embeddings for RAG Documents")
    print("=" * 60)

    # Initialize clients
    db = create_client(SUPABASE_URL, SUPABASE_KEY)
    cohere_client = cohere.Client(COHERE_API_KEY)

    # Fetch all documents without embeddings
    print("\n📥 Fetching documents from Supabase...")
    try:
        response = db.table('documents').select('*').execute()
        documents = response.data
        print(f"📊 Found {len(documents)} documents")
    except Exception as e:
        print(f"❌ Error fetching documents: {e}")
        return

    if not documents:
        print("✅ No documents to process")
        return

    # Generate embeddings
    print(f"\n🔨 Generating embeddings using Cohere...")
    updated_count = 0
    error_count = 0

    for i, doc in enumerate(documents):
        try:
            # Generate embedding
            response = cohere_client.embed(
                texts=[doc['content']],
                model="embed-english-light-v3.0",
                input_type="search_document"
            )
            embedding = response.embeddings[0]

            # Update document with embedding
            db.table('documents').update({
                'embedding': embedding
            }).eq('id', doc['id']).execute()

            updated_count += 1

            # Progress indicator
            if (i + 1) % 10 == 0:
                print(f"  ✓ Processed {i + 1}/{len(documents)} documents")

            # Rate limiting for Cohere free tier (100 calls/min = 1 per 0.6 seconds)
            time.sleep(0.7)

        except Exception as e:
            error_count += 1
            print(f"  ✗ Error processing document {doc['id']}: {e}")

    print("\n" + "=" * 60)
    print(f"✅ Successfully generated {updated_count} embeddings!")
    print(f"⚠️  Errors: {error_count}")
    print("=" * 60)

if __name__ == "__main__":
    generate_embeddings()
