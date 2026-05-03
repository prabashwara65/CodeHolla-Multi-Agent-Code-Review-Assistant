# create_files.py - Run this to create all project files

import os

# Create directories if they don't exist
os.makedirs("src/agents", exist_ok=True)
os.makedirs("src/tools", exist_ok=True)
os.makedirs("src/workflow", exist_ok=True)
os.makedirs("tests", exist_ok=True)
os.makedirs("logs", exist_ok=True)
os.makedirs("sample_code", exist_ok=True)

# Create __init__.py files
for init_file in ["src/__init__.py", "src/agents/__init__.py", "src/tools/__init__.py", "src/workflow/__init__.py", "tests/__init__.py"]:
    with open(init_file, "w") as f:
        f.write("# Package initialization\n")

# Create state.py
with open("src/state.py", "w") as f:
    f.write('''"""Global state management for the Multi-Agent System"""

from typing import TypedDict, List, Dict, Any, Optional, Annotated
from operator import add
from datetime import datetime
from enum import Enum

class Severity(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"

class Finding(TypedDict):
    category: str
    line: int
    severity: str
    message: str
    suggestion: str
    agent: str

class ReviewSummary(TypedDict):
    style_score: int
    logic_score: int
    security_risk: str
    total_findings: int
    high_severity_count: int

class CodeReviewState(TypedDict):
    filename: str
    code_content: str
    review_request: str
    findings: Annotated[List[Finding], add]
    current_agent: str
    review_plan: Optional[Dict[str, Any]]
    summary: Optional[ReviewSummary]
    overall_status: str
    recommendations: List[str]
    start_time: datetime
    end_time: Optional[datetime]
    execution_log: Annotated[List[str], add]

def create_initial_state(filename: str, code_content: str) -> CodeReviewState:
    return CodeReviewState(
        filename=filename,
        code_content=code_content,
        review_request="Perform comprehensive code review",
        findings=[],
        current_agent="coordinator",
        review_plan=None,
        summary=None,
        overall_status="PENDING",
        recommendations=[],
        start_time=datetime.now(),
        end_time=None,
        execution_log=[f"Initialized review for {filename}"]
    )
''')

# Create logger.py
with open("src/logger.py", "w") as f:
    f.write('''"""Observability and logging for the MAS"""

import logging
from datetime import datetime
from pathlib import Path
from typing import Dict, Any
import jsonlines

class AgentLogger:
    def __init__(self, log_dir: str = "logs"):
        self.log_dir = Path(log_dir)
        self.log_dir.mkdir(exist_ok=True)
        self.logger = logging.getLogger("MAS")
        self.logger.setLevel(logging.INFO)
        console = logging.StreamHandler()
        console.setLevel(logging.INFO)
        self.logger.addHandler(console)
        file_handler = logging.FileHandler(self.log_dir / "mas.log")
        file_handler.setLevel(logging.DEBUG)
        self.logger.addHandler(file_handler)
        self.session_id = datetime.now().strftime("%Y%m%d_%H%M%S")
        self.jsonl_path = self.log_dir / f"trace_{self.session_id}.jsonl"
        
    def log_agent_start(self, agent_name: str, state: Dict[str, Any]):
        entry = {"timestamp": datetime.now().isoformat(), "event_type": "agent_start", "agent": agent_name}
        self._write_jsonl(entry)
        self.logger.info(f"[START] Agent '{agent_name}' started")
        
    def log_agent_end(self, agent_name: str, findings: list, reasoning: str = ""):
        entry = {"timestamp": datetime.now().isoformat(), "event_type": "agent_end", "agent": agent_name, "findings_generated": len(findings)}
        self._write_jsonl(entry)
        self.logger.info(f"[END] Agent '{agent_name}' found {len(findings)} issues")
        
    def log_tool_use(self, agent_name: str, tool_name: str, params: Dict, result: Any):
        entry = {"timestamp": datetime.now().isoformat(), "event_type": "tool_use", "agent": agent_name, "tool": tool_name}
        self._write_jsonl(entry)
        self.logger.debug(f"[TOOL] {agent_name} used {tool_name}")
        
    def _write_jsonl(self, entry: Dict):
        with jsonlines.open(self.jsonl_path, mode='a') as writer:
            writer.write(entry)

mas_logger = AgentLogger()
''')

# Create main.py
with open("main.py", "w") as f:
    f.write('''"""Multi-Agent Code Review Assistant"""

import sys
from datetime import datetime
from src.state import create_initial_state
from src.logger import mas_logger
from src.tools.file_tools import FileSystemTools

def main():
    print("=" * 60)
    print("[AGENT] Multi-Agent Code Review Assistant")
    print("=" * 60)
    
    if len(sys.argv) < 2:
        print("Usage: python main.py <python_file_path>")
        sys.exit(1)
    
    filename = sys.argv[1]
    print(f"\\n[FILE] Reviewing file: {filename}")
    
    file_tools = FileSystemTools()
    file_info = file_tools.read_python_file(filename)
    
    if "error" in file_info:
        print(f"[ERROR] Error: {file_info['error']}")
        sys.exit(1)
    
    print(f"[DATA] Lines of code: {file_info['line_count']}")
    state = create_initial_state(filename, file_info['content'])
    print(f"\\n[OK] Review session started: {mas_logger.session_id}")
    print(f"[LOGS] Logs saved to: logs/")

if __name__ == "__main__":
    main()
''')

# Create file_tools.py
with open("src/tools/file_tools.py", "w") as f:
    f.write('''from pathlib import Path
import ast
from typing import Dict, Any

class FileSystemTools:
    @staticmethod
    def read_python_file(filepath: str) -> Dict[str, Any]:
        path = Path(filepath)
        if not path.exists():
            return {"error": f"File {filepath} not found"}
        with open(path, 'r', encoding='utf-8') as f:
            content = f.read()
        return {"content": content, "line_count": len(content.splitlines()), "valid_syntax": True}
    
    @staticmethod
    def save_review_report(report: Dict[str, Any], output_path: str) -> Dict[str, Any]:
        import json
        path = Path(output_path)
        path.parent.mkdir(parents=True, exist_ok=True)
        with open(path, 'w') as f:
            json.dump(report, f, indent=2)
        return {"success": True, "saved_to": str(path)}
''')

# Create sample test file
with open("sample_code/test.py", "w") as f:
    f.write('''def bad_function( x,y ):
    result=x+y
    return result

password="hardcoded123"

def insecure():
    eval("print('dangerous')")
    return True
''')

print("[OK] All files created successfully!")
print("Run: python main.py sample_code/test.py")
