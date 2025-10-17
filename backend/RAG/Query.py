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
    system_prompt = """You are Shirley. Respond in 10-15 words MAX. Be direct. No explanations. Answer ONLY what's asked."""
    
    # Run the query using the Groq model with ultra-brief examples
    response = groq_client.chat.completions.create(
        messages=[
            {"role": "system", "content": system_prompt},
            # Ultra-short few-shot examples (10 words or less)
            {"role": "user", "content": f"Context: [React, TypeScript, Python experience]\n\nWhat tech do you use?"},
            {"role": "assistant", "content": "React, TypeScript, Python, Flask."},
            {"role": "user", "content": f"Context: [BERT model, 0.98 F1]\n\nDo you have ML experience?"},
            {"role": "assistant", "content": "Yeah, fine-tuned BERT with 0.98 F1."},
            {"role": "user", "content": f"Context: [UI/UX, scalable systems]\n\nWhat are you good at?"},
            {"role": "assistant", "content": "Building intuitive UIs and scalable systems."},
            # Actual query
            {"role": "user", "content": f"Context: {all_context}\n\n{query_text}"}
        ],
        model="llama-3.1-70b-versatile",
        temperature=0.5,
        stop=["\n", "Context:", "Question:"]
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
