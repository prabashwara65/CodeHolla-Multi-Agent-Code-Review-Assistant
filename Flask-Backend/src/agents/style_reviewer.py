"""Style Reviewer Agent - Student B"""

from typing import Dict, Any
from src.agents.base_agent import BaseAgent
from src.logger import mas_logger

class StyleReviewerAgent(BaseAgent):
    """Reviews code style using Ollama"""
    
    SYSTEM_PROMPT = """You are a Python style reviewer. Find PEP 8 violations.
    Return ONLY valid JSON. Format: {"findings": [{"line": number, "severity": "low/medium/high", 
    "message": "description", "suggestion": "how to fix"}]}
    If no issues, return {"findings": []}
    Do not include any other text outside the JSON."""
    
    def __init__(self):
        super().__init__("StyleReviewer")
    
    def process(self, state: Dict[str, Any]) -> Dict[str, Any]:
        mas_logger.log_agent_start(self.name, state)
        
        # Get code from state
        code = state.get("code_content", "")
        findings = []
        
        print(f"\n{'='*60}")
        print(f"🎨 STYLE REVIEWER AGENT")
        print(f"   Code length in state: {len(code)} characters")
        print(f"{'='*60}")
        
        if code and len(code) > 50:
            print(f"   🤖 Calling Ollama for style analysis...")
            
            user_message = f"Review this Python code for style issues:\n\n{code[:1500]}"
            
            response = self._call_llm(self.SYSTEM_PROMPT, user_message)
            
            result = self._parse_json(response)
            findings = result.get("findings", [])
            
            for f in findings:
                f["category"] = "style"
                f["agent"] = self.name
                if "severity" not in f:
                    f["severity"] = "low"
                if "line" not in f:
                    f["line"] = 0
            
            print(f"   📊 Found {len(findings)} style issues")
        else:
            print(f"   ⚠️ No code in state! Length: {len(code)}")
        
        # IMPORTANT: Preserve the original state and add findings
        result = {
            "findings": findings,
            "current_agent": "style_complete",
            "execution_log": [f"Style review: {len(findings)} findings"]
        }
        
        # Also preserve the code_content and other state data
        result["code_content"] = code  # Preserve code
        result["filename"] = state.get("filename", "")
        
        mas_logger.log_agent_end(self.name, findings, f"Found {len(findings)} issues")
        return result