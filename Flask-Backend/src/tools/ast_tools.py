"""AST analysis tools for Logic Reviewer Agent - Student C"""

import ast
import re
from typing import List, Dict, Any

class ASTAnalyzer:
    """Tools for analyzing Python AST for logical issues"""
    
    @staticmethod
    def find_dangerous_patterns(code_content: str) -> List[Dict[str, Any]]:
        """Identify dangerous code patterns"""
        dangerous = []
        patterns = [
            (r'except\s*:', "Bare except clause catches all exceptions"),
            (r'while\s+True\s*:', "Potential infinite loop - ensure break condition exists"),
        ]
        
        lines = code_content.split('\n')
        for i, line in enumerate(lines, 1):
            for pattern, message in patterns:
                if re.search(pattern, line):
                    dangerous.append({
                        "line": i,
                        "message": message,
                        "suggestion": "Review and refactor",
                        "severity": "medium"
                    })
        return dangerous