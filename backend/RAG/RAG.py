import os
import shutil
import argparse
import requests
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain.schema.document import Document
from supabase import create_client, Client
from dotenv import load_dotenv
import time
import cohere

load_dotenv()

# Supabase config
SUPABASE_URL = os.environ.get('SUPABASE_URL')
SUPABASE_KEY = os.environ.get('SUPABASE_SERVICE_KEY', os.environ.get('SUPABASE_ANON_KEY'))
DATA_PATH = 'Shirly8/ShirleyHuang-Data'  # GitHub repo
db = None

# Initialize Cohere client for embeddings (FREE: 100 calls/min, 384 dims - same as old model!)
cohere_client = cohere.Client(os.environ.get('COHERE_API_KEY'))


# Function processes all documents from GitHub RAG folder only
def load_documents():
    """Load markdown and text files from GitHub repo RAG folder"""
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
        # Only process files in the RAG/ folder
        if item['type'] == 'blob' and item['path'].startswith('RAG/') and (item['path'].endswith('.md') or item['path'].endswith('.txt')):
            # Fetch content
            content_url = f"https://raw.githubusercontent.com/{DATA_PATH}/main/{item['path']}"
            content_response = requests.get(content_url, headers=headers)
            
            # Create Document object (same as langchain PDFLoader output)
            doc = Document(
                page_content=content_response.text,
                metadata={
                    'source': item['path'],
                    'page': 0  # GitHub files don't have pages, set to 0
                }
            )
            documents.append(doc)
            print(f"✓ Loaded: {item['path']}")
    
    return documents


#Split text into chunks of 800 texts
def split_documents(documents: list[Document]):
    chunk_size = 800
    chunk_overlap = int(chunk_size * 0.1) #10% overlap

    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size = chunk_size,
        chunk_overlap = chunk_overlap,
        length_function = len,
        is_separator_regex= False,
    )
    return text_splitter.split_documents(documents)


#Create page IDs (Files/Aretti.pdf: page number, chunk number)
def createIds(chunks):
    last_page_id = None
    index = 0

    for chunk in chunks:
        source = chunk.metadata.get("source")
        page = chunk.metadata.get("page")
        page_id = f"{source}:{page}"

        #Incremenet ID of the chunk if pageID on lastpage
        if page_id == last_page_id:
            index +=1
        else:
            index = 0
        
        #Assign the chunkID
        id = f"{page_id}:{index}"
        last_page_id = page_id

        #Add it as meta-data
        chunk.metadata["id"] = id

    return chunks


#Initialize Cohere embeddings (FREE & ultra-lightweight, no local model!)
def get_embedding():
    """Wrapper to match original interface - returns function that generates embeddings"""
    def embed_text(text):
        # Cohere embed-english-light-v3.0: 384 dimensions (same as old all-MiniLM-L6-v2!)
        response = cohere_client.embed(
            texts=[text],
            model="embed-english-light-v3.0",
            input_type="search_document"
        )
        return response.embeddings[0]
    return embed_text


#Initialize Supabase (replaces ChromaDB)
def initialize_chroma():
    global db

    if db is None:
        db = create_client(SUPABASE_URL, SUPABASE_KEY)
    return db


#Manage vector database with Supabase storing embeddings (replaces ChromaDB)
def add_to_chroma(chunks: list[Document]):

    db = initialize_chroma()
    embed_function = get_embedding()

    #Assign page IDs
    id_chunks = createIds(chunks)

    #Adding documents - check existing
    existing_items = db.table('documents').select('metadata').execute()
    existing_ids = set()
    if existing_items.data:
        for item in existing_items.data:
            if item['metadata'] and 'id' in item['metadata']:
                existing_ids.add(item['metadata']['id'])
    
    print(f"Number of documents in the database: {len(existing_ids)}")

    #Creating chunks (That aren't in the DB)
    new_chunks = []
    for chunk in id_chunks:
        if chunk.metadata["id"] not in existing_ids:
            new_chunks.append(chunk)

    if new_chunks:
        print(f"New Documents: {len(new_chunks)}")
        
        for chunk in new_chunks:
            try:
                # Generate embedding
                embedding = embed_function(chunk.page_content)
                
                # Insert into Supabase
                db.table('documents').insert({
                    'content': chunk.page_content,
                    'metadata': chunk.metadata,
                    'embedding': embedding
                }).execute()
                
                print(f"  ✓ Added: {chunk.metadata['id']}")
                
                # Rate limiting - Gemini free tier: 15 req/min
                time.sleep(4)
                
            except Exception as e:
                print(f"  ✗ Error: {chunk.metadata['id']}: {e}")
    else:
        print("No new documents to add")


def clear():
    """Clear Supabase table (replaces ChromaDB delete)"""
    db = initialize_chroma()
    try:
        db.table('documents').delete().neq('id', 0).execute()
        print("✨ Database cleared")
    except Exception as e:
        print(f"Error clearing: {e}")


def main():

    #Parse command-line
    parser = argparse.ArgumentParser()
    parser.add_argument("--reset", action="store_true", help="Reset the database.")
    args = parser.parse_args()

    # Check if the database should be cleared (using the --reset flag)
    if args.reset:
        print("✨ Clearing Database")
        clear()

    # Load documents, split into chunks, and add them to Chroma
    documents = load_documents()
    chunks = split_documents(documents)
    add_to_chroma(chunks)


if __name__ == "__main__":
    main()
