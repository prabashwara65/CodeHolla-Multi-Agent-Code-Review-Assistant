"""Evaluation tests for the custom Python tools used by the agents."""

import pytest

from src.tools.ast_tools import ASTAnalyzer
from src.tools.file_tools import FileSystemTools
from src.tools.linter_tools import LinterTools
from src.tools.security_tools import SecurityChecker


def test_file_tool_reads_valid_python_file() -> None:
    """The file tool should read Python source and report basic metadata."""
    result = FileSystemTools.read_python_file("sample_code/test.py")

    assert "error" not in result
    assert "def bad_function" in result["content"]
    assert result["line_count"] > 0
    assert result["valid_syntax"] is True
    assert result["syntax_error"] is None


def test_file_tool_rejects_non_python_file() -> None:
    """The file tool should reject unsupported input files."""
    result = FileSystemTools.read_python_file("cd")

    assert result == {"error": "File cd is not a Python file"}


def test_linter_tool_detects_long_lines_without_external_flake8() -> None:
    """The built-in linter helper should flag lines longer than the policy."""
    code = "short = True\n" + "x = '" + ("a" * 95) + "'\n"

    violations = LinterTools.check_line_length(code, max_length=88)

    assert violations == [
        {
            "line": 2,
            "code": "E501",
            "message": "Line exceeds 88 characters (101)",
            "tool": "builtin",
        }
    ]


def test_security_tool_detects_hardcoded_secret() -> None:
    """The security tool should identify hardcoded credential assignments."""
    code = "username = 'admin'\npassword = 'admin123'\n"

    findings = SecurityChecker.scan_for_secrets(code)

    assert findings
    assert findings[0]["line"] == 2
    assert findings[0]["severity"] == "critical"
    assert "Hardcoded secret" in findings[0]["message"]


@pytest.mark.parametrize("secret_name", ["password", "secret", "key", "token"])
def test_security_tool_detects_supported_secret_names(secret_name: str) -> None:
    """Evaluation check: every supported secret name should be detected."""
    code = f"{secret_name} = 'local-test-value'\n"

    findings = SecurityChecker.scan_for_secrets(code)

    assert len(findings) == 1
    assert findings[0]["severity"] == "critical"


def test_ast_tool_detects_logic_risk_patterns() -> None:
    """The AST helper should catch risky control-flow patterns."""
    code = "while True:\n    break\n\ntry:\n    run()\nexcept:\n    pass\n"

    findings = ASTAnalyzer.find_dangerous_patterns(code)

    messages = {finding["message"] for finding in findings}
    assert "Potential infinite loop - ensure break condition exists" in messages
    assert "Bare except clause catches all exceptions" in messages
