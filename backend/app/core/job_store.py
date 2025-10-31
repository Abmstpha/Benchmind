"""
In-memory job store for async benchmark runs.
Tracks run status, progress, and results.
"""

import uuid
from datetime import datetime
from typing import Dict, Any, Optional, List
from enum import Enum
from dataclasses import dataclass, field, asdict


class RunStatus(str, Enum):
    QUEUED = "queued"
    RUNNING = "running"
    DONE = "done"
    ERROR = "error"


class StepStatus(str, Enum):
    PENDING = "pending"
    RUNNING = "running"
    DONE = "done"
    ERROR = "error"


@dataclass
class RunStep:
    name: str
    status: StepStatus = StepStatus.PENDING
    progress: float = 0.0
    error: Optional[str] = None
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None


@dataclass
class BenchmarkRun:
    run_id: str
    status: RunStatus
    project_name: str
    task_description: str
    selected_models: List[str]
    constraints: Dict[str, Any]
    assumptions: Dict[str, Any]
    user_email: str
    created_at: datetime
    
    # Progress tracking
    current_step: Optional[str] = None
    steps: List[RunStep] = field(default_factory=list)
    
    # Results
    recommendation: Optional[Dict[str, Any]] = None
    quality_insights: Optional[Dict[str, Any]] = None
    analytics_data: Optional[Dict[str, Any]] = None
    benchmark_results: Optional[List[Dict[str, Any]]] = None
    
    # Error handling
    error_message: Optional[str] = None
    completed_at: Optional[datetime] = None
    
    def to_dict(self) -> Dict[str, Any]:
        data = asdict(self)
        # Convert datetime to ISO strings
        data['created_at'] = self.created_at.isoformat()
        if self.completed_at:
            data['completed_at'] = self.completed_at.isoformat()
        return data


class JobStore:
    """In-memory store for benchmark runs. Replace with Redis/DB in production."""
    
    def __init__(self):
        self._runs: Dict[str, BenchmarkRun] = {}
    
    def create_run(
        self,
        project_name: str,
        task_description: str,
        selected_models: List[str],
        constraints: Dict[str, Any],
        assumptions: Dict[str, Any],
        user_email: str
    ) -> str:
        """Create a new benchmark run and return run_id."""
        run_id = str(uuid.uuid4())
        
        # Initialize steps
        steps = [
            RunStep(name="parse_plan"),
            RunStep(name="craft_prompts"),
            RunStep(name="benchmark_calls"),
            RunStep(name="eco_metrics"),
            RunStep(name="web_evidence"),
            RunStep(name="pareto_scoring"),
            RunStep(name="assemble_results"),
        ]
        
        run = BenchmarkRun(
            run_id=run_id,
            status=RunStatus.QUEUED,
            project_name=project_name,
            task_description=task_description,
            selected_models=selected_models,
            constraints=constraints,
            assumptions=assumptions,
            user_email=user_email,
            created_at=datetime.utcnow(),
            steps=steps
        )
        
        self._runs[run_id] = run
        return run_id
    
    def get_run(self, run_id: str) -> Optional[BenchmarkRun]:
        """Get run by ID."""
        return self._runs.get(run_id)
    
    def update_status(self, run_id: str, status: RunStatus):
        """Update run status."""
        if run := self._runs.get(run_id):
            run.status = status
            if status in [RunStatus.DONE, RunStatus.ERROR]:
                run.completed_at = datetime.utcnow()
    
    def update_step(
        self,
        run_id: str,
        step_name: str,
        status: StepStatus,
        progress: float = 0.0,
        error: Optional[str] = None
    ):
        """Update step status and progress."""
        if run := self._runs.get(run_id):
            run.current_step = step_name
            
            # Find and update step
            for step in run.steps:
                if step.name == step_name:
                    step.status = status
                    step.progress = progress
                    step.error = error
                    
                    if status == StepStatus.RUNNING and not step.started_at:
                        step.started_at = datetime.utcnow()
                    elif status in [StepStatus.DONE, StepStatus.ERROR]:
                        step.completed_at = datetime.utcnow()
                    break
    
    def set_results(
        self,
        run_id: str,
        recommendation: Optional[Dict[str, Any]] = None,
        quality_insights: Optional[Dict[str, Any]] = None,
        analytics_data: Optional[Dict[str, Any]] = None,
        benchmark_results: Optional[List[Dict[str, Any]]] = None
    ):
        """Store results for a run."""
        if run := self._runs.get(run_id):
            if recommendation:
                run.recommendation = recommendation
            if quality_insights:
                run.quality_insights = quality_insights
            if analytics_data:
                run.analytics_data = analytics_data
            if benchmark_results:
                run.benchmark_results = benchmark_results
    
    def set_error(self, run_id: str, error_message: str):
        """Set error state for a run."""
        if run := self._runs.get(run_id):
            run.status = RunStatus.ERROR
            run.error_message = error_message
            run.completed_at = datetime.utcnow()


# Global singleton
job_store = JobStore()
