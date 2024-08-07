from flask import Flask, request, jsonify
from flask_cors import CORS
import requests
import os
import google.generativeai as genai
import db
import NLP_utils


app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "http://localhost:3000"}})


API_KEY = 'AIzaSyAgMkx-Wlq6IimwP45s5fxnoyyT-sqEakg'
API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent'

genai.configure(api_key=API_KEY)
model = genai.GenerativeModel('gemini-1.5-flash')

@app.route('/wisest', methods=['POST'])
def wisestfeedback():
    data = request.get_json()
    print("Received data:", data) 
    options = data.get("options", [])
    categories = data.get("categories", [])
    best_decision = data.get("best_decision", "")
    main_consideration = data.get("main_Consideration", "")
    choice_consideration = data.get("choice_Considerations", [])

   # Use the preprocess_text function from spaCY
    processed_text = NLP_utils.preprocess(options, categories, best_decision, main_consideration, choice_consideration)
    
    
    prompt = f'''
    You're trying to decide between these options: {processed_text}.
    Your priorities are: {categories}. You feel strongly about achieving: {main_consideration}.
    Here's what you think about each option: {choice_consideration}.

Imagine you're a good friend helping you make a decision. Consider their goals and how each option aligns with them. 
Considering using your outside knowledge of these decisions and categories to provide additional insights.
Which option do you think would bring you the most joy, satisfaction, fulfillment, or success? 
Explain your reasoning in a way that's easy to understand. 
In the end, provide the WISEST option!
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



#Call MongoDb:
@app.route('/save-decision', methods=['POST'])
def save_decision():
    return db.save_decision()

@app.route('/delete-decision/<string:id>', methods=['DELETE'])
def delete_decision(id):
    return db.delete_decision(id)

@app.route('/get_decision/<string:id>', methods=['GET'])
def get_decision(id):
    return db.get_decision(id)

if __name__ == '__main__':
    db.initialize()
    app.run(debug=True)
