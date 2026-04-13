"""Base Agent - Abstract foundation for all specialized agents"""

from typing import Dict, Any
from langchain_ollama import ChatOllama
from langchain_core.messages import SystemMessage, HumanMessage
import json
from abc import ABC, abstractmethod
import time
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent.parent))
from src.logger import mas_logger


class BaseAgent(ABC):
    """Abstract Base Class for all agents"""
    
    def __init__(self, name: str, model: str = "llama3.2:3b", temperature: float = 0.1):
        self.name = name
        self.model = model
        self.temperature = temperature
        
        try:
            self.llm = ChatOllama(
                model=model,
                temperature=temperature,
                num_predict=1024,
                timeout=120
            )
            mas_logger.logger.info(f"Agent '{name}' initialized with model {model}")
        except Exception as e:
            mas_logger.logger.error(f"Agent '{name}' failed to initialize: {e}")
            self.llm = None
    
    def _call_llm(self, system_prompt: str, user_message: str) -> str:
        """Call Ollama LLM"""
        if self.llm is None:
            return '{"findings": []}'
        
        messages = [
            SystemMessage(content=system_prompt),
            HumanMessage(content=user_message)
        ]
        
        try:
            start_time = time.time()
            print(f"   🤖 Calling Ollama... (this takes 10-30 seconds)")
            response = self.llm.invoke(messages)
            elapsed = time.time() - start_time
            print(f"   ✅ Response received in {elapsed:.1f} seconds")
            return response.content
        except Exception as e:
            print(f"   ❌ LLM call failed: {e}")
            return '{"findings": []}'
    
    def _parse_json(self, response: str) -> Dict[str, Any]:
        """Parse JSON from response"""
        if not response:
            return {"findings": []}
        try:
            if "```json" in response:
                response = response.split("```json")[1].split("```")[0]
            elif "```" in response:
                response = response.split("```")[1].split("```")[0]
            return json.loads(response.strip())
        except:
            return {"findings": []}
    
    @abstractmethod
    def process(self, state: Dict[str, Any]) -> Dict[str, Any]:
        pass