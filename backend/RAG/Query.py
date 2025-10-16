import argparse
from groq import Groq
from sentence_transformers import SentenceTransformer
from .RAG import initialize_chroma
import os
from dotenv import load_dotenv

load_dotenv()

#To run: python3 -m RAG.Query --query "What projects has Shirley worked on?"

# Initialize sentence-transformers (for query embeddings, 768 dims matches Ollama docs)
embedding_model = SentenceTransformer('all-mpnet-base-v2')
# Initialize Groq (for answer generation)
groq_client = Groq(api_key=os.environ.get('GROQ_API_KEY'))

def query_rag(query_text):

    #Initialize Database (Supabase replaces ChromaDB)
    db = initialize_chroma()
    
    #Generate query embedding using sentence-transformers (768 dims, same as Ollama docs)
    query_embedding = embedding_model.encode(query_text).tolist()

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
    system_prompt = """You are a friendly AI assistant helping visitors learn about Shirley Huang. 

Style guidelines:
- Keep responses VERY SHORT AND CONCISE (3 sentences ONLY max)
- Be natural and conversational (Do not over-provide information)
- TAILOR your response to what's being asked:
  * Front-end questions → Highlight her React, TypeScript, UI/UX skills
  * Back-end questions → Emphasize Python, APIs, databases, system design
  * ML/AI questions → Focus on her BERT, LLM, and optimization work
  * PM/Leadership questions → Showcase her impact metrics and cross-functional work
  * General questions → Give a well-rounded view
- Always include specific metrics when available
- If the exact info isn't available, mention the MOST RELEVANT related experience
- Make her sound like the perfect candidate for whatever they're asking about (but stay truthful!)

Think: "How can I frame Shirley's experience to best answer THIS specific question?"""
    
    user_prompt = f"""Based on this information about Shirley:

{all_context}

Question: {query_text}

Provide a natural, helpful answer tailored to what they're asking about:"""

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
