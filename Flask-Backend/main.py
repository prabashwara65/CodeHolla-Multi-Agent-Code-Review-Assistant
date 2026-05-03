"""Complete Multi-Agent Code Review Assistant"""

import sys
import time
from datetime import datetime
from src.state import create_initial_state
from src.logger import mas_logger
from src.tools.file_tools import FileSystemTools
from src.agents.coordinator import CoordinatorAgent
from src.agents.style_reviewer import StyleReviewerAgent
from src.agents.logic_reviewer import LogicReviewerAgent
from src.agents.security_reviewer import SecurityReviewerAgent
from src.report_generator import ReportGenerator

def main():
    total_start = time.time()
    
    print("=" * 70)
    print(" MULTI-AGENT CODE REVIEW ASSISTANT")
    print(" Coordinator-Worker-Delegator Architecture")
    print("=" * 70)
    
    if len(sys.argv) < 2:
        print("\nUsage: python main.py <python_file_path>")
        print("Example: python main.py sample_code/test.py")
        sys.exit(1)
    
    filename = sys.argv[1]
    print(f"\n[FILE] Input file: {filename}")
    
    # Step 1: Read file
    print("\n[STEP 1] Reading source code...")
    file_tools = FileSystemTools()
    file_info = file_tools.read_python_file(filename)
    
    if "error" in file_info:
        print(f"[ERROR] Error: {file_info['error']}")
        sys.exit(1)
    
    print(f"   [OK] Lines: {file_info['line_count']}")
    print(f"   [OK] Size: {len(file_info['content'])} chars")
    
    # Step 2: Create state
    state = create_initial_state(filename, file_info['content'])
    print(f"\n[STEP 2] Session ID: {mas_logger.session_id}")
    
    # Step 3: Coordinator
    print("\n[STEP 3] Running Coordinator Agent...")
    coordinator = CoordinatorAgent()
    state = coordinator.process(state)
    
    # Step 4: Style Reviewer
    print("\n[STEP 4] Running Style Reviewer Agent...")
    style_agent = StyleReviewerAgent()
    state = style_agent.process(state)
    
    # Step 5: Logic Reviewer
    print("\n[STEP 5] Running Logic Reviewer Agent...")
    logic_agent = LogicReviewerAgent()
    state = logic_agent.process(state)
    
    # Step 6: Security Reviewer
    print("\n[STEP 6] Running Security Reviewer Agent...")
    security_agent = SecurityReviewerAgent()
    state = security_agent.process(state)
    
    # Step 7: Generate Report
    print("\n[STEP 7] Generating Final Report...")
    report = ReportGenerator.generate(state)
    
    # Step 8: Save Report
    output_path = f"reports/report_{mas_logger.session_id}.json"
    file_tools.save_review_report(report, output_path)
    
    # Step 9: Display Summary
    total_time = time.time() - total_start
    
    print("\n" + "=" * 70)
    print(" REVIEW SUMMARY")
    print("=" * 70)
    print(f"\n[FILE] File: {report['filename']}")
    print(f"[DATA] Status: {report['overall_status']}")
    print(f"\n[SCORES] Scores:")
    print(f"   Style:  {report['summary']['style_score']}/100")
    print(f"   Logic:  {report['summary']['logic_score']}/100")
    print(f"   Security Risk: {report['summary']['security_risk']}")
    print(f"\n[SCAN] Total Findings: {report['summary']['total_findings']}")
    print(f"[WARN]  High Severity: {report['summary']['high_severity_count']}")
    
    if report['recommendations']:
        print(f"\n[TIP] Recommendations:")
        for rec in report['recommendations']:
            print(f"   - {rec}")
    
    print(f"\n[FILE] Report saved: {output_path}")
    print(f"[FILE] Logs saved: logs/")
    print(f"\n[TIME]  Total time: {total_time:.1f} seconds")
    print("\n" + "=" * 70)
    print(" REVIEW COMPLETED")
    print("=" * 70)

if __name__ == "__main__":
    main()


    # venv\Scripts\activate
    # python main.py sample_code\test.py
