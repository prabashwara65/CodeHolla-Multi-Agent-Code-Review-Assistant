"""Deterministic evaluation tests for each MAS agent output contract."""

from typing import Any

from src.agents.coordinator import CoordinatorAgent
from src.agents.logic_reviewer import LogicReviewerAgent
from src.agents.security_reviewer import SecurityReviewerAgent
from src.agents.style_reviewer import StyleReviewerAgent
from src.state import create_initial_state


def test_coordinator_fallback_enables_relevant_reviews(monkeypatch: Any) -> None:
    """Coordinator should create a secure review plan when LLM output is unavailable."""
    code = """
def login(user):
    password = "admin123"
    if user:
        if user == "admin":
            return eval(user)
    if user == "guest":
        return True
    for attempt in range(3):
        if attempt > 1:
            return False
    return False
"""
    state = create_initial_state("login.py", code)
    agent = CoordinatorAgent()
    monkeypatch.setattr(agent, "_call_llm", lambda *_args, **_kwargs: "not-json")

    result = agent.process(state)

    assert result["current_agent"] == "delegator"
    assert result["review_plan"]["style_review"] is True
    assert result["review_plan"]["logic_review"] is True
    assert result["review_plan"]["security_review"] is True
    assert result["code_content"] == code


def test_style_agent_normalizes_llm_findings(monkeypatch: Any) -> None:
    """Style reviewer should attach category, agent, and default metadata."""
    state = create_initial_state("style.py", "def bad( x,y ):\n    return x+y\n" * 3)
    agent = StyleReviewerAgent()
    monkeypatch.setattr(
        agent,
        "_call_llm",
        lambda *_args, **_kwargs: (
            '{"findings": [{"line": 1, "message": "Spacing issue", '
            '"suggestion": "Use spaces around operators"}]}'
        ),
    )

    result = agent.process(state)

    assert result["current_agent"] == "style_complete"
    assert result["findings"][0]["category"] == "style"
    assert result["findings"][0]["agent"] == "StyleReviewer"
    assert result["findings"][0]["severity"] == "low"


def test_logic_agent_normalizes_llm_findings(monkeypatch: Any) -> None:
    """Logic reviewer should return structured logic findings."""
    state = create_initial_state(
        "logic.py",
        "def divide(a, b):\n    if b == 0:\n        return None\n    return a / b\n" * 2,
    )
    agent = LogicReviewerAgent()
    monkeypatch.setattr(
        agent,
        "_call_llm",
        lambda *_args, **_kwargs: (
            '{"findings": [{"line": 2, "message": "Ambiguous zero division handling", '
            '"suggestion": "Raise a clear exception"}]}'
        ),
    )

    result = agent.process(state)

    assert result["current_agent"] == "logic_complete"
    assert result["findings"][0]["category"] == "logic"
    assert result["findings"][0]["agent"] == "LogicReviewer"
    assert result["findings"][0]["severity"] == "medium"


def test_security_agent_normalizes_llm_findings(monkeypatch: Any) -> None:
    """Security reviewer should return structured vulnerability findings."""
    state = create_initial_state(
        "security.py",
        "def run(user_code):\n    password = 'admin123'\n    return eval(user_code)\n" * 2,
    )
    agent = SecurityReviewerAgent()
    monkeypatch.setattr(
        agent,
        "_call_llm",
        lambda *_args, **_kwargs: (
            '{"findings": [{"line": 3, "message": "eval executes untrusted input", '
            '"suggestion": "Remove eval and parse allowed commands"}]}'
        ),
    )

    result = agent.process(state)

    assert result["current_agent"] == "security_complete"
    assert result["findings"][0]["category"] == "security"
    assert result["findings"][0]["agent"] == "SecurityReviewer"
    assert result["findings"][0]["severity"] == "high"
