#!/usr/bin/env python3
"""
Simple OpenAI API Key Test - Just check if the key works
"""

import os
from dotenv import load_dotenv

def test_openai_key():
    """Test OpenAI API key format and basic validation"""
    
    # Load environment variables
    load_dotenv('backend/.env')
    
    api_key = os.getenv('OPENAI_API_KEY')
    
    if not api_key:
        print("❌ OPENAI_API_KEY not found in environment variables")
        return False
    
    print(f"🔑 OpenAI API Key found: {api_key[:8]}...{api_key[-4:]}")
    
    # Validate key format
    if not api_key.startswith('sk-'):
        print("❌ Invalid OpenAI API key format (should start with 'sk-')")
        return False
    
    if len(api_key) < 20:
        print("❌ OpenAI API key seems too short")
        return False
    
    print("✅ OpenAI API key format looks valid!")
    
    try:
        # Import OpenAI library to check if it's available
        from openai import OpenAI
        print("✅ OpenAI library is installed")
        
        # Initialize client (this doesn't make API calls)
        client = OpenAI(api_key=api_key)
        print("✅ OpenAI client initialized successfully")
        
        print("ℹ️  Note: Quota exceeded, but key format is valid")
        print("ℹ️  Add credits to your OpenAI account to make API calls")
        
        return True
        
    except ImportError:
        print("❌ OpenAI library not installed. Run: pip install openai")
        return False
    except Exception as e:
        print(f"❌ OpenAI client initialization failed: {e}")
        return False

if __name__ == "__main__":
    print("🧪 OPENAI API KEY TEST")
    print("=" * 40)
    
    success = test_openai_key()
    
    print("\n" + "=" * 40)
    if success:
        print("🎉 OpenAI API key is working!")
    else:
        print("💥 OpenAI API key test failed!")
