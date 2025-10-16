import argparse
from groq import Groq
import cohere
from .RAG import initialize_chroma
import os
from dotenv import load_dotenv

load_dotenv()

#To run: python3 -m RAG.Query --query "What projects has Shirley worked on?"

# Initialize Cohere client for embeddings (FREE: 100 calls/min, no heavy model loading!)
cohere_client = cohere.Client(os.environ.get('COHERE_API_KEY'))
# Initialize Groq (for answer generation)
groq_client = Groq(api_key=os.environ.get('GROQ_API_KEY'))

def query_rag(query_text):

    #Initialize Database (Supabase replaces ChromaDB)
    db = initialize_chroma()
    
    #Generate query embedding using Cohere (384 dims for embed-english-light-v3.0)
    response = cohere_client.embed(
        texts=[query_text],
        model="embed-english-light-v3.0",
        input_type="search_query"
    )
    query_embedding = response.embeddings[0]

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

    #Create a prompt for Groq (natural, concise, adaptive)  
    system_prompt = """You're Shirley Huang (Me). Answer in EXTREMELY 1-2 short sentences max (First person). Be casual, not formal."""
    
    user_prompt = f"""Info: {all_context}

Question: {query_text}

Answer in 1-2 sentences:"""

    # Run the query using the Groq model (replaces Ollama/Gemini)
    response = groq_client.chat.completions.create(
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ],
        model="llama-3.1-8b-instant",
        temperature=0.5,
        max_tokens=50,   # Force shorter responses
        stop=["\n\n", "Q:"]  # Stop at double newline
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
