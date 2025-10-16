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
    "https://shirleyproject.vercel.app"  # ShirleyProject Vercel
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
        score_analysis += f"- {score_data['option']}: {score_data['score']:.2f}\n"
    
    # Determine decision context based on main consideration and options
    decision_context = "practical"  # default
    if any(word in main_consideration.lower() for word in ['business', 'company', 'market', 'strategy', 'investment', 'career']):
        decision_context = "strategic"
    elif any(word in main_consideration.lower() for word in ['happiness', 'fulfillment', 'life', 'relationship', 'personal', 'dream']):
        decision_context = "personal"
    elif any(word in main_consideration.lower() for word in ['convenience', 'time', 'cost', 'daily', 'routine']):
        decision_context = "practical"

    # Adaptive language based on context
    context_language = {
        "strategic": {
            "advantages": "Strategic Advantages",
            "risks": "Risk Mitigation", 
            "action": "Implementation Priority",
            "metric": "Success Metrics"
        },
        "personal": {
            "advantages": "Key Benefits",
            "risks": "Potential Challenges",
            "action": "Next Steps", 
            "metric": "Fulfillment Indicators"
        },
        "practical": {
            "advantages": "Key Advantages",
            "risks": "Things to Watch",
            "action": "Priority Action",
            "metric": "Success Indicators"
        }
    }
    
    lang = context_language[decision_context]
    
    prompt = f'''
You are an intelligent decision advisor with deep knowledge of companies, industries, products, services, and real-world experiences. Provide your independent recommendation for this decision.

**DECISION CONTEXT:**
- Options: {', '.join(options)}
- Main goal: {main_consideration}
- Decision type: {decision_context.title()} decision
- Their thoughts: {choice_consideration}

**MATHEMATICAL ANALYSIS:**
The decision system calculated these scores based on their priorities:
{score_analysis}
- Calculated best option: {best_decision}

**YOUR TASK:**
Make your own independent recommendation. You may agree or disagree with the calculated best option. Use your judgment to determine what's truly best for them.

**RESPONSE FORMAT:**
**Choose [YOUR RECOMMENDED OPTION]**

**Why This Decision**: [Direct reasoning. If it differs from the calculated best option, explain why your judgment overrides the scores]

**{lang['advantages']}**: [2-3 key benefits relevant to this decision type]

**{lang['risks']}**: [How to handle potential downsides or challenges]

**{lang['action']}**: [Specific next step to take]

**{lang['metric']}**: [How to measure if this was the right choice]

**IMPORTANT GUIDELINES:**
- Use {decision_context} language appropriate for this decision type
- Consider the calculated scores as ONE input, but make your own independent judgment
- If you disagree with the calculated best option, clearly explain why your recommendation is better
- Leverage your knowledge about the specific options involved
- Be direct and concise (under 500 words total)
- Provide actionable, practical advice
- Consider both mathematical analysis and real-world factors

Remember: You are the expert advisor - trust your judgment even if it differs from the calculations.
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

# RAG Chat endpoint for ShirleyProject
@app.route('/chat', methods=['POST'])
def chat():
    try:
        from RAG import query_rag
        
        data = request.get_json()
        message = data.get('message', '')
        
        if not message:
            return jsonify({'error': 'Message is required'}), 400
        
        # Query the RAG system (using your original query_rag function)
        response = query_rag(message)
        
        return jsonify({'answer': response})
    except Exception as e:
        print("Error in chat endpoint:", str(e))
        return jsonify({
            'answer': "I'm having trouble accessing my knowledge base right now. Please try again later!"
        }), 500

# Health check endpoint for deployment platforms
@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({'status': 'healthy', 'message': 'Backend is running!'})

if __name__ == '__main__':
    print(f"Starting Flask app with project number: {PROJECT_NUMBER}")
    # Get port from environment variable (for Render/Vercel) or default to 5000
    port = int(os.environ.get('PORT', 5000))
    app.run(debug=False, host='0.0.0.0', port=port) 