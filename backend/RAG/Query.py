import argparse
from groq import Groq
from langchain_ollama import OllamaEmbeddings
from .RAG import initialize_chroma
import os
from dotenv import load_dotenv

load_dotenv()

#To run: python3 -m RAG.Query --query "What projects has Shirley worked on?"

# Initialize Ollama (for query embeddings, matches document embeddings)
ollama_embeddings = OllamaEmbeddings(model="nomic-embed-text")
# Initialize Groq (for answer generation)
groq_client = Groq(api_key=os.environ.get('GROQ_API_KEY'))

def query_rag(query_text):

    #Initialize Database (Supabase replaces ChromaDB)
    db = initialize_chroma()
    
    #Generate query embedding using Ollama (same as documents)
    query_embedding = ollama_embeddings.embed_query(query_text)

    #Search database using Supabase vector similarity (replaces ChromaDB similarity_search)
    results = db.rpc(
        'match_documents',
        {
            'query_embedding': query_embedding,
            'match_count': 5
        }
    ).execute()
    
    if not results.data:
        return "I don't have enough information to answer that question."

    #Initialize Groq to get the answer (replaces Ollama/Gemini)
    
    #combine all the chunks and pass it to Groq (same structure as before)
    all_context = "\n\n".join([
        f"Source: {doc['metadata']['source']}\n{doc['content']}" 
        for doc in results.data
    ])

    #Create a prompt for Groq (updated for Shirley's portfolio)
    system_prompt = "You are an AI assistant helping people learn about Shirley Huang's professional background, projects, and experience. Provide helpful, specific, and friendly answers. Keep responses concise and relevant."
    
    user_prompt = f"Context from Shirley's portfolio:\n{all_context}\n\nQuestion: {query_text}\n\nAnswer:"

    # Run the query using the Groq model (replaces Ollama/Gemini)
    response = groq_client.chat.completions.create(
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ],
        model="llama-3.1-8b-instant",
    )

    #Extract and print the response text (same structure as before)
    if response and response.choices:
        response_text = response.choices[0].message.content
        print("Query Response: ", response_text)
        return response_text
    else:
        return "Sorry, I couldn't generate a response."


def main():
    parser = argparse.ArgumentParser(description="Process query with RAG")
    parser.add_argument("--query", type=str, required=True, help="The query text")
    args = parser.parse_args()
    query_rag(args.query)

if __name__ == "__main__":
    main()
