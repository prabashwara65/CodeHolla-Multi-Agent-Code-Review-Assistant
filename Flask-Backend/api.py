"""Flask API for CodeMAS Reviewer"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import sys
import os
import json
import tempfile
from pathlib import Path

# Add project to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from src.state import create_initial_state
from src.agents.coordinator import CoordinatorAgent
from src.agents.style_reviewer import StyleReviewerAgent
from src.agents.logic_reviewer import LogicReviewerAgent
from src.agents.security_reviewer import SecurityReviewerAgent
from src.report_generator import ReportGenerator

app = Flask(__name__)
CORS(app)  # Allow React to connect

@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({"status": "healthy", "message": "CodeMAS API is running"})

@app.route('/api/review', methods=['POST'])
def review_code():
    """Review code from text input"""
    data = request.json
    code = data.get('code', '')
    filename = data.get('filename', 'input.py')
    
    if not code:
        return jsonify({"error": "No code provided"}), 400
    
    try:
        # Create state
        state = create_initial_state(filename, code)
        
        # Run Coordinator
        coordinator = CoordinatorAgent()
        state = coordinator.process(state)
        
        # Get review plan
        plan = state.get('review_plan', {})
        
        # Run Style Reviewer if enabled
        if plan.get('style_review', True):
            style_agent = StyleReviewerAgent()
            state = style_agent.process(state)
        
        # Run Logic Reviewer if enabled
        if plan.get('logic_review', False):
            logic_agent = LogicReviewerAgent()
            state = logic_agent.process(state)
        
        # Run Security Reviewer if enabled
        if plan.get('security_review', False):
            security_agent = SecurityReviewerAgent()
            state = security_agent.process(state)
        
        # Generate report
        report = ReportGenerator.generate(state)
        
        return jsonify({
            "success": True,
            "report": report,
            "plan": plan,
            "session_id": state.get('session_id', 'unknown')
        })
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/review-file', methods=['POST'])
def review_file():
    """Review code from uploaded file"""
    if 'file' not in request.files:
        return jsonify({"error": "No file uploaded"}), 400
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({"error": "No file selected"}), 400
    
    if not file.filename.endswith('.py'):
        return jsonify({"error": "Only .py files are supported"}), 400
    
    code = file.read().decode('utf-8')
    filename = file.filename
    
    return review_code()

if __name__ == '__main__':
    print("=" * 50)
    print("🚀 CodeMAS API Server")
    print("=" * 50)
    print("📍 Running on: http://localhost:5000")
    print("📝 Endpoints: POST /api/review, POST /api/review-file")
    print("=" * 50)
    app.run(debug=True, port=5000)