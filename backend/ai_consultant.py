"""
Benchmind AI Consultant - Intelligent model recommendation using LangChain ReAct Agent
"""

import os
import json
import time
import requests
from typing import Dict, List, Any, Optional
from dataclasses import dataclass

from langchain_core.tools import tool
from langchain_google_genai import ChatGoogleGenerativeAI
from langgraph.prebuilt import create_react_agent
from langgraph.prebuilt.chat_agent_executor import AgentStatePydantic
from langgraph.graph.state import CompiledStateGraph


@dataclass
class TaskSimulationResult:
    """Result from simulating a task with a specific model."""
    model_id: str
    model_name: str
    task_description: str
    simulated_quality: float  # 0-1 score
    actual_latency_ms: float
    actual_cost_usd: float
    actual_energy_wh: float
    actual_co2_g: float
    simulation_details: Dict[str, Any]


class TaskSimulator:
    """Simulates different AI tasks to test model performance."""
    
    def __init__(self, mistral_api_key: str):
        self.mistral_api_key = mistral_api_key
    
    def simulate_recommendation_system(self, model_id: str, complexity: str = "medium") -> TaskSimulationResult:
        """Simulate a movie recommendation system task."""
        
        # Create a realistic recommendation prompt
        if complexity == "simple":
            prompt = "Recommend 3 movies similar to The Matrix."
            expected_tokens = 50
        elif complexity == "medium":
            prompt = "I enjoyed The Matrix, Inception, and Blade Runner. Recommend 5 movies with detailed explanations of why I'd like them, considering plot complexity, visual effects, and philosophical themes."
            expected_tokens = 150
        else:  # complex
            prompt = "Create a personalized movie recommendation system. User profile: loves sci-fi with philosophical depth, enjoys complex narratives, prefers movies from 1990-2020, dislikes romantic comedies. Provide 10 recommendations with detailed analysis of why each fits the profile, including director style, thematic elements, and similar movies they might have enjoyed."
            expected_tokens = 300
        
        # Actually call the model
        start_time = time.time()
        response = self._call_mistral_api(model_id, prompt, expected_tokens)
        end_time = time.time()
        
        # Calculate metrics
        latency_ms = (end_time - start_time) * 1000
        usage = response.get('usage', {})
        total_tokens = usage.get('total_tokens', expected_tokens)
        
        # Calculate costs and environmental impact
        cost_usd = self._calculate_cost(total_tokens, model_id)
        energy_wh, co2_g = self._calculate_environmental_impact(total_tokens, model_id)
        
        # Assess quality based on response characteristics
        response_text = response['choices'][0]['message']['content']
        quality_score = self._assess_recommendation_quality(response_text, complexity)
        
        return TaskSimulationResult(
            model_id=model_id,
            model_name=self._get_model_name(model_id),
            task_description=f"Movie recommendation system ({complexity} complexity)",
            simulated_quality=quality_score,
            actual_latency_ms=latency_ms,
            actual_cost_usd=cost_usd,
            actual_energy_wh=energy_wh,
            actual_co2_g=co2_g,
            simulation_details={
                "prompt": prompt,
                "response": response_text,
                "tokens_used": total_tokens,
                "complexity": complexity,
                "recommendations_found": self._count_recommendations(response_text)
            }
        )
    
    def simulate_content_generation(self, model_id: str, task_type: str = "blog_post") -> TaskSimulationResult:
        """Simulate content generation tasks."""
        
        prompts = {
            "blog_post": "Write a 500-word blog post about sustainable AI development and its environmental impact.",
            "product_description": "Write compelling product descriptions for 5 different eco-friendly products.",
            "technical_documentation": "Create technical documentation for a REST API that provides AI model benchmarking services."
        }
        
        expected_tokens = {"blog_post": 200, "product_description": 150, "technical_documentation": 250}
        
        prompt = prompts[task_type]
        tokens = expected_tokens[task_type]
        
        start_time = time.time()
        response = self._call_mistral_api(model_id, prompt, tokens)
        end_time = time.time()
        
        latency_ms = (end_time - start_time) * 1000
        usage = response.get('usage', {})
        total_tokens = usage.get('total_tokens', tokens)
        
        cost_usd = self._calculate_cost(total_tokens, model_id)
        energy_wh, co2_g = self._calculate_environmental_impact(total_tokens, model_id)
        
        response_text = response['choices'][0]['message']['content']
        quality_score = self._assess_content_quality(response_text, task_type)
        
        return TaskSimulationResult(
            model_id=model_id,
            model_name=self._get_model_name(model_id),
            task_description=f"Content generation: {task_type.replace('_', ' ')}",
            simulated_quality=quality_score,
            actual_latency_ms=latency_ms,
            actual_cost_usd=cost_usd,
            actual_energy_wh=energy_wh,
            actual_co2_g=co2_g,
            simulation_details={
                "prompt": prompt,
                "response": response_text,
                "tokens_used": total_tokens,
                "task_type": task_type,
                "word_count": len(response_text.split())
            }
        )
    
    def _call_mistral_api(self, model_id: str, prompt: str, max_tokens: int) -> Dict[str, Any]:
        """Call Mistral API."""
        headers = {
            "Authorization": f"Bearer {self.mistral_api_key}",
            "Content-Type": "application/json"
        }
        
        payload = {
            "model": model_id,
            "messages": [{"role": "user", "content": prompt}],
            "max_tokens": max_tokens
        }
        
        response = requests.post(
            "https://api.mistral.ai/v1/chat/completions",
            headers=headers,
            json=payload,
            timeout=30
        )
        
        if response.status_code != 200:
            raise Exception(f"Mistral API error: {response.text}")
        
        return response.json()
    
    def _assess_recommendation_quality(self, response: str, complexity: str) -> float:
        """Assess quality of recommendation system output."""
        score = 0.5  # Base score
        
        # Check for movie titles (basic requirement)
        movie_indicators = ["movie", "film", "recommend", "similar", "like"]
        if any(indicator in response.lower() for indicator in movie_indicators):
            score += 0.2
        
        # Check for explanations
        explanation_indicators = ["because", "since", "reason", "why", "similar to"]
        if any(indicator in response.lower() for indicator in explanation_indicators):
            score += 0.2
        
        # Complexity-specific scoring
        if complexity == "simple" and len(response.split()) >= 30:
            score += 0.1
        elif complexity == "medium" and len(response.split()) >= 100:
            score += 0.1
        elif complexity == "complex" and len(response.split()) >= 200:
            score += 0.1
        
        return min(score, 1.0)
    
    def _assess_content_quality(self, response: str, task_type: str) -> float:
        """Assess quality of content generation."""
        score = 0.5  # Base score
        
        word_count = len(response.split())
        
        # Length appropriateness
        if task_type == "blog_post" and 300 <= word_count <= 600:
            score += 0.2
        elif task_type == "product_description" and word_count >= 100:
            score += 0.2
        elif task_type == "technical_documentation" and word_count >= 150:
            score += 0.2
        
        # Structure indicators
        structure_indicators = [".", ":", "-", "1.", "2.", "##"]
        if sum(1 for indicator in structure_indicators if indicator in response) >= 3:
            score += 0.2
        
        # Relevance to task
        task_keywords = {
            "blog_post": ["sustainable", "AI", "development", "environmental"],
            "product_description": ["product", "features", "benefits"],
            "technical_documentation": ["API", "endpoint", "request", "response"]
        }
        
        relevant_keywords = task_keywords.get(task_type, [])
        if sum(1 for keyword in relevant_keywords if keyword.lower() in response.lower()) >= 2:
            score += 0.1
        
        return min(score, 1.0)
    
    def _count_recommendations(self, response: str) -> int:
        """Count number of recommendations in response."""
        # Simple heuristic - count numbered items or movie titles
        lines = response.split('\n')
        count = 0
        for line in lines:
            if any(indicator in line for indicator in ['1.', '2.', '3.', '4.', '5.', '-']):
                count += 1
        return min(count, 10)  # Cap at 10
    
    def _calculate_cost(self, tokens: int, model_id: str) -> float:
        """Calculate cost based on model pricing - dynamic estimation."""
        # Dynamic pricing estimation based on model characteristics
        if "tiny" in model_id.lower():
            rate = 0.00025  # Tiny models are cheapest
        elif "small" in model_id.lower():
            rate = 0.002    # Small models
        elif "medium" in model_id.lower():
            rate = 0.0027   # Medium models
        elif "large" in model_id.lower():
            rate = 0.008    # Large models are most expensive
        elif "open" in model_id.lower():
            if "7b" in model_id.lower():
                rate = 0.00025  # Open 7B models are cheap
            elif "8x7b" in model_id.lower() or "mixtral" in model_id.lower():
                rate = 0.0007   # Mixtral models
            else:
                rate = 0.001    # Other open models
        else:
            rate = 0.002    # Default to reasonable rate
        
        return (tokens / 1000) * rate
    
    def _calculate_environmental_impact(self, tokens: int, model_id: str) -> tuple[float, float]:
        """Calculate environmental impact - dynamic estimation."""
        # Dynamic parameter estimation based on model characteristics
        if "tiny" in model_id.lower():
            params = 7e9      # ~7B parameters
        elif "small" in model_id.lower():
            params = 22e9     # ~22B parameters
        elif "medium" in model_id.lower():
            params = 70e9     # ~70B parameters
        elif "large" in model_id.lower():
            params = 175e9    # ~175B parameters
        elif "7b" in model_id.lower():
            params = 7e9      # Explicitly 7B
        elif "8x7b" in model_id.lower() or "mixtral" in model_id.lower():
            params = 56e9     # 8 x 7B experts
        elif "open" in model_id.lower():
            params = 7e9      # Most open models are 7B
        else:
            params = 22e9     # Default to reasonable size
        
        # Energy calculation
        base_energy_per_token = 0.01825  # Wh/token
        param_scale = (params / 111e9) ** 0.7
        energy_per_token = base_energy_per_token * param_scale
        energy_wh = tokens * energy_per_token
        
        # CO₂ calculation (EU grid for Mistral)
        grid_intensity = 300  # gCO₂/kWh
        co2_g = (energy_wh / 1000) * grid_intensity
        
        return energy_wh, co2_g
    
    def _get_model_name(self, model_id: str) -> str:
        """Get human-readable model name - fully dynamic."""
        # Convert any model ID to human-readable format
        return model_id.replace('-', ' ').title()


class BenchmindAIConsultant:
    """AI Consultant using LangGraph ReAct Agent for intelligent model recommendations."""
    
    def __init__(self, gemini_api_key: str, mistral_api_key: str):
        self.gemini_api_key = gemini_api_key
        self.mistral_api_key = mistral_api_key
        self.task_simulator = TaskSimulator(mistral_api_key)
        
        # Initialize Gemini LLM
        self.llm = ChatGoogleGenerativeAI(
            model="models/gemini-2.5-flash",
            google_api_key=gemini_api_key,
            temperature=0.1
        )
        
        # Create tools and ReAct agent with LangGraph
        self.agent = self._create_react_agent()
    
    def _create_benchmark_recommendation_tool(self):
        """Create benchmark recommendation tool."""
        @tool
        def benchmark_recommendation_system(complexity: str, selected_models: str = "mistral-tiny,mistral-small") -> str:
            """Benchmark AI models for recommendation system tasks. Input: complexity level (simple/medium/complex), selected_models (comma-separated list)"""
            results = []
            models = [m.strip() for m in selected_models.split(",") if m.strip()]
            if not models:
                models = ["mistral-tiny", "mistral-small"]  # fallback
            
            for model_id in models:
                try:
                    result = self.task_simulator.simulate_recommendation_system(model_id, complexity)
                    results.append({
                        "model": result.model_name,
                        "quality": result.simulated_quality,
                        "latency_ms": result.actual_latency_ms,
                        "cost_usd": result.actual_cost_usd,
                        "energy_wh": result.actual_energy_wh,
                        "co2_g": result.actual_co2_g,
                        "recommendations_found": result.simulation_details["recommendations_found"]
                    })
                except Exception as e:
                    results.append({"model": model_id, "error": str(e)})
            
            return json.dumps(results, indent=2)
        
        return benchmark_recommendation_system
    
    def _create_benchmark_content_tool(self):
        """Create benchmark content generation tool."""
        @tool
        def benchmark_content_generation(task_type: str, selected_models: str = "mistral-tiny,mistral-small") -> str:
            """Benchmark AI models for content generation tasks. Input: task_type (blog_post/product_description/technical_documentation), selected_models (comma-separated list)"""
            results = []
            models = [m.strip() for m in selected_models.split(",") if m.strip()]
            if not models:
                models = ["mistral-tiny", "mistral-small"]  # fallback
            
            for model_id in models:
                try:
                    result = self.task_simulator.simulate_content_generation(model_id, task_type)
                    results.append({
                        "model": result.model_name,
                        "quality": result.simulated_quality,
                        "latency_ms": result.actual_latency_ms,
                        "cost_usd": result.actual_cost_usd,
                        "energy_wh": result.actual_energy_wh,
                        "co2_g": result.actual_co2_g,
                        "word_count": result.simulation_details["word_count"]
                    })
                except Exception as e:
                    results.append({"model": model_id, "error": str(e)})
            
            return json.dumps(results, indent=2)
        
        return benchmark_content_generation
    
    def _create_cost_analysis_tool(self):
        """Create cost analysis tool."""
        @tool
        def analyze_cost_efficiency(budget_usd: float) -> str:
            """Analyze which models fit within a given budget. Input: budget in USD as float"""
            analysis = {
                "budget_usd": budget_usd,
                "models": {
                    "mistral-tiny": {"cost_per_1k_tokens": 0.00025, "suitable": budget_usd >= 0.00025},
                    "mistral-small": {"cost_per_1k_tokens": 0.002, "suitable": budget_usd >= 0.002}
                },
                "recommendations": []
            }
            
            if budget_usd >= 0.002:
                analysis["recommendations"].append("Both models fit your budget. Consider quality vs cost trade-offs.")
            elif budget_usd >= 0.00025:
                analysis["recommendations"].append("Only Mistral Tiny fits your budget, but it's very cost-effective.")
            else:
                analysis["recommendations"].append("Budget is very tight. Consider increasing budget or reducing token usage.")
            
            return json.dumps(analysis, indent=2)
        
        return analyze_cost_efficiency
    
    def get_available_models(self) -> Dict[str, Any]:
        """Get available models - EXACT COPY of working test script."""
        import requests
        
        try:
            headers = {
                "Authorization": f"Bearer {self.mistral_api_key}",
                "Content-Type": "application/json"
            }
            
            print("🌐 AI Consultant fetching models from Mistral API...")
            response = requests.get(
                "https://api.mistral.ai/v1/models",
                headers=headers,
                timeout=10
            )
            
            print(f"📊 AI Consultant response status: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                models = data.get('data', [])
                
                print(f"📋 AI Consultant got {len(models)} total models from API")
                
                working_models = []
                for model in models:
                    model_id = model.get('id')
                    if not model_id:
                        continue
                    
                    # Skip ONLY embed/moderation models - EXACT SAME LOGIC
                    if any(skip in model_id.lower() for skip in ['embed', 'moderation']):
                        continue
                    
                    name = model_id.replace('-', ' ').title()
                    description = "AI model"
                    
                    working_models.append({
                        "id": model_id,
                        "name": name,
                        "provider": "mistral",
                        "description": description
                    })
                
                print(f"✅ AI Consultant returning {len(working_models)} models")
                return {
                    "available_models": working_models,
                    "total_count": len(working_models),
                    "providers": ["mistral"]
                }
            else:
                print(f"❌ AI Consultant API returned {response.status_code}: {response.text}")
            
        except Exception as e:
            print(f"❌ AI Consultant error: {e}")
        
        # Fallback
        print("🔄 AI Consultant using fallback models")
        return {
            "available_models": [
                {"id": "mistral-tiny", "name": "Mistral Tiny", "provider": "mistral", "description": "Fast"},
                {"id": "mistral-small", "name": "Mistral Small", "provider": "mistral", "description": "Balanced"}
            ],
            "total_count": 2,
            "providers": ["mistral"]
        }
    
    def _create_react_agent(self) -> CompiledStateGraph:
        """Create ReAct agent with LangGraph."""
        
        prompt = (
            "You are Benchmind AI Consultant, an expert in AI model selection and optimization.\n"
            "You help users choose the best AI model for their specific tasks by analyzing performance, cost, latency, and environmental impact.\n"
            "You have access to benchmarking tools to test models on realistic tasks.\n"
            "Always use the appropriate benchmarking tool based on the user's task description.\n"
            "When analyzing results, consider:\n"
            "1. Quality: How well does the model perform the specific task?\n"
            "2. Latency: How fast is the response time?\n"
            "3. Cost: What's the cost per inference?\n"
            "4. Environmental Impact: Energy consumption and CO₂ emissions\n"
            "5. Use Case Fit: How well does the model match the user's specific needs?\n"
            "Provide detailed explanations and reasoning for your recommendations.\n"
            "Be transparent about your testing process and cite the benchmark results you used."
        )
        
        # Create tools
        tools = [
            self._create_benchmark_recommendation_tool(),
            self._create_benchmark_content_tool(),
            self._create_cost_analysis_tool()
        ]
        
        return create_react_agent(
            model=self.llm,
            tools=tools,
            prompt=prompt,
            state_schema=AgentStatePydantic
        )
    
    def get_recommendation(self, user_task: str) -> Dict[str, Any]:
        """Get AI model recommendation for a user's task."""
        
        try:
            # Run the ReAct agent with LangGraph
            result = self.agent.invoke({"messages": [{"role": "user", "content": user_task}]})
            
            # Extract the final message from LangGraph response
            messages = result.get("messages", [])
            if messages:
                final_message = messages[-1]
                recommendation = final_message.content if hasattr(final_message, 'content') else str(final_message)
            else:
                recommendation = "No response generated"
            
            return {
                "success": True,
                "task": user_task,
                "recommendation": recommendation,
                "reasoning_steps": messages[:-1] if len(messages) > 1 else []
            }
            
        except Exception as e:
            return {
                "success": False,
                "task": user_task,
                "error": str(e),
                "fallback_recommendation": self._generate_fallback_recommendation(user_task)
            }
    
    def _generate_fallback_recommendation(self, task: str) -> str:
        """Generate a simple fallback recommendation if agent fails."""
        if "recommendation" in task.lower():
            return "For recommendation systems, I suggest starting with Mistral Tiny for cost-effectiveness, then upgrading to Mistral Small if you need higher quality responses."
        elif "content" in task.lower() or "writing" in task.lower():
            return "For content generation, Mistral Small typically provides better quality output, while Mistral Tiny is more cost-effective for simple content."
        else:
            return "I recommend testing both Mistral Tiny and Mistral Small with your specific use case to determine the best fit for your quality, cost, and performance requirements."
