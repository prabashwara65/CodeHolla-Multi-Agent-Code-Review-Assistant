"""Security analysis tools for Security Reviewer Agent - Student D"""

import re
from typing import List, Dict, Any

class SecurityChecker:
    """Tools for identifying security vulnerabilities"""
    
    @staticmethod
    def scan_for_secrets(code_content: str) -> List[Dict[str, Any]]:
        """Scan for hardcoded secrets"""
        findings = []
        lines = code_content.split('\n')
        
        for i, line in enumerate(lines, 1):
            if re.search(r'(password|secret|key|token)\s*=\s*[\'"]', line, re.IGNORECASE):
                findings.append({
                    "line": i,
                    "severity": "critical",
                    "message": "Hardcoded secret detected",
                    "suggestion": "Use environment variables"
                })
        return findings