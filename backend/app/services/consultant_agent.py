"""
AI Consultant Agent service - handles intelligent model recommendations
"""

from typing import Dict, Any, List
from datetime import datetime

from ..core.config import settings
from ..core.logging import LoggerMixin
from ..core.exceptions import ConsultantError


class ConsultantAgent(LoggerMixin):
    """Service for AI consultant agent operations."""
    
    def __init__(self):
        self.agent = None
        self._initialize_agent()
    
    def _initialize_agent(self):
        """Initialize the ReAct agent."""
        try:
            from ..agents.agent import create_consultant_agent
            self.agent = create_consultant_agent(settings.default_gemini_model)
            self.logger.info("AI Consultant agent initialized successfully")
        except Exception as e:
            self.logger.error(f"Failed to initialize AI agent: {e}")
            self.agent = None
    
    async def get_recommendation(self, task_description: str, selected_models: List[str], user_context: str = None) -> Dict[str, Any]:
        """Get intelligent model recommendation from the agent."""
        if not self.agent:
            raise ConsultantError("AI Consultant not available")
        
        try:
            # Prepare the prompt
            prompt_parts = [task_description]
            if user_context:
                prompt_parts.append(f"Additional context: {user_context}")
            prompt_parts.append(f"Please compare these specific models: {', '.join(selected_models)}")
            
            full_prompt = "\n\n".join(prompt_parts)
            
            self.logger.info(f"Processing consultation request for task: {task_description[:100]}...")
            
            # Invoke the agent
            result = self.agent.invoke({
                "messages": [{"role": "user", "content": full_prompt}]
            })
            
            # Extract response
            messages = result.get("messages", [])
            if messages:
                final_message = messages[-1]
                raw_content = final_message.content if hasattr(final_message, 'content') else str(final_message)
                
                # Handle complex response formats (LangChain sometimes returns objects)
                if isinstance(raw_content, list) and len(raw_content) > 0:
                    # Extract text from complex object format
                    if isinstance(raw_content[0], dict) and 'text' in raw_content[0]:
                        recommendation = raw_content[0]['text']
                    else:
                        recommendation = str(raw_content[0])
                elif isinstance(raw_content, dict) and 'text' in raw_content:
                    recommendation = raw_content['text']
                else:
                    recommendation = str(raw_content)
            else:
                recommendation = "No response generated"
            
            # Extract benchmark results from tool calls
            benchmark_results = self._extract_benchmark_results(messages)
            
            self.logger.info("Consultation completed successfully")
            
            return {
                "success": True,
                "task": task_description,
                "recommendation": recommendation,
                "reasoning_steps": messages[:-1] if len(messages) > 1 else [],
                "benchmark_results": benchmark_results,
                "timestamp": datetime.now().isoformat(),
                "consultant_version": "1.0"
            }
            
        except Exception as e:
            self.logger.error(f"Consultation failed: {e}")
            return {
                "success": False,
                "task": task_description,
                "error": str(e),
                "fallback_recommendation": self._get_fallback_recommendation(task_description),
                "timestamp": datetime.now().isoformat(),
                "consultant_version": "1.0"
            }
    
    def _extract_benchmark_results(self, messages: List[Any]) -> List[Dict[str, Any]]:
        """Extract benchmark results from agent messages."""
        benchmark_results = []
        for message in messages:
            if hasattr(message, 'type') and message.type == 'tool':
                try:
                    import json
                    tool_content = message.content
                    if tool_content and tool_content.startswith('['):
                        results = json.loads(tool_content)
                        if isinstance(results, list) and results:
                            benchmark_results = results
                            break
                except Exception as e:
                    self.logger.warning(f"Failed to parse benchmark results: {e}")
                    continue
        return benchmark_results
    
    def _get_fallback_recommendation(self, task_description: str) -> str:
        """Generate fallback recommendation when agent fails."""
        if "recommendation" in task_description.lower():
            return "For recommendation systems, I suggest starting with Mistral Small for balanced performance, then consider Mistral Large if you need higher quality responses."
        elif "content" in task_description.lower() or "writing" in task_description.lower():
            return "For content generation, Mistral Small typically provides good quality output, while Mistral Tiny is more cost-effective for simple content."
        else:
            return "I recommend testing both Mistral Tiny and Mistral Small with your specific use case to determine the best fit for your quality, cost, and performance requirements."
    
    def is_available(self) -> bool:
        """Check if the consultant agent is available."""
        return self.agent is not None
