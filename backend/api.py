from flask import Flask, request, jsonify
from flask_cors import CORS
import os
from dotenv import load_dotenv
import google.generativeai as genai
import json
from datetime import datetime

# Load environment variables from .env file (for local development)
load_dotenv()

app = Flask(__name__)

# CORS configuration for production and development
allowed_origins = [
    "http://localhost:3000",  # Local development
    "http://localhost:5173",  # Vite dev server
    "https://wisest.vercel.app",  # Your Vercel frontend
    "https://wisest-git-main-yourusername.vercel.app",  # Vercel preview
    "https://wisests.shirleyproject.com",  # Your custom domain
    "https://shirleyproject.com",  # ShirleyProject domain
    "https://www.shirleyproject.com",  # ShirleyProject www
    "https://shirleyproject.vercel.app",  # ShirleyProject Vercel
    "https://affirmly-iota.vercel.app"  # Affirmly Vercel frontend
]

CORS(app, resources={r"/*": {"origins": allowed_origins}})

# Secure API key configuration for deployment
API_KEY = os.environ.get('GEMINI_API_KEY')
PROJECT_NUMBER = os.environ.get('GEMINI_PROJECT_NUMBER')

if not API_KEY:
    raise ValueError("GEMINI_API_KEY environment variable is required")

genai.configure(api_key=API_KEY)
model = genai.GenerativeModel('gemini-2.5-flash')

# Simple in-memory storage for decisions (in production, use a database)
decisions = {}

@app.route('/test', methods=['GET'])
def test():
    return jsonify({'message': 'API is working!', 'project_number': PROJECT_NUMBER})

@app.route('/save-decision', methods=['POST'])
def save_decision():
    try:
        data = request.get_json()
        decision_data = json.loads(data.get('body', '{}'))
        
        # Generate a simple ID (in production, use UUID)
        decision_id = str(len(decisions) + 1)
        
        # Store the decision with timestamp
        decisions[decision_id] = {
            'id': decision_id,
            'data': decision_data,
            'timestamp': datetime.now().isoformat()
        }
        
        return jsonify({'message': 'Decision saved successfully', 'id': decision_id})
    except Exception as e:
        print("Error saving decision:", str(e))
        return jsonify({'error': 'Failed to save decision'}), 500

@app.route('/delete-decision/<decision_id>', methods=['DELETE'])
def delete_decision(decision_id):
    try:
        if decision_id in decisions:
            del decisions[decision_id]
            return jsonify({'message': 'Decision deleted successfully'})
        else:
            return jsonify({'error': 'Decision not found'}), 404
    except Exception as e:
        print("Error deleting decision:", str(e))
        return jsonify({'error': 'Failed to delete decision'}), 500

@app.route('/wisest', methods=['POST'])
def wisestfeedback():
    data = request.get_json()
    print("Received data:", data) 
    options = data.get("options", [])
    categories = data.get("categories", [])
    scores = data.get("scores", [])
    best_decision = data.get("best_decision", "")
    main_consideration = data.get("main_Consideration", "")
    choice_consideration = data.get("choice_Considerations", [])

    # Format scores for analysis
    score_analysis = ""
    for score_data in scores:
        score_analysis += f"{score_data['option']}: {score_data['score']:.1f}, "
    score_analysis = score_analysis.rstrip(", ")

    prompt = f'''
You are a supportive life coach helping someone make a decision. Be warm, direct, and encouraging.

**THE DECISION:**
Options: {', '.join(options)}
Goal: {main_consideration}
Their thoughts: {choice_consideration}

**DATA SAYS:** {best_decision} scored highest ({score_analysis})

**YOUR RESPONSE (keep it SHORT - under 250 words):**

**My Take:** [1-2 sentences on whether you agree with {best_decision} or recommend something different]

**Why {best_decision} works:** [2-3 bullet points, max 10 words each]

**Watch out for:** [1 brief sentence on the main risk]

**Your next move:** [1 specific action to take TODAY]

**TONE:** Speak like a trusted friend giving advice over coffee. Be real, not corporate. Use "you" language. End with something encouraging.
'''

    try:
        response = model.generate_content(prompt)
        if response and response.text:
            feedback = response.text
            print("Generated feedback:", feedback) 
            return jsonify({'feedback': feedback})
        else:
            print("Failed to generate feedback") 
            return jsonify({'error': 'Failed to generate feedback'}), 500
    except Exception as e:
        print("Error:", str(e))
        return jsonify({'error': str(e)}), 500

# Affirmly - Generate affirmations endpoint
@app.route('/affirmations', methods=['POST'])
def generate_affirmations():
    """
    Generate personalized affirmations based on journal entry
    """
    try:
        data = request.get_json()
        title = data.get('title', '')
        description = data.get('description', '')
        mood = data.get('mood', 'neutral')

        if not title or not description:
            return jsonify({'error': 'Title and description are required'}), 400

        prompt = f'''
You are an affirmation generator. Generate a list of 10 affirmations based on the following journal entry.

Title: "{title}"
Description: "{description}"
Mood: {mood}

Based on the title and description, generate realistic but meaningful affirmations, encouraging yet realistic quotes or advice to uplift, motivate or help the individual who wrote this.
Each response MUST be 1-3 sentences.
These quotes or affirmations should be unique to the title and description and address the specific feelings and situation mentioned.

Now generate 10 unique affirmations, quotes, or advice in a list like this:
1. [affirmation]
2. [affirmation]
...
10. [affirmation]

Do not generate anything else. Just the list of 10 affirmations in this exact format.
'''

        response = model.generate_content(prompt)

        if not response or not response.text:
            return jsonify({'error': 'Failed to generate affirmations'}), 500

        # Parse the response into a list of affirmations
        affirmations_text = response.text.strip()
        affirmations = []

        for line in affirmations_text.split('\n'):
            line = line.strip()
            if line and not line[0].isdigit():  # Skip numbered lines, get actual content
                affirmations.append(line)
            elif line and line[0].isdigit():
                # Extract affirmation after number
                parts = line.split('.', 1)
                if len(parts) > 1:
                    affirmation = parts[1].strip()
                    if affirmation:
                        affirmations.append(affirmation)

        # Ensure we have 10 affirmations
        if len(affirmations) > 10:
            affirmations = affirmations[:10]
        elif len(affirmations) < 10:
            # If parsing didn't work perfectly, return raw lines
            affirmations = [line.strip() for line in affirmations_text.split('\n') if line.strip()][:10]

        return jsonify(affirmations), 200

    except Exception as e:
        print(f"Error generating affirmations: {str(e)}")
        return jsonify({'error': f'Failed to generate affirmations: {str(e)}'}), 500

# RAG Chat endpoint for ShirleyProject
@app.route('/chat', methods=['POST'])
def chat():
    try:
        from RAG import query_rag
        
        data = request.get_json()
        message = data.get('message', '')
        
        if not message:
            return jsonify({'error': 'Message is required'}), 400
        
        print(f"[CHAT] Received query: {message}")
        
        # Query the RAG system (using your original query_rag function)
        response = query_rag(message)
        
        print(f"[CHAT] Response generated successfully")
        return jsonify({'answer': response})
    except Exception as e:
        import traceback
        print("=" * 60)
        print("ERROR in chat endpoint:")
        print(f"Error type: {type(e).__name__}")
        print(f"Error message: {str(e)}")
        print("Traceback:")
        traceback.print_exc()
        print("=" * 60)
        return jsonify({
            'answer': "I'm having trouble accessing my knowledge base right now. Please try again later!"
        }), 500

# Health check endpoint for deployment platforms
@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({'status': 'healthy', 'message': 'Backend is running!'})

# Warmup endpoint to prevent cold starts on Supabase
@app.route('/warmup', methods=['GET'])
def warmup():
    """
    Lightweight endpoint to keep the RAG system warm.
    Initializes the Supabase connection without making expensive API calls.
    Call this every 5-10 minutes via UptimeRobot to prevent cold starts.
    """
    try:
        from RAG.RAG import initialize_chroma
        import time

        start_time = time.time()

        # Initialize Supabase connection (this is what takes time on cold start)
        db = initialize_chroma()

        # Quick validation that the connection works
        db.table('documents').select('id').limit(1).execute()

        elapsed_ms = int((time.time() - start_time) * 1000)

        return jsonify({
            'status': 'warm',
            'message': 'RAG system initialized successfully',
            'response_time_ms': elapsed_ms,
            'timestamp': datetime.now().isoformat()
        })
    except Exception as e:
        import traceback
        print("=" * 60)
        print("ERROR in warmup endpoint:")
        print(f"Error type: {type(e).__name__}")
        print(f"Error message: {str(e)}")
        print("Traceback:")
        traceback.print_exc()
        print("=" * 60)
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

if __name__ == '__main__':
    print(f"Starting Flask app with project number: {PROJECT_NUMBER}")
    # Get port from environment variable (for Render/Vercel) or default to 5000
    port = int(os.environ.get('PORT', 5000))
    app.run(debug=False, host='0.0.0.0', port=port) 