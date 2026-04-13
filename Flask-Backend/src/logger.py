"""Observability and logging for the MAS"""

import logging
from datetime import datetime
from pathlib import Path
from typing import Dict, Any
import jsonlines

class AgentLogger:
    def __init__(self, log_dir: str = "logs"):
        self.log_dir = Path(log_dir)
        self.log_dir.mkdir(exist_ok=True)
        self.logger = logging.getLogger("MAS")
        self.logger.setLevel(logging.INFO)
        console = logging.StreamHandler()
        console.setLevel(logging.INFO)
        self.logger.addHandler(console)
        file_handler = logging.FileHandler(self.log_dir / "mas.log")
        file_handler.setLevel(logging.DEBUG)
        self.logger.addHandler(file_handler)
        self.session_id = datetime.now().strftime("%Y%m%d_%H%M%S")
        self.jsonl_path = self.log_dir / f"trace_{self.session_id}.jsonl"
        
    def log_agent_start(self, agent_name: str, state: Dict[str, Any]):
        entry = {"timestamp": datetime.now().isoformat(), "event_type": "agent_start", "agent": agent_name}
        self._write_jsonl(entry)
        self.logger.info(f"[START] Agent '{agent_name}' started")
        
    def log_agent_end(self, agent_name: str, findings: list, reasoning: str = ""):
        entry = {"timestamp": datetime.now().isoformat(), "event_type": "agent_end", "agent": agent_name, "findings_generated": len(findings)}
        self._write_jsonl(entry)
        self.logger.info(f"[END] Agent '{agent_name}' found {len(findings)} issues")
        
    def log_tool_use(self, agent_name: str, tool_name: str, params: Dict, result: Any):
        entry = {"timestamp": datetime.now().isoformat(), "event_type": "tool_use", "agent": agent_name, "tool": tool_name}
        self._write_jsonl(entry)
        self.logger.debug(f"[TOOL] {agent_name} used {tool_name}")
        
    def _write_jsonl(self, entry: Dict):
        with jsonlines.open(self.jsonl_path, mode='a') as writer:
            writer.write(entry)

mas_logger = AgentLogger()
