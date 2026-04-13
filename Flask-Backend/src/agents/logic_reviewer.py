"""Logic Reviewer Agent - Student C"""

from typing import Dict, Any
from src.agents.base_agent import BaseAgent
from src.logger import mas_logger

class LogicReviewerAgent(BaseAgent):
    """Reviews code logic using Ollama"""
    
    SYSTEM_PROMPT = """You are a Python logic reviewer. Find bugs, edge cases, and logical errors.
    Return ONLY valid JSON. Format: {"findings": [{"line": number, "severity": "low/medium/high", 
    "message": "bug description", "suggestion": "how to fix"}]}
    If no issues, return {"findings": []}
    Do not include any other text outside the JSON."""
    
    def __init__(self):
        super().__init__("LogicReviewer")
    
    def process(self, state: Dict[str, Any]) -> Dict[str, Any]:
        mas_logger.log_agent_start(self.name, state)
        
        code = state.get("code_content", "")
        findings = []
        
        print(f"\n{'='*60}")
        print(f"🧠 LOGIC REVIEWER AGENT")
        print(f"   Code length in state: {len(code)} characters")
        print(f"{'='*60}")
        
        if code and len(code) > 50:
            print(f"   🤖 Calling Ollama for logic analysis...")
            
            user_message = f"Find bugs and logical errors in this Python code:\n\n{code[:1500]}"
            
            response = self._call_llm(self.SYSTEM_PROMPT, user_message)
            
            result = self._parse_json(response)
            findings = result.get("findings", [])
            
            for f in findings:
                f["category"] = "logic"
                f["agent"] = self.name
                if "severity" not in f:
                    f["severity"] = "medium"
                if "line" not in f:
                    f["line"] = 0
            
            print(f"   📊 Found {len(findings)} logic issues")
        else:
            print(f"   ⚠️ No code in state! Length: {len(code)}")
        
        result = {
            "findings": findings,
            "current_agent": "logic_complete",
            "execution_log": [f"Logic review: {len(findings)} findings"],
            "code_content": code,  # Preserve code
            "filename": state.get("filename", "")
        }
        
        mas_logger.log_agent_end(self.name, findings, f"Found {len(findings)} issues")
        return result