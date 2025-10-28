#!/usr/bin/env python3
"""
Quick flow test to verify all imports and connections work
"""

import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

def test_imports():
    """Test all critical imports work."""
    print("🔍 Testing imports...")
    
    try:
        # Test agent creation
        from app.agents.agent import create_consultant_agent
        print("✅ Agent creation import works")
        
        # Test tools
        from app.agents.tools import benchmark_models_for_task
        print("✅ Benchmarking tool import works")
        
        # Test EcoLogits utils
        from app.utils.utils import call_mistral_api_with_ecologits
        print("✅ EcoLogits utils import works")
        
        # Test router
        from app.routers.consultant import get_ai_recommendation
        print("✅ Consultant router import works")
        
        # Test config
        from app.core.config import settings
        print("✅ Settings import works")
        
        # Test that old service doesn't exist
        try:
            from app.services.consultant_agent import ConsultantAgent
            print("❌ OLD SERVICE STILL EXISTS - THIS IS BAD!")
            return False
        except ImportError:
            print("✅ Old service properly removed")
        
        print("\n🎯 ALL IMPORTS WORKING!")
        return True
        
    except Exception as e:
        print(f"❌ Import failed: {e}")
        return False

def test_agent_creation():
    """Test agent can be created."""
    print("\n🔍 Testing agent creation...")
    
    try:
        from app.agents.agent import create_consultant_agent
        from app.core.config import settings
        
        if not settings.gemini_api_key:
            print("⚠️ No Gemini API key - skipping agent creation")
            return True
            
        agent = create_consultant_agent(settings.default_gemini_model)
        print("✅ ReAct agent created successfully")
        print(f"✅ Agent type: {type(agent)}")
        return True
        
    except Exception as e:
        print(f"❌ Agent creation failed: {e}")
        return False

if __name__ == "__main__":
    print("🚀 FLOW VERIFICATION TEST")
    print("=" * 50)
    
    success = True
    success &= test_imports()
    success &= test_agent_creation()
    
    print("\n" + "=" * 50)
    if success:
        print("🎉 ALL TESTS PASSED - READY FOR POSTMAN!")
        print("\nPostman Instructions:")
        print("POST http://localhost:8000/ai-consultant/")
        print("Header: Content-Type: application/json")
        print('Body: {"task_description": "sentiment analysis", "selected_models": ["mistral-tiny", "mistral-small", "mistral-medium"]}')
    else:
        print("💥 TESTS FAILED - FIX ISSUES BEFORE TESTING!")
        
    sys.exit(0 if success else 1)
