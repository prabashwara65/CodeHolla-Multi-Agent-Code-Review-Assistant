"""Security Reviewer Agent - Student D"""

from typing import Dict, Any
from src.agents.base_agent import BaseAgent
from src.logger import mas_logger

class SecurityReviewerAgent(BaseAgent):
    """Reviews code security using Ollama"""
    
    SYSTEM_PROMPT = """You are a Python security reviewer. Find security vulnerabilities.
    Return ONLY valid JSON. Format: {"findings": [{"line": number, "severity": "critical/high/medium", 
    "message": "vulnerability description", "suggestion": "how to fix"}]}
    If no issues, return {"findings": []}
    Do not include any other text outside the JSON."""
    
    def __init__(self):
        super().__init__("SecurityReviewer")
    
    def process(self, state: Dict[str, Any]) -> Dict[str, Any]:
        mas_logger.log_agent_start(self.name, state)
        
        code = state.get("code_content", "")
        findings = []
        
        print(f"\n{'='*60}")
        print(f"[SECURITY] SECURITY REVIEWER AGENT")
        print(f"   Code length in state: {len(code)} characters")
        print(f"{'='*60}")
        
        if code and len(code) > 50:
            print(f"   [AGENT] Calling Ollama for security analysis...")
            
            user_message = f"Find security vulnerabilities in this Python code:\n\n{code[:1500]}"
            
            response = self._call_llm(self.SYSTEM_PROMPT, user_message)
            
            result = self._parse_json(response)
            findings = result.get("findings", [])
            
            for f in findings:
                f["category"] = "security"
                f["agent"] = self.name
                if "severity" not in f:
                    f["severity"] = "high"
                if "line" not in f:
                    f["line"] = 0
            
            print(f"   [DATA] Found {len(findings)} security issues")
        else:
            print(f"   [WARN] No code in state! Length: {len(code)}")
        
        result = {
            "findings": findings,
            "current_agent": "security_complete",
            "execution_log": [f"Security review: {len(findings)} findings"],
            "code_content": code,  # Preserve code
            "filename": state.get("filename", "")
        }
        
        mas_logger.log_agent_end(self.name, findings, f"Found {len(findings)} issues")
        return result
