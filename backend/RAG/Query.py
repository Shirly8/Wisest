import argparse
import os
from dotenv import load_dotenv
import requests
import json

load_dotenv()

#To run: python3 -m RAG.Query --query "What projects has Shirley worked on?"

# API keys from environment
COHERE_API_KEY = os.environ.get('COHERE_API_KEY')
GROQ_API_KEY = os.environ.get('GROQ_API_KEY')

def query_rag(query_text):
    import time
    start_time = time.time()

    # Supabase setup for logging
    SUPABASE_URL = os.environ.get('SUPABASE_URL')
    SUPABASE_SERVICE_KEY = os.environ.get('SUPABASE_SERVICE_KEY')
    
    #Generate query embedding using Cohere (384 dims for embed-english-light-v3.0)
    print(f"[RAG] Generating embedding for query: {query_text[:50]}...")
    try:
        cohere_response = requests.post(
            "https://api.cohere.ai/v1/embed",
            headers={"Authorization": f"Bearer {COHERE_API_KEY}", "Content-Type": "application/json"},
            json={
                "texts": [query_text],
                "model": "embed-english-light-v3.0",
                "input_type": "search_query"
            },
            timeout=10
        )
        cohere_response.raise_for_status()
        query_embedding = cohere_response.json()["embeddings"][0]
        print(f"[RAG] Embedding generated: {len(query_embedding)} dims")
    except Exception as e:
        print(f"[RAG] COHERE ERROR: {type(e).__name__}: {str(e)}")
        return "I'm having trouble generating an embedding for your question right now."

    # Search database using HTTP call instead of RPC wrapper
    rpc_url = f"{os.environ.get('SUPABASE_URL')}/rest/v1/rpc/match_documents"
    headers = {
        "apikey": os.environ.get('SUPABASE_SERVICE_KEY'),
        "Authorization": f"Bearer {os.environ.get('SUPABASE_SERVICE_KEY')}",
        "Content-Type": "application/json",
    }
    print(f"[RAG] Calling RPC at {rpc_url}")
    try:
        rpc_response = requests.post(
            rpc_url,
            headers=headers,
            json={"query_embedding": query_embedding, "match_count": 5},
            timeout=10
        )
        print(f"[RAG] RPC status: {rpc_response.status_code}")
        print(f"[RAG] RPC response: {rpc_response.text[:500]}")
        results_data = rpc_response.json() if rpc_response.status_code == 200 else []
        print(f"[RAG] Results count: {len(results_data)}")
    except Exception as e:
        print(f"[RAG] RPC ERROR: {type(e).__name__}: {str(e)}")
        results_data = []

    if not results_data:
        print(f"[RAG] No results found for query: {query_text}")

        # Log queries with no results
        try:
            requests.post(
                f"{SUPABASE_URL}/rest/v1/chat_logs",
                headers={
                    "apikey": SUPABASE_SERVICE_KEY,
                    "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
                    "Content-Type": "application/json"
                },
                json={
                    'query': query_text,
                    'response': "No relevant information found",
                    'found_results': False
                }
            )
        except:
            pass

        return "I don't have enough information to answer that question."

    print(f"[RAG] Found {len(results_data)} relevant documents")

    #combine all the chunks and pass it to Groq
    all_context = "\n\n".join([
        f"Source: {doc['metadata']['source']}\n{doc['content']}"
        for doc in results_data
    ])

    #Create a prompt for Groq (natural, concise, adaptive)
    system_prompt = """You are Shirley Huang answering questions about yourself. Keep responses concise (2-3 sentences). When asked about "you" or what makes you unique, focus on YOUR skills and experience as a person, not just describing project features. Be accurate and use the context."""

    # Run the query using the Groq model via API
    try:
        groq_response = requests.post(
            "https://api.groq.com/openai/v1/chat/completions",
            headers={"Authorization": f"Bearer {GROQ_API_KEY}", "Content-Type": "application/json"},
            json={
                "messages": [
                    {"role": "system", "content": system_prompt},
                    # Few-shot examples
                    {"role": "user", "content": f"Context: [React, TypeScript, Python, Flask]\n\nWhat tech do you use?"},
                    {"role": "assistant", "content": "I work with React and TypeScript on frontend, Python and Flask on backend."},
                    {"role": "user", "content": f"Context: [BERT fine-tuning, 0.98 F1]\n\nDo you have ML experience?"},
                    {"role": "assistant", "content": "Yeah, I fine-tuned BERT models for fraud detection and got a 0.98 F1 score."},
                    {"role": "user", "content": f"Context: [Full-stack dev, UI/UX, scalable systems]\n\nWhat makes you unique?"},
                    {"role": "assistant", "content": "I combine strong full-stack skills with user-centered design thinking. I build products that are both technically solid and genuinely useful."},
                    # Actual query
                    {"role": "user", "content": f"Context: {all_context}\n\n{query_text}"}
                ],
                "model": "llama-3.1-8b-instant",
                "temperature": 0.6
            },
            timeout=30
        )
        groq_response.raise_for_status()
        response_data = groq_response.json()
    except Exception as e:
        print(f"[RAG] GROQ ERROR: {type(e).__name__}: {str(e)}")
        return "I'm having trouble generating a response right now."

    #Extract and print the response text
    if response_data and response_data.get("choices"):
        response_text = response_data["choices"][0]["message"]["content"]
        print("Query Response: ", response_text)

        # Log to Supabase for analytics
        try:
            response_time_ms = int((time.time() - start_time) * 1000)
            requests.post(
                f"{SUPABASE_URL}/rest/v1/chat_logs",
                headers={
                    "apikey": SUPABASE_SERVICE_KEY,
                    "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
                    "Content-Type": "application/json"
                },
                json={
                    'query': query_text,
                    'response': response_text,
                    'response_time_ms': response_time_ms,
                    'found_results': True
                }
            )
        except Exception as e:
            print(f"[WARN] Failed to log query: {e}")
        
        return response_text
    else:
        # Log failed queries too
        try:
            requests.post(
                f"{SUPABASE_URL}/rest/v1/chat_logs",
                headers={
                    "apikey": SUPABASE_SERVICE_KEY,
                    "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
                    "Content-Type": "application/json"
                },
                json={
                    'query': query_text,
                    'response': "Error: Could not generate response",
                    'found_results': False
                }
            )
        except:
            pass
        return "Sorry, I couldn't generate a response."


def main():
    parser = argparse.ArgumentParser(description="Process query with RAG")
    parser.add_argument("--query", type=str, required=True, help="The query text")
    args = parser.parse_args()
    query_rag(args.query)

if __name__ == "__main__":
    main()
