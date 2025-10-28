"""
Benchmind FastAPI Application
A working AI model evaluation platform with environmental impact measurement.
"""

import os
import time
import requests
from typing import List, Optional, Dict, Any
from datetime import datetime
import uuid

from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
from ai_consultant import BenchmindAIConsultant

# Load environment variables
load_dotenv()

app = FastAPI(
    title="Benchmind API",
    description="AI Model Evaluation Platform with Green AI Observability",
    version="0.1.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000", "http://localhost:3001", "http://127.0.0.1:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory storage (replace with database in production)
benchmark_results = {}
running_benchmarks = {}

# Initialize AI Consultant
ai_consultant = None
try:
    gemini_key = os.getenv('GEMINI_API_KEY')
    mistral_key = os.getenv('MISTRAL_API_KEY')
    if gemini_key and mistral_key:
        ai_consultant = BenchmindAIConsultant(gemini_key, mistral_key)
        print("✅ AI Consultant initialized with Gemini + Mistral")
    else:
        print("⚠️  AI Consultant disabled - missing API keys")
except Exception as e:
    print(f"⚠️  AI Consultant initialization failed: {e}")

# Pydantic models
class BenchmarkRequest(BaseModel):
    prompt: str
    models: List[str] = ["mistral-tiny", "mistral-small"]
    max_tokens: int = 50

class ModelResult(BaseModel):
    model_id: str
    model_name: str
    response: str
    quality_score: float
    latency_ms: float
    cost_usd: float
    energy_wh: float
    co2_g: float
    tokens_used: int
    tokens_per_second: float

class BenchmarkResult(BaseModel):
    benchmark_id: str
    status: str
    created_at: datetime
    completed_at: Optional[datetime] = None
    prompt: str
    results: List[ModelResult] = []
    winner: Optional[str] = None
    insights: List[str] = []

class RecommendationRequest(BaseModel):
    task_description: str
    constraints: Dict[str, float] = {}  # e.g., {"max_latency_ms": 1000, "max_co2_g": 0.1}
    optimization_goal: str = "balanced"  # "speed", "cost", "green", "balanced"

class AIConsultantRequest(BaseModel):
    task_description: str
    user_context: Optional[str] = None  # Additional context about the user's needs
    selected_models: List[str] = ["mistral-tiny", "mistral-small"]  # Models to compare

# Utility functions
def call_mistral_api(model_id: str, prompt: str, max_tokens: int = 50) -> Dict[str, Any]:
    """Call Mistral API and return response with timing."""
    api_key = os.getenv('MISTRAL_API_KEY')
    if not api_key:
        raise HTTPException(status_code=500, detail="MISTRAL_API_KEY not configured")
    
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }
    
    payload = {
        "model": model_id,
        "messages": [{"role": "user", "content": prompt}],
        "max_tokens": max_tokens
    }
    
    start_time = time.time()
    
    response = requests.post(
        "https://api.mistral.ai/v1/chat/completions",
        headers=headers,
        json=payload,
        timeout=30
    )
    
    end_time = time.time()
    latency_ms = (end_time - start_time) * 1000
    
    if response.status_code != 200:
        raise HTTPException(status_code=response.status_code, detail=f"Mistral API error: {response.text}")
    
    result = response.json()
    result['_latency_ms'] = latency_ms
    return result

def calculate_environmental_impact(tokens: int, model_params: float) -> Dict[str, float]:
    """Calculate environmental impact based on tokens and model size."""
    # Energy calculation (based on our research)
    base_energy_per_token = 0.01825  # Wh/token (from ComparIA analysis)
    param_scale = (model_params / 111e9) ** 0.7  # Sub-linear scaling
    energy_per_token = base_energy_per_token * param_scale
    energy_wh = tokens * energy_per_token
    
    # CO₂ calculation (EU grid for Mistral)
    grid_intensity = 300  # gCO₂/kWh for EU
    co2_g = (energy_wh / 1000) * grid_intensity
    
    return {
        "energy_wh": energy_wh,
        "co2_g": co2_g
    }

def calculate_cost(tokens: int, model_id: str) -> float:
    """Calculate cost based on model pricing."""
    pricing = {
        "mistral-tiny": 0.00025,   # $0.25 per 1K tokens
        "mistral-small": 0.002,    # $2 per 1K tokens
        "mistral-medium": 0.0027,  # $2.7 per 1K tokens
        "mistral-large": 0.008     # $8 per 1K tokens
    }
    
    rate = pricing.get(model_id, 0.002)  # Default to small pricing
    return (tokens / 1000) * rate

def assess_quality(response: str, prompt: str) -> float:
    """Simple quality assessment (0-5 scale)."""
    if not response or len(response.strip()) < 5:
        return 1.0
    
    score = 3.0  # Base score
    
    # Length appropriateness
    if 20 <= len(response) <= 500:
        score += 0.5
    
    # Coherence indicators
    if response.count('.') >= 1:
        score += 0.3
    
    # Completeness
    if response.strip().endswith(('.', '!', '?')):
        score += 0.2
    
    # Relevance (very basic)
    prompt_words = set(prompt.lower().split())
    response_words = set(response.lower().split())
    overlap = len(prompt_words.intersection(response_words))
    if overlap > 0:
        score += min(overlap * 0.1, 1.0)
    
    return min(score, 5.0)

def get_model_info(model_id: str) -> Dict[str, Any]:
    """Get model information."""
    models = {
        "mistral-tiny": {"name": "Mistral Tiny", "params": 7e9, "description": "Fast and efficient"},
        "mistral-small": {"name": "Mistral Small", "params": 22e9, "description": "Balanced performance"},
        # Note: mistral-medium and mistral-large require higher API tier
        # "mistral-medium": {"name": "Mistral Medium", "params": 70e9, "description": "High quality"},
        # "mistral-large": {"name": "Mistral Large", "params": 175e9, "description": "Best quality"}
    }
    
    return models.get(model_id, {"name": model_id, "params": 7e9, "description": "Unknown model"})

async def run_benchmark_task(benchmark_id: str, request: BenchmarkRequest):
    """Background task to run the benchmark."""
    try:
        running_benchmarks[benchmark_id]["status"] = "running"
        results = []
        
        for model_id in request.models:
            try:
                # Call the model
                api_response = call_mistral_api(model_id, request.prompt, request.max_tokens)
                
                # Extract data
                message = api_response['choices'][0]['message']['content']
                usage = api_response.get('usage', {})
                tokens_used = usage.get('total_tokens', request.max_tokens)
                latency_ms = api_response['_latency_ms']
                
                # Calculate metrics
                model_info = get_model_info(model_id)
                environmental = calculate_environmental_impact(tokens_used, model_info["params"])
                cost = calculate_cost(tokens_used, model_id)
                quality = assess_quality(message, request.prompt)
                tokens_per_second = tokens_used / (latency_ms / 1000) if latency_ms > 0 else 0
                
                # Create result
                result = ModelResult(
                    model_id=model_id,
                    model_name=model_info["name"],
                    response=message,
                    quality_score=quality,
                    latency_ms=latency_ms,
                    cost_usd=cost,
                    energy_wh=environmental["energy_wh"],
                    co2_g=environmental["co2_g"],
                    tokens_used=tokens_used,
                    tokens_per_second=tokens_per_second
                )
                
                results.append(result)
                
            except Exception as e:
                print(f"Error with model {model_id}: {e}")
                continue
        
        # Determine winner and insights
        winner = None
        insights = []
        
        if results:
            # Find best in each category
            best_quality = max(results, key=lambda x: x.quality_score)
            fastest = min(results, key=lambda x: x.latency_ms)
            cheapest = min(results, key=lambda x: x.cost_usd)
            greenest = min(results, key=lambda x: x.co2_g)
            
            # Simple winner logic (balanced approach)
            scores = {}
            for result in results:
                # Normalize scores (0-1) and combine
                quality_norm = result.quality_score / 5.0
                speed_norm = 1 - (result.latency_ms / max(r.latency_ms for r in results))
                cost_norm = 1 - (result.cost_usd / max(r.cost_usd for r in results)) if max(r.cost_usd for r in results) > 0 else 1
                green_norm = 1 - (result.co2_g / max(r.co2_g for r in results)) if max(r.co2_g for r in results) > 0 else 1
                
                # Balanced score
                balanced_score = (quality_norm + speed_norm + cost_norm + green_norm) / 4
                scores[result.model_id] = balanced_score
            
            winner = max(scores, key=scores.get)
            
            # Generate insights
            insights.append(f"🏆 Overall winner: {get_model_info(winner)['name']}")
            insights.append(f"🎯 Best quality: {best_quality.model_name} ({best_quality.quality_score:.2f}/5.0)")
            insights.append(f"⚡ Fastest: {fastest.model_name} ({fastest.latency_ms:.0f}ms)")
            insights.append(f"💰 Cheapest: {cheapest.model_name} (${cheapest.cost_usd:.6f})")
            insights.append(f"🌱 Greenest: {greenest.model_name} ({greenest.co2_g:.4f}g CO₂)")
        
        # Update benchmark result
        benchmark_results[benchmark_id] = BenchmarkResult(
            benchmark_id=benchmark_id,
            status="completed",
            created_at=running_benchmarks[benchmark_id]["created_at"],
            completed_at=datetime.utcnow(),
            prompt=request.prompt,
            results=results,
            winner=winner,
            insights=insights
        )
        
        # Clean up running benchmark
        del running_benchmarks[benchmark_id]
        
    except Exception as e:
        # Handle errors
        benchmark_results[benchmark_id] = BenchmarkResult(
            benchmark_id=benchmark_id,
            status="failed",
            created_at=running_benchmarks[benchmark_id]["created_at"],
            completed_at=datetime.utcnow(),
            prompt=request.prompt,
            results=[],
            insights=[f"❌ Benchmark failed: {str(e)}"]
        )
        
        if benchmark_id in running_benchmarks:
            del running_benchmarks[benchmark_id]

# API Endpoints
@app.get("/")
async def root():
    """Root endpoint with API information."""
    return {
        "name": "Benchmind API",
        "version": "0.1.0",
        "description": "AI Model Evaluation Platform with Green AI Observability",
        "status": "running",
        "endpoints": {
            "ai_consultant": "POST /ai-consultant - Get intelligent AI recommendations",
            "benchmark": "POST /benchmark - Run model comparison",
            "results": "GET /benchmark/{benchmark_id} - Get benchmark results",
            "recommend": "POST /recommend - Get model recommendation",
            "models": "GET /models - List available models"
        },
        "ai_consultant_status": "enabled" if ai_consultant else "disabled"
    }

@app.post("/ai-consultant")
async def get_ai_recommendation(request: AIConsultantRequest):
    """Get intelligent AI model recommendation using ReAct agent."""
    if not ai_consultant:
        raise HTTPException(
            status_code=503, 
            detail="AI Consultant not available. Please configure GEMINI_API_KEY and MISTRAL_API_KEY."
        )
    
    try:
        # Combine task description with user context and selected models
        full_task = request.task_description
        if request.user_context:
            full_task += f"\n\nAdditional context: {request.user_context}"
        
        # Add selected models information
        models_str = ", ".join(request.selected_models)
        full_task += f"\n\nPlease compare these specific models: {models_str}"
        
        # Get recommendation from AI consultant
        result = ai_consultant.get_recommendation(full_task)
        
        return {
            "task": request.task_description,
            "user_context": request.user_context,
            "ai_recommendation": result,
            "timestamp": datetime.utcnow().isoformat(),
            "consultant_version": "1.0"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI Consultant error: {str(e)}")

@app.post("/benchmark")
async def create_benchmark(request: BenchmarkRequest, background_tasks: BackgroundTasks):
    """Start a new benchmark comparison."""
    benchmark_id = str(uuid.uuid4())
    
    # Store initial benchmark info
    running_benchmarks[benchmark_id] = {
        "status": "queued",
        "created_at": datetime.utcnow()
    }
    
    # Start background task
    background_tasks.add_task(run_benchmark_task, benchmark_id, request)
    
    return {
        "benchmark_id": benchmark_id,
        "status": "queued",
        "message": "Benchmark started. Use the benchmark_id to check results.",
        "estimated_time_seconds": len(request.models) * 3
    }

@app.get("/benchmark/{benchmark_id}")
async def get_benchmark_results(benchmark_id: str):
    """Get benchmark results."""
    # Check if still running
    if benchmark_id in running_benchmarks:
        return {
            "benchmark_id": benchmark_id,
            "status": running_benchmarks[benchmark_id]["status"],
            "created_at": running_benchmarks[benchmark_id]["created_at"],
            "message": "Benchmark in progress..."
        }
    
    # Check completed results
    if benchmark_id in benchmark_results:
        return benchmark_results[benchmark_id]
    
    raise HTTPException(status_code=404, detail="Benchmark not found")

@app.post("/recommend")
async def get_recommendation(request: RecommendationRequest):
    """Get model recommendation based on requirements."""
    # Simple recommendation logic
    available_models = ["mistral-tiny", "mistral-small", "mistral-medium", "mistral-large"]
    
    # Filter based on constraints
    recommendations = []
    
    for model_id in available_models:
        model_info = get_model_info(model_id)
        
        # Estimate metrics for this model
        estimated_tokens = 50  # Average
        estimated_latency = 500 + (model_info["params"] / 1e9) * 50  # Rough estimate
        estimated_cost = calculate_cost(estimated_tokens, model_id)
        estimated_env = calculate_environmental_impact(estimated_tokens, model_info["params"])
        
        # Check constraints
        meets_constraints = True
        if "max_latency_ms" in request.constraints and estimated_latency > request.constraints["max_latency_ms"]:
            meets_constraints = False
        if "max_cost_usd" in request.constraints and estimated_cost > request.constraints["max_cost_usd"]:
            meets_constraints = False
        if "max_co2_g" in request.constraints and estimated_env["co2_g"] > request.constraints["max_co2_g"]:
            meets_constraints = False
        
        if meets_constraints:
            score = 0
            if request.optimization_goal == "speed":
                score = 1000 / estimated_latency
            elif request.optimization_goal == "cost":
                score = 1 / estimated_cost if estimated_cost > 0 else 1000
            elif request.optimization_goal == "green":
                score = 1 / estimated_env["co2_g"] if estimated_env["co2_g"] > 0 else 1000
            else:  # balanced
                score = (1000 / estimated_latency) + (1 / estimated_cost) + (1 / estimated_env["co2_g"])
            
            recommendations.append({
                "model_id": model_id,
                "model_name": model_info["name"],
                "score": score,
                "estimated_latency_ms": estimated_latency,
                "estimated_cost_usd": estimated_cost,
                "estimated_co2_g": estimated_env["co2_g"],
                "reasoning": f"Optimized for {request.optimization_goal}"
            })
    
    if not recommendations:
        raise HTTPException(status_code=400, detail="No models meet the specified constraints")
    
    # Sort by score
    recommendations.sort(key=lambda x: x["score"], reverse=True)
    
    return {
        "recommended_model": recommendations[0],
        "alternatives": recommendations[1:3],
        "optimization_goal": request.optimization_goal,
        "constraints_applied": request.constraints
    }

@app.get("/models")
async def list_models():
    """List available models."""
    if ai_consultant:
        # Get dynamic model list from AI consultant
        return ai_consultant.get_available_models()
    else:
        # Fallback to static list
        models = []
        for model_id in ["mistral-tiny", "mistral-small"]:
            info = get_model_info(model_id)
            models.append({
                "id": model_id,
                "name": info["name"],
                "parameters": info["params"],
                "description": info["description"],
                "provider": "mistral"
            })
        
        return {"available_models": models, "total_count": len(models), "providers": ["mistral"]}

@app.get("/health")
async def health_check():
    """Health check endpoint."""
    mistral_key = os.getenv('MISTRAL_API_KEY')
    
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow(),
        "mistral_api_configured": bool(mistral_key),
        "active_benchmarks": len(running_benchmarks),
        "completed_benchmarks": len(benchmark_results)
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
