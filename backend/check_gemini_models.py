#!/usr/bin/env python3
"""
Script to check what Gemini models are actually available through our Google API key
"""

import os
import requests
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def check_gemini_models():
    """Check what models are available through Google Gemini API."""
    api_key = os.getenv('GEMINI_API_KEY')
    
    if not api_key:
        print("❌ GEMINI_API_KEY not found in .env file")
        return
    
    print(f"🔑 Using Gemini API key: {api_key[:10]}...")
    print()
    
    # Google AI Studio API endpoint for listing models
    url = f"https://generativelanguage.googleapis.com/v1beta/models?key={api_key}"
    
    try:
        print("🌐 Fetching available models from Google Gemini API...")
        response = requests.get(url, timeout=10)
        
        print(f"📊 Response status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            models = data.get('models', [])
            
            print(f"✅ Found {len(models)} total models:")
            print("=" * 80)
            
            chat_models = []
            
            for i, model in enumerate(models, 1):
                model_name = model.get('name', 'Unknown')
                display_name = model.get('displayName', 'Unknown')
                description = model.get('description', 'No description')
                supported_methods = model.get('supportedGenerationMethods', [])
                
                print(f"{i:2d}. Name: {model_name}")
                print(f"    Display: {display_name}")
                print(f"    Methods: {', '.join(supported_methods)}")
                print(f"    Description: {description[:100]}...")
                print()
                
                # Check if it supports generateContent (chat)
                if 'generateContent' in supported_methods:
                    chat_models.append({
                        'name': model_name,
                        'display_name': display_name,
                        'description': description
                    })
            
            print("=" * 80)
            print(f"🤖 Chat-compatible models ({len(chat_models)}):")
            for model in chat_models:
                print(f"  - {model['name']} ({model['display_name']})")
            
            return chat_models
            
        else:
            print(f"❌ API Error: {response.status_code}")
            print(f"Response: {response.text}")
            
    except requests.exceptions.RequestException as e:
        print(f"❌ Network error: {e}")
    except Exception as e:
        print(f"❌ Unexpected error: {e}")
    
    return []

def test_gemini_models():
    """Test if we can actually use the chat models."""
    api_key = os.getenv('GEMINI_API_KEY')
    
    if not api_key:
        return
    
    print("\n🧪 Testing model access...")
    
    # Get available models first
    chat_models = check_gemini_models()
    
    if not chat_models:
        print("No chat models found to test")
        return
    
    working_models = []
    
    for model_info in chat_models[:5]:  # Test first 5 models
        model_name = model_info['name']
        
        try:
            # Test with generateContent endpoint
            url = f"https://generativelanguage.googleapis.com/v1beta/{model_name}:generateContent?key={api_key}"
            
            payload = {
                "contents": [{
                    "parts": [{
                        "text": "Hello"
                    }]
                }],
                "generationConfig": {
                    "maxOutputTokens": 10
                }
            }
            
            response = requests.post(url, json=payload, timeout=10)
            
            if response.status_code == 200:
                print(f"✅ {model_name} - WORKS")
                working_models.append(model_info)
            else:
                print(f"❌ {model_name} - Error {response.status_code}: {response.text[:100]}")
                
        except Exception as e:
            print(f"❌ {model_name} - Exception: {str(e)[:100]}")
    
    print(f"\n🎯 Working models ({len(working_models)}):")
    for model in working_models:
        print(f"  - {model['name']} ({model['display_name']})")
    
    return working_models

def test_langchain_models():
    """Test which models work with LangChain."""
    print("\n🔗 Testing LangChain compatibility...")
    
    try:
        from langchain_google_genai import ChatGoogleGenerativeAI
        
        # Test different model name formats
        test_models = [
            "gemini-pro",
            "models/gemini-pro", 
            "gemini-1.5-pro",
            "models/gemini-1.5-pro",
            "gemini-1.5-flash",
            "models/gemini-1.5-flash",
            "gemini-1.5-pro-latest",
            "models/gemini-1.5-pro-latest"
        ]
        
        api_key = os.getenv('GEMINI_API_KEY')
        working_langchain_models = []
        
        for model_name in test_models:
            try:
                print(f"Testing {model_name}...", end=" ")
                
                llm = ChatGoogleGenerativeAI(
                    model=model_name,
                    google_api_key=api_key,
                    temperature=0.1
                )
                
                # Try a simple invoke
                response = llm.invoke("Hi")
                print(f"✅ WORKS - Response: {str(response)[:50]}...")
                working_langchain_models.append(model_name)
                
            except Exception as e:
                print(f"❌ FAILED - {str(e)[:100]}")
        
        print(f"\n🎯 Working LangChain models ({len(working_langchain_models)}):")
        for model in working_langchain_models:
            print(f"  - {model}")
        
        return working_langchain_models
        
    except ImportError:
        print("❌ LangChain Google GenAI not installed")
        return []

if __name__ == "__main__":
    print("🔍 Gemini API Model Checker")
    print("=" * 50)
    
    # First check what's available via API
    chat_models = check_gemini_models()
    
    # Then test what actually works
    working_models = test_gemini_models()
    
    # Finally test LangChain compatibility
    langchain_models = test_langchain_models()
    
    print(f"\n📝 Summary:")
    print(f"Total models: {len(chat_models) if chat_models else 0}")
    print(f"Working models: {len(working_models) if working_models else 0}")
    print(f"LangChain compatible: {len(langchain_models) if langchain_models else 0}")
    
    if langchain_models:
        print(f"\n💡 Use this model in your code:")
        print(f'model="{langchain_models[0]}"')
