"""Linter tools for Style Reviewer Agent - Student B"""

import subprocess
import tempfile
from typing import List, Dict, Any

class LinterTools:
    """Tools for running Python linters and style checkers"""
    
    @staticmethod
    def run_flake8(code_content: str) -> List[Dict[str, Any]]:
        """
        Run flake8 on code content to find style violations.
        
        Args:
            code_content: Python source code string
            
        Returns:
            List of violations with line numbers and messages
        """
        violations = []
        
        # Write content to temp file
        with tempfile.NamedTemporaryFile(mode='w', suffix='.py', delete=False, encoding='utf-8') as f:
            f.write(code_content)
            temp_path = f.name
        
        try:
            # Run flake8
            result = subprocess.run(
                ['flake8', temp_path, '--max-line-length=88', '--select=E,W,F'],
                capture_output=True,
                text=True,
                timeout=10
            )
            
            # Parse output: format "file.py:line:col: code message"
            for line in result.stdout.splitlines():
                if ':' in line:
                    parts = line.split(':')
                    if len(parts) >= 4:
                        violations.append({
                            "line": int(parts[1]),
                            "column": int(parts[2]),
                            "code": parts[3].strip().split()[0],
                            "message": ' '.join(parts[3].strip().split()[1:]),
                            "tool": "flake8"
                        })
                        
        except subprocess.TimeoutExpired:
            violations.append({"error": "Flake8 timed out"})
        except FileNotFoundError:
            violations.append({"error": "Flake8 not installed. Run: pip install flake8"})
        finally:
            import os
            try:
                os.unlink(temp_path)
            except:
                pass
                
        return violations
    
    @staticmethod
    def check_line_length(code_content: str, max_length: int = 88) -> List[Dict[str, Any]]:
        """Simple line length check without external tools"""
        violations = []
        lines = code_content.split('\n')
        
        for i, line in enumerate(lines, 1):
            if len(line) > max_length:
                violations.append({
                    "line": i,
                    "code": "E501",
                    "message": f"Line exceeds {max_length} characters ({len(line)})",
                    "tool": "builtin"
                })
        
        return violations