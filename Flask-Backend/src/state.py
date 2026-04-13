"""Global state management for the Multi-Agent System"""

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
    """Create initial state for a code review session"""
    # Debug print
    print(f"   🔍 create_initial_state called with:")
    print(f"      filename: {filename}")
    print(f"      code_content length: {len(code_content) if code_content else 0}")
    if code_content:
        print(f"      first 100 chars: {code_content[:100]}")
    
    return {
        "filename": filename,
        "code_content": code_content,
        "review_request": "Perform comprehensive code review",
        "findings": [],
        "current_agent": "coordinator",
        "review_plan": None,
        "summary": None,
        "overall_status": "PENDING",
        "recommendations": [],
        "start_time": datetime.now(),
        "end_time": None,
        "execution_log": [f"Initialized review for {filename}"]
    }