"""Coordinator Agent - Student A
Responsible for analyzing code and creating an intelligent review plan
Follows the Coordinator-Worker-Delegator (CWD) model
"""

from typing import Dict, Any
from src.agents.base_agent import BaseAgent
from src.logger import mas_logger


class CoordinatorAgent(BaseAgent):
    """
    Coordinator Agent - Analyzes code and creates a review plan.
    
    This agent is the first in the CWD pipeline. It:
    1. Analyzes the source code to understand its complexity
    2. Determines which types of reviews are needed
    3. Creates a structured plan for the Delegator to follow
    4. Preserves the global state for subsequent agents
    
    The plan intelligently decides which reviewers to run:
    - Style Review: ALWAYS enabled (basic quality gate)
    - Logic Review: Enabled for complex code with conditions/loops
    - Security Review: Enabled for code with sensitive operations
    """
    
    SYSTEM_PROMPT = """You are a Code Review Coordinator Agent. Your task is to analyze Python source code and create a review plan.

Analyze the code and decide which types of reviews are needed.

RETURN ONLY VALID JSON (no other text):
{
    "style_review": true/false,
    "logic_review": true/false,
    "security_review": true/false,
    "reasoning": "brief explanation of your decision"
}

DECISION RULES:

1. STYLE_REVIEW (Always true for any code):
   - Check formatting, naming conventions, line length
   - Always enabled as basic quality gate
   - Set to: true

2. LOGIC_REVIEW (Enable if any condition is true):
   - Functions longer than 10 lines
   - Nested if/else statements (if inside if)
   - Loops (for, while) with complex bodies
   - Recursion (function calling itself)
   - Multiple return paths
   - Exception handling (try/except)
   - Complex boolean expressions (and/or with 3+ conditions)
   - List comprehensions with conditions
   - Set to: true if complex logic present, otherwise false

3. SECURITY_REVIEW (Enable if any condition is true):
   - Hardcoded passwords, secrets, API keys
   - eval() or exec() function calls
   - SQL queries with string concatenation
   - os.system(), subprocess calls
   - pickle.loads(), pickle.load()
   - Input from user (input(), sys.argv)
   - File operations (open, read, write)
   - Network operations (requests, socket)
   - set to: true if security concerns present, otherwise false

Analyze carefully and be specific in your reasoning."""
    
    def __init__(self, model: str = "llama3.2:3b"):
        """
        Initialize the Coordinator Agent.
        
        Args:
            model: Ollama model to use (default: llama3.2:3b)
        """
        super().__init__("Coordinator", model=model)
    
    def process(self, state: Dict[str, Any]) -> Dict[str, Any]:
        """
        Process the code and create a review plan.
        
        Args:
            state: Current CodeReviewState with code_content
            
        Returns:
            Updated state with review_plan
        """
        mas_logger.log_agent_start(self.name, state)
        
        # Extract code from state
        code = state.get("code_content", "")
        filename = state.get("filename", "unknown")
        
        print(f"\n{'='*70}")
        print(f"[AGENT] COORDINATOR AGENT - Analyzing Code")
        print(f"{'='*70}")
        print(f"   File: {filename}")
        print(f"   Code size: {len(code)} characters")
        print(f"   Lines: {len(code.splitlines())}")
        print(f"{'='*70}")
        
        # Default plan (fallback if LLM fails)
        default_plan = {
            "style_review": True,
            "logic_review": True,
            "security_review": True,
            "reasoning": "Default plan - all reviews enabled"
        }
        
        plan = default_plan.copy()
        
        # Only use LLM if code is substantial
        if code and len(code) > 50:
            print(f"\n   [LOGIC] Analyzing code with Ollama...")
            print(f"   [TIME]  This may take 15-30 seconds...")
            
            # Create prompt for LLM (fixed f-string)
            user_message = "Analyze this Python code and create a review plan:\n\n```python\n" + code[:2000] + "\n```\n\nReturn ONLY JSON with style_review, logic_review, security_review, and reasoning."

            try:
                # Call LLM
                response = self._call_llm(self.SYSTEM_PROMPT, user_message)
                
                print(f"\n   [LLM] Raw LLM Response:")
                print(f"   {response[:300]}...")
                
                # Parse JSON response
                parsed = self._parse_json(response)
                
                if parsed and "style_review" in parsed:
                    plan = {
                        "style_review": parsed.get("style_review", True),
                        "logic_review": parsed.get("logic_review", False),
                        "security_review": parsed.get("security_review", False),
                        "reasoning": parsed.get("reasoning", "LLM analysis completed")
                    }
                    print(f"\n   [OK] Successfully parsed LLM response")
                else:
                    print(f"\n   [WARN] LLM response parsing failed, using fallback rules")
                    plan = self._fallback_analysis(code)
                    
            except Exception as e:
                print(f"\n   [ERROR] LLM call failed: {e}")
                print(f"   [FALLBACK] Using fallback rule-based analysis")
                plan = self._fallback_analysis(code)
        else:
            print(f"\n   [WARN] Code too short ({len(code)} chars), using fallback analysis")
            plan = self._fallback_analysis(code)
        
        # Ensure all required keys exist
        final_plan = {
            "style_review": plan.get("style_review", True),
            "logic_review": plan.get("logic_review", False),
            "security_review": plan.get("security_review", False),
            "reasoning": plan.get("reasoning", "No specific reasoning provided")
        }
        
        # Display the plan
        print(f"\n{'='*70}")
        print(f"[PLAN] COORDINATOR REVIEW PLAN")
        print(f"{'='*70}")
        print(f"   Style Review:   {'[OK] ENABLED' if final_plan['style_review'] else '[ERROR] DISABLED'}")
        print(f"   Logic Review:   {'[OK] ENABLED' if final_plan['logic_review'] else '[ERROR] DISABLED'}")
        print(f"   Security Review: {'[OK] ENABLED' if final_plan['security_review'] else '[ERROR] DISABLED'}")
        print(f"\n   [API] Reasoning: {final_plan['reasoning'][:200]}")
        print(f"{'='*70}")
        
        # Prepare result with preserved state
        result = {
            "current_agent": "delegator",  # Next agent in pipeline
            "review_plan": {
                "style_review": final_plan["style_review"],
                "logic_review": final_plan["logic_review"],
                "security_review": final_plan["security_review"]
            },
            "execution_log": [
                f"Coordinator analyzed {len(code)} characters",
                f"Plan: style={final_plan['style_review']}, logic={final_plan['logic_review']}, security={final_plan['security_review']}",
                f"Reasoning: {final_plan['reasoning'][:100]}"
            ],
            # Preserve existing state data
            "code_content": code,
            "filename": filename
        }
        
        mas_logger.log_agent_end(self.name, [], f"Plan created: {final_plan}")
        return result
    
    def _fallback_analysis(self, code: str) -> Dict[str, bool]:
        """
        Fallback rule-based analysis when LLM is unavailable.
        
        Args:
            code: Source code to analyze
            
        Returns:
            Dictionary with review decisions
        """
        print(f"\n   [SCAN] Running fallback rule-based analysis...")
        
        lines = code.split('\n')
        code_lower = code.lower()
        
        # Style review - ALWAYS true
        style_review = True
        
        # Logic review - Check for complex patterns
        logic_indicators = [
            len(lines) > 20,  # More than 20 lines
            code.count('if ') > 2,  # Multiple conditionals
            code.count('for ') > 0 or code.count('while ') > 0,  # Loops present
            code.count('try:') > 0,  # Exception handling
            'recursion' in code_lower or code.count('def ') > 3,  # Multiple functions
            'and' in code_lower and 'or' in code_lower,  # Complex boolean logic
            code.count('else:') > 1,  # Multiple else clauses
        ]
        logic_review = sum(logic_indicators) >= 2  # Enable if 2+ indicators
        
        # Security review - Check for dangerous patterns
        security_indicators = [
            'password' in code_lower or 'secret' in code_lower or 'token' in code_lower,
            'eval(' in code or 'exec(' in code,
            'os.system' in code or 'subprocess' in code,
            'pickle' in code_lower,
            'input(' in code or 'sys.argv' in code,
            'open(' in code or 'file(' in code,
            'requests.' in code_lower or 'urllib' in code_lower,
            'sql' in code_lower and ('execute' in code_lower or 'cursor' in code_lower),
        ]
        security_review = any(security_indicators)
        
        # Build reasoning
        reasoning_parts = []
        if style_review:
            reasoning_parts.append("Style review always enabled")
        if logic_review:
            triggers = []
            if len(lines) > 20:
                triggers.append(f"{len(lines)} lines of code")
            if code.count('if ') > 2:
                triggers.append(f"{code.count('if ')} conditional statements")
            if code.count('for ') > 0 or code.count('while ') > 0:
                triggers.append("loops detected")
            reasoning_parts.append(f"Logic review enabled: {', '.join(triggers)}")
        else:
            reasoning_parts.append("Logic review disabled: code appears straightforward")
            
        if security_review:
            triggers = []
            if 'password' in code_lower:
                triggers.append("password detected")
            if 'eval(' in code or 'exec(' in code:
                triggers.append("eval/exec detected")
            if 'open(' in code:
                triggers.append("file operations")
            reasoning_parts.append(f"Security review enabled: {', '.join(triggers)}")
        else:
            reasoning_parts.append("Security review disabled: no obvious security concerns")
        
        reasoning = ". ".join(reasoning_parts)
        
        print(f"   [DATA] Rule-based analysis complete:")
        print(f"      - Logic indicators found: {sum(logic_indicators)}")
        print(f"      - Security indicators found: {sum(security_indicators)}")
        
        return {
            "style_review": style_review,
            "logic_review": logic_review,
            "security_review": security_review,
            "reasoning": reasoning
        }
    
    def get_plan_summary(self, plan: Dict[str, bool]) -> str:
        """
        Generate a human-readable summary of the plan.
        
        Args:
            plan: Review plan dictionary
            
        Returns:
            Formatted summary string
        """
        enabled = []
        if plan.get("style_review"):
            enabled.append("Style")
        if plan.get("logic_review"):
            enabled.append("Logic")
        if plan.get("security_review"):
            enabled.append("Security")
        
        if len(enabled) == 3:
            return "Full review (all three reviewers)"
        elif len(enabled) == 2:
            return f"Partial review ({', '.join(enabled)})"
        elif len(enabled) == 1:
            return f"Minimal review ({enabled[0]} only)"
        else:
            return "No reviewers enabled (unusual)"
