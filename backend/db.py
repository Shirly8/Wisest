import sqlite3
from flask import jsonify, request
import json

#INitialize SQLITE: 
def initialize():
    conn = sqlite3.connect('decisions.db')
    cursor = conn.cursor()
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS decisions (
            id TEXT PRIMARY KEY,
            data TEXT NOT NULL
        )
    ''')
    conn.commit()
    conn.close()


#SAVING DECISION
def save_decision():
    data = request.get_json()
    try:
        decision_data = json.loads(data['body'])
        print("Received data:", decision_data)  # Debug log
        conn = sqlite3.connect('decisions.db')
        cursor = conn.cursor()
        print("Executing query:", 'INSERT INTO decisions (id, data) VALUES (?, ?)', (str(decision_data['id']), json.dumps(decision_data)))
        cursor.execute('INSERT INTO decisions (id, data) VALUES (?, ?)', (str(decision_data['id']), json.dumps(decision_data)))
        conn.commit()
    finally:
        conn.close()
    return jsonify({'message': 'Decision saved!'})



#POST - DELETING DECISION
def delete_decision(id):
    conn = sqlite3.connect('decisions.db')
    cursor = conn.cursor()
    
    # Check if the decision exists
    cursor.execute('SELECT * FROM decisions WHERE id = ?', (id,))
    decision = cursor.fetchone()
    
    if decision:
        # If the decision exists, delete it
        cursor.execute('DELETE FROM decisions WHERE id = ?', (id,))
        conn.commit()
        message = 'Decision deleted!'
    else:
        # If the decision does not exist, do nothing
        message = 'Decision not found!'
    
    conn.close()
    return jsonify({'message': message})




#GET - RETRIEVING DECISION
def get_decision(decision_id):
    try:
        conn = sqlite3.connect('decisions.db')
        cursor = conn.cursor()
        cursor.execute('SELECT data FROM decisions WHERE id = ?', (decision_id,))
        row = cursor.fetchone()
        if row:
            data = json.loads(row[0])
            print("Fetched data:", data)
            return jsonify(data)
        else:
            return jsonify({'message': 'Decision not found'}), 404
    except Exception as e:
        print("Error fetching decision:", e)
    finally:
        conn.close()