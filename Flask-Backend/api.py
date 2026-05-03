"""Flask API for CodeMAS Reviewer"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import sys
import os
from datetime import datetime

# Add project to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from src.state import create_initial_state
from src.logger import mas_logger
from src.agents.coordinator import CoordinatorAgent
from src.agents.style_reviewer import StyleReviewerAgent
from src.agents.logic_reviewer import LogicReviewerAgent
from src.agents.security_reviewer import SecurityReviewerAgent
from src.report_generator import ReportGenerator
from src.tools.file_tools import FileSystemTools

app = Flask(__name__)
CORS(app)  # Allow React to connect


def merge_agent_state(state, agent_result):
    """Merge a partial agent result into the global review state."""
    merged = state.copy()

    for key, value in agent_result.items():
        if key in {"findings", "execution_log"}:
            merged[key] = merged.get(key, []) + value
        else:
            merged[key] = value

    return merged


def run_review_pipeline(code, filename):
    """Run the multi-agent review workflow and save the final report."""
    state = create_initial_state(filename, code)

    coordinator = CoordinatorAgent()
    state = merge_agent_state(state, coordinator.process(state))

    plan = state.get('review_plan', {})

    if plan.get('style_review', True):
        style_agent = StyleReviewerAgent()
        state = merge_agent_state(state, style_agent.process(state))

    if plan.get('logic_review', False):
        logic_agent = LogicReviewerAgent()
        state = merge_agent_state(state, logic_agent.process(state))

    if plan.get('security_review', False):
        security_agent = SecurityReviewerAgent()
        state = merge_agent_state(state, security_agent.process(state))

    report = ReportGenerator.generate(state)

    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S_%f")
    output_path = f"reports/report_{mas_logger.session_id}_{timestamp}.json"
    FileSystemTools.save_review_report(report, output_path)

    return state, plan, report, output_path

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
        state, plan, report, output_path = run_review_pipeline(code, filename)
        
        return jsonify({
            "success": True,
            "report": report,
            "plan": plan,
            "session_id": mas_logger.session_id,
            "report_path": output_path,
            "execution_log": state.get("execution_log", [])
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
    
    code = file.read().decode('utf-8-sig')
    filename = file.filename
    
    try:
        state, plan, report, output_path = run_review_pipeline(code, filename)

        return jsonify({
            "success": True,
            "report": report,
            "plan": plan,
            "session_id": mas_logger.session_id,
            "report_path": output_path,
            "execution_log": state.get("execution_log", [])
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    print("=" * 50)
    print("[SERVER] CodeMAS API Server")
    print("=" * 50)
    print("[URL] Running on: http://localhost:5000")
    print("[API] Endpoints: POST /api/review, POST /api/review-file")
    print("=" * 50)
    app.run(debug=True, port=5000)

