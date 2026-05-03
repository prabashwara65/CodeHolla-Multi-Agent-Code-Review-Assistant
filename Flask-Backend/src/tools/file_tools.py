"""File system tools for Coordinator Agent"""

from pathlib import Path
import ast
from typing import Dict, Any

class FileSystemTools:
    """Tools for reading/writing Python files"""
    
    @staticmethod
    def read_python_file(filepath: str) -> Dict[str, Any]:
        """
        Read and validate a Python file.
        """
        path = Path(filepath)
        
        print(f"   🔍 Reading file: {filepath}")
        
        if not path.exists():
            return {"error": f"File {filepath} not found"}
        
        if path.suffix != '.py':
            return {"error": f"File {filepath} is not a Python file"}
        
        with open(path, 'r', encoding='utf-8-sig') as f:
            content = f.read()
        
        print(f"   ✅ Read {len(content)} characters")
        print(f"   ✅ First 50 chars: {content[:50]}")
        
        # Check syntax validity
        valid_syntax = True
        syntax_error = None
        try:
            ast.parse(content)
        except SyntaxError as e:
            valid_syntax = False
            syntax_error = str(e)
        
        return {
            "content": content,
            "line_count": len(content.splitlines()),
            "valid_syntax": valid_syntax,
            "syntax_error": syntax_error,
            "file_size": path.stat().st_size
        }
    
    @staticmethod
    def save_review_report(report: Dict[str, Any], output_path: str) -> Dict[str, Any]:
        """
        Save review report to JSON file.
        
        Args:
            report: Report dictionary
            output_path: Where to save
            
        Returns:
            Status dictionary
        """
        import json
        
        path = Path(output_path)
        path.parent.mkdir(parents=True, exist_ok=True)
        
        with open(path, 'w', encoding='utf-8') as f:
            json.dump(report, f, indent=2, default=str)
        
        return {
            "success": True,
            "saved_to": str(path),
            "size_bytes": path.stat().st_size
        }
