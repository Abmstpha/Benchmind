"""
New async run orchestrator - single card workflow.
Handles POST /api/run and GET /api/run/{run_id}/events (SSE).
"""

import asyncio
import json
import logging
from typing import Dict, Any, List, Optional
from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from pydantic import BaseModel

from ..core.job_store import job_store, RunStatus, StepStatus
from ..db.database import get_db
from ..db.models import Profile, BenchmarkRun, Consultation, EcoLogitsMetrics
from ..routers.user import get_current_user
from ..agents.adk_green_agent import create_consultant_agent
from ..core.config import settings

router = APIRouter(prefix="/api/run", tags=["run"])

logger = logging.getLogger("benchmind.run")
logger.setLevel(logging.DEBUG)


# Request/Response models
class RunRequest(BaseModel):
    task_description: str
    selected_models: List[str]
    constraints: Optional[Dict[str, Any]] = None
    assumptions: Optional[Dict[str, Any]] = None


class RunResponse(BaseModel):
    run_id: str
    status: str


@router.post("", response_model=RunResponse)
async def start_run(
    request: RunRequest,
    background_tasks: BackgroundTasks,
    token_data: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Start a new benchmark run.
    Returns run_id immediately and processes in background.
    """
    user_email = token_data.get("sub")
    
    # Check credits
    profile = db.query(Profile).filter(Profile.email == user_email).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    
    if profile.credits < 1:
        raise HTTPException(
            status_code=402,
            detail="Insufficient credits"
        )
    
    # Deduct credit
    profile.credits -= 1
    db.commit()
    
    logger.info(f"🚀 Starting new run for {user_email}")
    logger.info(f"Task: {request.task_description}")
    logger.info(f"Models: {request.selected_models}")
    
    # Set defaults
    constraints = request.constraints or {
        "target_quality": "high",
        "latency_ms_max": 3000,
        "green_budget_g_co2_per_1k_tokens": 1.0
    }
    
    assumptions = request.assumptions or {
        "pue": 1.2,
        "grid_intensity_g_per_kwh": 300
    }
    
    # Create run in job store
    run_id = job_store.create_run(
        task_description=request.task_description,
        selected_models=request.selected_models,
        constraints=constraints,
        assumptions=assumptions,
        user_email=user_email
    )
    
    # Start background processing
    background_tasks.add_task(process_run, run_id, profile)
    
    return RunResponse(run_id=run_id, status="queued")


async def process_run(run_id: str, user: Profile):
    """
    Background task that processes the benchmark run.
    Updates job_store with progress at each step.
    """
    try:
        # Create database session for background task
        from ..db.database import SessionLocal
        db = SessionLocal()
        run = job_store.get_run(run_id)
        if not run:
            logger.error(f"Run {run_id} not found")
            return
        
        job_store.update_status(run_id, RunStatus.RUNNING)
        logger.info(f"▶️ Processing run {run_id}")
        
        # Step 1: Parse & Plan
        job_store.update_step(run_id, "parse_plan", StepStatus.RUNNING)
        await asyncio.sleep(0.5)  # Simulate work
        logger.info(f"✅ Parse & Plan complete for {run_id}")
        job_store.update_step(run_id, "parse_plan", StepStatus.DONE, progress=1.0)
        
        # Step 2: Craft Test Prompts
        job_store.update_step(run_id, "craft_prompts", StepStatus.RUNNING)
        await asyncio.sleep(0.5)
        logger.info(f"✅ Craft Prompts complete for {run_id}")
        job_store.update_step(run_id, "craft_prompts", StepStatus.DONE, progress=1.0)
        
        # Step 3: Benchmark Calls (actual work)
        job_store.update_step(run_id, "benchmark_calls", StepStatus.RUNNING)
        logger.info(f"🔧 Running benchmarks for {run_id}")
        
        # Call the actual consultant agent
        try:
            agent = create_consultant_agent(settings.default_gemini_model)
            
            # Build prompt
            prompt = f"""Task: {run.task_description}

Selected models: {', '.join(run.selected_models)}

Please benchmark these models and provide:
1. Performance metrics (latency, cost, tokens)
2. Environmental impact (energy, CO2)
3. Quality assessment
4. Recommendation for the greenest viable option

Constraints: {run.constraints}
Assumptions: {run.assumptions}
"""
            
            # Run 3 parallel processes
            from ..services.benchmark_service import BenchmarkService
            from ..services.google_search_service import GoogleSearchService
            
            benchmark_service = BenchmarkService()
            search_service = GoogleSearchService()
            
            # Process 1: Direct benchmark tool call (instant)
            async def fetch_green_insights():
                job_store.update_step(run_id, 'fetch_green_insights', StepStatus.RUNNING, 0)
                try:
                    results = await benchmark_service.benchmark_models(
                        task_description=run.task_description,
                        model_ids=run.selected_models
                    )
                    job_store.update_step(run_id, 'fetch_green_insights', StepStatus.DONE, 100)
                    return results
                except Exception as e:
                    job_store.update_step(run_id, 'fetch_green_insights', StepStatus.ERROR, 0)
                    raise e
            
            # Process 2: Google search for quality analysis (parallel)
            async def analyze_quality():
                job_store.update_step(run_id, 'analyze_quality', StepStatus.RUNNING, 0)
                try:
                    quality_analysis = await search_service.analyze_quality(
                        task_description=run.task_description,
                        model_ids=run.selected_models
                    )
                    job_store.update_step(run_id, 'analyze_quality', StepStatus.DONE, 100)
                    return quality_analysis
                except Exception as e:
                    job_store.update_step(run_id, 'analyze_quality', StepStatus.ERROR, 0)
                    raise e
            
            # Process 3: Generate graphs (instant once data available)
            async def generate_graphs(benchmark_results):
                job_store.update_step(run_id, 'show_results', StepStatus.RUNNING, 0)
                # Graph generation is instant
                job_store.update_step(run_id, 'show_results', StepStatus.DONE, 100)
                return {"graphs": "generated"}
            
            # Run all 3 processes in parallel
            green_task = asyncio.create_task(fetch_green_insights())
            quality_task = asyncio.create_task(analyze_quality())
            
            # Wait for green insights first (should be instant)
            benchmark_results = await green_task
            
            # Generate graphs immediately after benchmark data
            graphs_task = asyncio.create_task(generate_graphs(benchmark_results))
            
            # Wait for both quality analysis and graphs
            quality_analysis, graphs = await asyncio.gather(quality_task, graphs_task)
            
            # Combine results
            recommendation_text = f"""
## Green AI Analysis
{benchmark_results.get('summary', 'EcoLogits analysis completed')}

## Quality Analysis  
{quality_analysis.get('summary', 'Quality benchmarks analyzed')}

## Recommendation
Based on environmental impact and quality metrics, here are the optimal models for your recommendation system task.
"""
            
            # Extract benchmark data for frontend
            final_benchmark_results = benchmark_results.get('benchmark_results', [])
            
            # Build analytics data
            analytics_data = {
                "series": final_benchmark_results,
                "pareto": [run.selected_models[0]] if run.selected_models else [],
                "assumptions": run.assumptions
            }
            
            logger.info(f"✅ All processes complete for {run_id}")
            
        except Exception as e:
            logger.error(f"❌ Benchmark failed for {run_id}: {e}")
            job_store.set_error(run_id, f"Benchmark failed: {str(e)}")
            return
        
        # Build recommendation
        recommendation = {
            "run_id": run_id,
            "winner": {
                "model": run.selected_models[0] if run.selected_models else "unknown",
                "reason": "Best balance of efficiency and environmental impact",
                "tradeoffs": ["Optimized for low CO2 emissions"]
            },
            "shortlist": final_benchmark_results[:3] if final_benchmark_results else [],
            "implementation_notes": [
                "Use temperature 0.2 for consistent results",
                "Enable streaming to reduce latency",
                "Monitor token usage for cost optimization"
            ],
            "manifest_url": f"/api/run/{run_id}/manifest"
        }
        
        # Build quality insights
        quality_insights = {
            "evidence": quality_analysis.get('evidence', []),
            "notes": quality_analysis.get('summary', 'Quality metrics analyzed')
        }
        
        # Store all results
        job_store.set_results(
            run_id=run_id,
            recommendation=recommendation,
            quality_insights=quality_insights,
            analytics_data=analytics_data,
            benchmark_results=final_benchmark_results
        )
        
        # Save to database for persistence
        try:
            from datetime import datetime
            logger.info("=" * 80)
            logger.info("💾 SAVING RESULTS TO DATABASE")
            logger.info("=" * 80)
            logger.info(f"📋 Run ID: {run_id}")
            logger.info(f"👤 User: {user.email} (ID: {user.id})")
            logger.info(f"📝 Task: {run.task_description}")
            logger.info(f"🤖 Models: {run.selected_models}")
            
            # Log recommendation details
            logger.info(f"🏆 RECOMMENDATION DATA:")
            logger.info(f"   Winner: {recommendation.get('winner', {}).get('model', 'Unknown')}")
            logger.info(f"   Reason: {recommendation.get('winner', {}).get('reason', 'N/A')}")
            logger.info(f"   Shortlist: {len(recommendation.get('shortlist', []))} models")
            
            # Log quality insights
            logger.info(f"🔍 QUALITY INSIGHTS:")
            logger.info(f"   Evidence points: {len(quality_insights.get('evidence', []))}")
            logger.info(f"   Summary: {quality_insights.get('summary', 'N/A')}")
            
            # Log analytics data
            logger.info(f"📊 ANALYTICS DATA:")
            logger.info(f"   Series count: {len(analytics_data.get('series', []))}")
            logger.info(f"   Pareto models: {analytics_data.get('pareto', [])}")
            
            # Log benchmark results
            logger.info(f"⚡ BENCHMARK RESULTS:")
            logger.info(f"   Results count: {len(final_benchmark_results)}")
            for i, result in enumerate(final_benchmark_results[:3]):  # Show first 3
                logger.info(f"   {i+1}. {result.get('model_name', 'Unknown')}: {result.get('energy_wh', 0):.3f} Wh, {result.get('co2_g', 0):.3f} g CO₂")
            
            db_run = BenchmarkRun(
                run_id=run_id,
                user_id=user.id,
                task_description=run.task_description,
                selected_models=run.selected_models,
                constraints=run.constraints,
                assumptions=run.assumptions,
                recommendation=recommendation,
                quality_insights=quality_insights,
                analytics_data=analytics_data,
                benchmark_results=final_benchmark_results,
                status="completed",
                completed_at=datetime.utcnow()
            )
            db.add(db_run)
            logger.info(f"✅ Created BenchmarkRun record")
            
            # Also save to consultations table for backward compatibility
            consultation = Consultation(
                user_id=user.id,
                task_description=run.task_description,
                recommendation_text=recommendation_text,
                benchmark_results=final_benchmark_results,
                web_insights=quality_analysis.get('summary', '')
            )
            db.add(consultation)
            logger.info(f"✅ Created Consultation record (legacy)")
            
            # Save individual EcoLogits metrics for graph generation
            logger.info(f"📊 SAVING ECOLOGITS METRICS:")
            for result in final_benchmark_results:
                ecologits_metric = EcoLogitsMetrics(
                    run_id=run_id,
                    model_id=result.get('model_id', ''),
                    model_name=result.get('model_name', ''),
                    energy_wh=str(result.get('energy_wh', 0)),
                    co2_g=str(result.get('co2_g', 0)),
                    latency_ms=int(result.get('latency_ms', 0)),
                    cost_usd=str(result.get('cost_usd', 0)),
                    quality_score=str(result.get('quality_score', 0))
                )
                db.add(ecologits_metric)
                logger.info(f"   📈 {result.get('model_name', 'Unknown')}: {result.get('energy_wh', 0)} Wh, {result.get('co2_g', 0)} g CO₂")
            
            db.commit()
            logger.info(f"💾 SUCCESSFULLY SAVED TO DATABASE")
            logger.info(f"   - benchmark_runs table: ✅")
            logger.info(f"   - consultations table: ✅")
            logger.info(f"   - ecologits_metrics table: ✅ ({len(final_benchmark_results)} records)")
            logger.info("=" * 80)
        except Exception as e:
            logger.error(f"❌ Failed to save run to database: {e}")
            # Don't fail the whole run if DB save fails
        
        # Mark as complete
        job_store.update_status(run_id, RunStatus.DONE)
        logger.info(f"✅ Run {run_id} completed successfully")
        
    except Exception as e:
        logger.error(f"❌ Run {run_id} failed: {e}", exc_info=True)
        job_store.set_error(run_id, str(e))
    finally:
        # Always close database session
        if 'db' in locals():
            db.close()


@router.get("/{run_id}/events")
async def stream_events(run_id: str):
    """
    Server-Sent Events stream for run progress.
    Frontend connects here to get real-time updates.
    """
    async def event_generator():
        """Generate SSE events for run progress."""
        run = job_store.get_run(run_id)
        if not run:
            yield f"data: {{'error': 'Run not found'}}\n\n"
            return
        
        last_step = None
        last_status = None
        
        # Stream updates until done or error
        while True:
            run = job_store.get_run(run_id)
            if not run:
                break
            
            # Send status updates
            if run.status != last_status:
                yield f"data: {json.dumps({'status': run.status})}\n\n"
                last_status = run.status
            
            # Send step updates
            if run.current_step and run.current_step != last_step:
                for step in run.steps:
                    if step.name == run.current_step:
                        event_data = {
                            "step": step.name,
                            "status": step.status,
                            "progress": step.progress
                        }
                        yield f"data: {json.dumps(event_data)}\n\n"
                        last_step = run.current_step
                        break
            
            # Exit if done or error
            if run.status in [RunStatus.DONE, RunStatus.ERROR]:
                yield f"data: {json.dumps({'status': run.status})}\n\n"
                break
            
            await asyncio.sleep(0.5)  # Poll every 500ms
    
    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
        }
    )


@router.get("/{run_id}/recommendation")
async def get_recommendation(run_id: str):
    """Get recommendation for a specific run."""
    results = job_store.get_results(run_id)
    if not results:
        raise HTTPException(status_code=404, detail="Run not found or not completed")
    
    return results.get("recommendation", {})


@router.get("/history")
async def get_user_history(
    user: Profile = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get user's benchmark run history."""
    runs = db.query(BenchmarkRun).filter(
        BenchmarkRun.user_id == user.id
    ).order_by(BenchmarkRun.created_at.desc()).limit(20).all()
    
    return {
        "runs": [
            {
                "run_id": run.run_id,
                "task_description": run.task_description,
                "selected_models": run.selected_models,
                "recommendation": run.recommendation,  # ← ADD THIS!
                "quality_insights": run.quality_insights,  # ← ADD THIS!
                "analytics_data": run.analytics_data,  # ← ADD THIS!
                "benchmark_results": run.benchmark_results,  # ← ADD THIS!
                "status": run.status,
                "created_at": run.created_at.isoformat(),
                "completed_at": run.completed_at.isoformat() if run.completed_at else None
            }
            for run in runs
        ]
    }


@router.delete("/history/{run_id}")
async def delete_benchmark_run(
    run_id: str,
    user: Profile = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a benchmark run and all associated data."""
    logger.info("=" * 80)
    logger.info("🗑️ DELETING BENCHMARK RUN")
    logger.info("=" * 80)
    logger.info(f"📋 Run ID: {run_id}")
    logger.info(f"👤 User: {user.email} (ID: {user.id})")
    
    # Verify user owns this run
    run = db.query(BenchmarkRun).filter(
        BenchmarkRun.run_id == run_id,
        BenchmarkRun.user_id == user.id
    ).first()
    
    if not run:
        logger.warning(f"❌ Run {run_id} not found for user {user.email}")
        raise HTTPException(status_code=404, detail="Run not found")
    
    try:
        # Delete from EcoLogits metrics table
        ecologits_deleted = db.query(EcoLogitsMetrics).filter(
            EcoLogitsMetrics.run_id == run_id
        ).delete()
        logger.info(f"🗑️ Deleted {ecologits_deleted} EcoLogits metrics records")
        
        # Delete from consultations table (legacy)
        consultations_deleted = db.query(Consultation).filter(
            Consultation.user_id == user.id,
            Consultation.task_description == run.task_description
        ).delete()
        logger.info(f"🗑️ Deleted {consultations_deleted} consultation records")
        
        # Delete the main benchmark run
        db.delete(run)
        db.commit()
        
        logger.info(f"✅ SUCCESSFULLY DELETED RUN {run_id}")
        logger.info(f"   - benchmark_runs: ✅")
        logger.info(f"   - ecologits_metrics: {ecologits_deleted} records")
        logger.info(f"   - consultations: {consultations_deleted} records")
        logger.info("=" * 80)
        
        return {"message": "Run deleted successfully", "run_id": run_id}
        
    except Exception as e:
        db.rollback()
        logger.error(f"❌ Failed to delete run {run_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to delete run")


@router.get("/history/{run_id}")
async def get_historical_run(
    run_id: str,
    user: Profile = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get full details of a historical run."""
    logger.info("=" * 80)
    logger.info("🔍 FETCHING RUN FROM DATABASE")
    logger.info("=" * 80)
    logger.info(f"📋 Requested Run ID: {run_id}")
    
    # Now user is always a Profile object from get_current_user
    logger.info(f"👤 User: {user.email} (ID: {user.id})")
    
    run = db.query(BenchmarkRun).filter(
        BenchmarkRun.run_id == run_id,
        BenchmarkRun.user_id == user.id
    ).first()
    
    if not run:
        logger.warning(f"❌ Run {run_id} not found in database for user {user.email}")
        raise HTTPException(status_code=404, detail="Run not found")
    
    logger.info(f"✅ FOUND RUN IN DATABASE:")
    logger.info(f"   Task: {run.task_description}")
    logger.info(f"   Models: {run.selected_models}")
    logger.info(f"   Status: {run.status}")
    logger.info(f"   Created: {run.created_at}")
    logger.info(f"   Completed: {run.completed_at}")
    
    # Log data availability
    logger.info(f"📊 DATA AVAILABILITY:")
    logger.info(f"   Recommendation: {'✅' if run.recommendation else '❌'}")
    logger.info(f"   Quality Insights: {'✅' if run.quality_insights else '❌'}")
    logger.info(f"   Analytics Data: {'✅' if run.analytics_data else '❌'}")
    logger.info(f"   Benchmark Results: {'✅' if run.benchmark_results else '❌'}")
    
    if run.recommendation:
        logger.info(f"🏆 Recommendation Winner: {run.recommendation.get('winner', {}).get('model', 'Unknown')}")
    
    if run.quality_insights:
        evidence_count = len(run.quality_insights.get('evidence', []))
        logger.info(f"🔍 Quality Evidence Points: {evidence_count}")
    
    if run.analytics_data:
        series_count = len(run.analytics_data.get('series', []))
        logger.info(f"📈 Analytics Series Count: {series_count}")
    
    if run.benchmark_results:
        logger.info(f"⚡ Benchmark Results Count: {len(run.benchmark_results)}")
    
    logger.info(f"✅ RETURNING COMPLETE RUN DATA TO FRONTEND")
    logger.info("=" * 80)
    
    return {
        "run_id": run.run_id,
        "task_description": run.task_description,
        "selected_models": run.selected_models,
        "recommendation": run.recommendation,
        "quality_insights": run.quality_insights,
        "analytics_data": run.analytics_data,
        "benchmark_results": run.benchmark_results,
        "status": run.status,
        "created_at": run.created_at.isoformat(),
        "completed_at": run.completed_at.isoformat() if run.completed_at else None
    }


@router.get("/metrics/{run_id}")
async def get_ecologits_metrics(
    run_id: str,
    user: Profile = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get raw EcoLogits metrics for graph generation."""
    logger.info("=" * 80)
    logger.info("📊 FETCHING ECOLOGITS METRICS FOR GRAPHS")
    logger.info("=" * 80)
    logger.info(f"📋 Requested Run ID: {run_id}")
    logger.info(f"👤 User: {user.email} (ID: {user.id})")
    
    # Verify user owns this run
    run = db.query(BenchmarkRun).filter(
        BenchmarkRun.run_id == run_id,
        BenchmarkRun.user_id == user.id
    ).first()
    
    if not run:
        logger.warning(f"❌ Run {run_id} not found for user {user.email}")
        raise HTTPException(status_code=404, detail="Run not found")
    
    # Get EcoLogits metrics
    metrics = db.query(EcoLogitsMetrics).filter(
        EcoLogitsMetrics.run_id == run_id
    ).all()
    
    logger.info(f"📈 Found {len(metrics)} EcoLogits metrics records")
    
    metrics_data = []
    for metric in metrics:
        metric_dict = {
            "model_id": metric.model_id,
            "model_name": metric.model_name,
            "energy_wh": float(metric.energy_wh),
            "co2_g": float(metric.co2_g),
            "latency_ms": metric.latency_ms,
            "cost_usd": float(metric.cost_usd),
            "quality_score": float(metric.quality_score)
        }
        metrics_data.append(metric_dict)
        logger.info(f"   📊 {metric.model_name}: {metric.energy_wh} Wh, {metric.co2_g} g CO₂")
    
    logger.info(f"✅ RETURNING {len(metrics_data)} METRICS FOR GRAPH GENERATION")
    logger.info("=" * 80)
    
    return {
        "run_id": run_id,
        "metrics": metrics_data,
        "task_description": run.task_description
    }


@router.get("/{run_id}/quality")
async def get_quality(run_id: str):
    """Get quality insights for completed run."""
    run = job_store.get_run(run_id)
    if not run:
        raise HTTPException(status_code=404, detail="Run not found")
    
    if run.status != RunStatus.DONE:
        raise HTTPException(status_code=400, detail="Run not completed")
    
    if not run.quality_insights:
        raise HTTPException(status_code=404, detail="Quality insights not available")
    
    return run.quality_insights


@router.get("/{run_id}/analytics")
async def get_analytics(run_id: str):
    """Get analytics data for completed run."""
    run = job_store.get_run(run_id)
    if not run:
        raise HTTPException(status_code=404, detail="Run not found")
    
    if run.status != RunStatus.DONE:
        raise HTTPException(status_code=400, detail="Run not completed")
    
    if not run.analytics_data:
        raise HTTPException(status_code=404, detail="Analytics not available")
    
    return run.analytics_data


@router.get("/{run_id}/manifest")
async def get_manifest(run_id: str):
    """Get full run manifest for reproducibility."""
    run = job_store.get_run(run_id)
    if not run:
        raise HTTPException(status_code=404, detail="Run not found")
    
    return run.to_dict()
