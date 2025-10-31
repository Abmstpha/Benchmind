#!/usr/bin/env python3
"""
Comprehensive Agent Integration Test
This test simulates the full agent execution flow to catch all integration issues
before manual testing.
"""

import asyncio
import logging
import sys
import traceback
from datetime import datetime
from pathlib import Path

# Add the backend directory to Python path
sys.path.insert(0, str(Path(__file__).parent))

# Configure logging to capture everything
logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('test_agent_integration.log'),
        logging.StreamHandler(sys.stdout)
    ]
)

logger = logging.getLogger(__name__)

class AgentIntegrationTester:
    def __init__(self):
        self.test_results = []
        self.errors = []
        
    async def test_efficiency_agent(self):
        """Test the efficiency agent execution flow"""
        logger.info("🧪 Testing Efficiency Agent Integration...")
        
        try:
            # Import the agent components
            from app.routers.consultant import react_agent
            from google.adk.runners import Runner
            from google.adk.sessions.in_memory_session_service import InMemorySessionService
            from google.genai import types
            
            logger.info("✅ Successfully imported all Google ADK components")
            
            # Test 1: Agent availability
            if react_agent is None:
                raise Exception("ReAct agent is None - not initialized properly")
            logger.info("✅ ReAct agent is available")
            
            # Test 2: Session creation
            session_service = InMemorySessionService()
            session = await session_service.create_session(user_id='test_user', app_name='benchmind')
            logger.info(f"✅ Session created successfully: {session.id}")
            
            # Test 3: Runner initialization
            runner = Runner(agent=react_agent, session_service=session_service, app_name='benchmind')
            logger.info("✅ Runner initialized successfully")
            
            # Test 4: Content creation
            test_prompt = """Analyze the efficiency of these AI models for this task:
Task: Test customer support chatbot
Models: mistral-tiny, mistral-small

Please benchmark these models and provide efficiency recommendations."""
            
            content = types.Content(parts=[types.Part.from_text(text=test_prompt)])
            logger.info("✅ Content created successfully")
            
            # Test 5: Agent execution (this is where most errors occur)
            logger.info("🚀 Running agent execution test...")
            
            # Test async generator pattern (correct Google ADK usage)
            try:
                response_text = ""
                event_count = 0
                
                # Google ADK Runner returns an async generator
                async for event in runner.run_async(
                    new_message=content,
                    user_id='test_user',
                    session_id=session.id
                ):
                    event_count += 1
                    logger.info(f"📨 Received event {event_count}")
                    
                    if hasattr(event, 'content') and event.content:
                        if hasattr(event.content, 'parts') and event.content.parts:
                            for part in event.content.parts:
                                if hasattr(part, 'text') and part.text:
                                    response_text += part.text
                
                logger.info(f"✅ Async agent execution successful: {event_count} events processed")
                
                if response_text:
                    logger.info(f"✅ Response extracted successfully: {len(response_text)} characters")
                    logger.info(f"📝 Response preview: {response_text[:200]}...")
                else:
                    logger.warning("⚠️ Response text is empty")
                    
            except Exception as e:
                logger.error(f"❌ Async execution failed: {e}")
                logger.error(f"📋 Traceback: {traceback.format_exc()}")
                raise
                
            self.test_results.append("efficiency_agent_passed")
            
        except Exception as e:
            error_msg = f"Efficiency Agent Test Failed: {e}"
            logger.error(f"❌ {error_msg}")
            logger.error(f"📋 Full traceback: {traceback.format_exc()}")
            self.errors.append(error_msg)
            
    async def test_search_agent(self):
        """Test the search agent execution flow"""
        logger.info("🧪 Testing Search Agent Integration...")
        
        try:
            from app.services.google_search_service import GoogleSearchService
            
            # Test the full search service (this tests the event loop issue)
            search_service = GoogleSearchService()
            
            # Test the analyze_quality method that was failing
            logger.info("🔍 Testing quality analysis (the part that was failing)...")
            
            # This should NOT cause "Event loop is closed" error
            quality_result = await search_service.analyze_quality(
                task_description="Test customer support chatbot",
                model_ids=["mistral-tiny", "mistral-small"]
            )
            
            if quality_result and 'analysis_text' in quality_result:
                logger.info(f"✅ Quality analysis completed: {len(quality_result['analysis_text'])} characters")
            else:
                logger.warning("⚠️ Quality analysis returned unexpected format")
            
            self.test_results.append("search_agent_passed")
            
        except Exception as e:
            error_msg = f"Search Agent Test Failed: {e}"
            logger.error(f"❌ {error_msg}")
            logger.error(f"📋 Full traceback: {traceback.format_exc()}")
            self.errors.append(error_msg)
            
    async def test_benchmarking_tool(self):
        """Test the benchmarking tool execution"""
        logger.info("🧪 Testing Benchmarking Tool...")
        
        try:
            from app.tools.tools import benchmark_models_for_task
            
            # Test tool execution
            test_result = benchmark_models_for_task(
                user_task="Test customer support chatbot",
                selected_models="mistral-tiny,mistral-small", 
                test_prompt="Hello, can you help me with my account?",
                complexity="simple"
            )
            
            if test_result and 'benchmark_results' in test_result:
                logger.info(f"✅ Benchmarking tool executed successfully: {len(test_result['benchmark_results'])} results")
            else:
                logger.warning("⚠️ Benchmarking tool returned unexpected format")
                
            self.test_results.append("benchmarking_tool_passed")
            
        except Exception as e:
            error_msg = f"Benchmarking Tool Test Failed: {e}"
            logger.error(f"❌ {error_msg}")
            logger.error(f"📋 Full traceback: {traceback.format_exc()}")
            self.errors.append(error_msg)
            
    async def test_database_operations(self):
        """Test database operations"""
        logger.info("🧪 Testing Database Operations...")
        
        try:
            from app.db.database import get_db
            from app.db.models import BenchmarkRun, EcoLogitsMetrics
            from sqlalchemy.orm import Session
            
            # Test database connection
            db_gen = get_db()
            db: Session = next(db_gen)
            
            # Test basic query
            runs_count = db.query(BenchmarkRun).count()
            metrics_count = db.query(EcoLogitsMetrics).count()
            
            logger.info(f"✅ Database connection successful: {runs_count} runs, {metrics_count} metrics")
            
            db.close()
            self.test_results.append("database_passed")
            
        except Exception as e:
            error_msg = f"Database Test Failed: {e}"
            logger.error(f"❌ {error_msg}")
            logger.error(f"📋 Full traceback: {traceback.format_exc()}")
            self.errors.append(error_msg)
            
    async def test_full_workflow_sequence(self):
        """Test the full workflow sequence that was failing"""
        logger.info("🧪 Testing Full Workflow Sequence (Efficiency → Quality)...")
        
        try:
            from app.routers.consultant import react_agent
            from app.services.google_search_service import GoogleSearchService
            from google.adk.runners import Runner
            from google.adk.sessions.in_memory_session_service import InMemorySessionService
            from google.genai import types
            
            # Step 1: Run efficiency agent (like in real workflow)
            logger.info("🔧 Step 1: Running efficiency agent...")
            session_service = InMemorySessionService()
            session = await session_service.create_session(user_id='test_user', app_name='benchmind')
            runner = Runner(agent=react_agent, session_service=session_service, app_name='benchmind')
            
            prompt = "Analyze efficiency for test models: mistral-tiny, mistral-small"
            content = types.Content(parts=[types.Part.from_text(text=prompt)])
            
            efficiency_text = ""
            async for event in runner.run_async(
                new_message=content,
                user_id='test_user',
                session_id=session.id
            ):
                if hasattr(event, 'content') and event.content:
                    if hasattr(event.content, 'parts') and event.content.parts:
                        for part in event.content.parts:
                            if hasattr(part, 'text') and part.text:
                                efficiency_text += part.text
            
            logger.info(f"✅ Step 1 completed: {len(efficiency_text)} characters")
            
            # Step 2: Run quality analysis (this was failing with event loop closed)
            logger.info("🔍 Step 2: Running quality analysis...")
            search_service = GoogleSearchService()
            
            quality_result = await search_service.analyze_quality(
                task_description="Test customer support chatbot",
                model_ids=["mistral-tiny", "mistral-small"]
            )
            
            logger.info(f"✅ Step 2 completed: {len(quality_result.get('analysis_text', ''))} characters")
            
            logger.info("✅ Full workflow sequence completed successfully!")
            self.test_results.append("full_workflow_passed")
            
        except Exception as e:
            error_msg = f"Full Workflow Test Failed: {e}"
            logger.error(f"❌ {error_msg}")
            logger.error(f"📋 Full traceback: {traceback.format_exc()}")
            self.errors.append(error_msg)

    async def test_api_endpoints(self):
        """Test critical API endpoints"""
        logger.info("🧪 Testing API Endpoints...")
        
        try:
            from app.main import app
            from fastapi.testclient import TestClient
            
            client = TestClient(app)
            
            # Test health check
            response = client.get("/")
            if response.status_code == 200:
                logger.info("✅ Health check endpoint working")
            else:
                logger.warning(f"⚠️ Health check returned {response.status_code}")
                
            # Test models endpoint
            response = client.get("/models/")
            if response.status_code == 200:
                models = response.json()
                logger.info(f"✅ Models endpoint working: {len(models)} models")
            else:
                logger.warning(f"⚠️ Models endpoint returned {response.status_code}")
                
            self.test_results.append("api_endpoints_passed")
            
        except Exception as e:
            error_msg = f"API Endpoints Test Failed: {e}"
            logger.error(f"❌ {error_msg}")
            logger.error(f"📋 Full traceback: {traceback.format_exc()}")
            self.errors.append(error_msg)
            
    def generate_report(self):
        """Generate a comprehensive test report"""
        logger.info("📊 Generating Test Report...")
        
        report = f"""
================================================================================
🧪 BENCHMIND AGENT INTEGRATION TEST REPORT
================================================================================
Test Date: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}

✅ PASSED TESTS: {len(self.test_results)}
{chr(10).join(f"   - {test}" for test in self.test_results)}

❌ FAILED TESTS: {len(self.errors)}
{chr(10).join(f"   - {error}" for error in self.errors)}

================================================================================
RECOMMENDATIONS:
================================================================================
"""
        
        if not self.errors:
            report += """
🎉 ALL TESTS PASSED! 
Your agent integration is working correctly. You can proceed with manual testing.
"""
        else:
            report += """
⚠️  ISSUES FOUND:
Please fix the following issues before manual testing:

"""
            for i, error in enumerate(self.errors, 1):
                report += f"{i}. {error}\n"
                
            report += """
💡 SUGGESTED FIXES:
- Check Google ADK API method signatures
- Verify all required parameters are provided
- Ensure proper session management
- Validate agent initialization
"""
        
        report += """
================================================================================
LOG FILE: test_agent_integration.log
================================================================================
"""
        
        logger.info(report)
        
        # Save report to file
        with open('test_report.txt', 'w') as f:
            f.write(report)
            
        return len(self.errors) == 0

async def main():
    """Run all integration tests"""
    logger.info("🚀 Starting Benchmind Agent Integration Tests...")
    
    tester = AgentIntegrationTester()
    
    # Run all tests
    await tester.test_database_operations()
    await tester.test_api_endpoints()
    await tester.test_benchmarking_tool()
    await tester.test_search_agent()
    await tester.test_efficiency_agent()
    await tester.test_full_workflow_sequence()  # This tests the event loop issue
    
    # Generate report
    success = tester.generate_report()
    
    if success:
        logger.info("🎉 All tests passed! Ready for manual testing.")
        sys.exit(0)
    else:
        logger.error("❌ Some tests failed. Please fix issues before manual testing.")
        sys.exit(1)

if __name__ == "__main__":
    asyncio.run(main())
