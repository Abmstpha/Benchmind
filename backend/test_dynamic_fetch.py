#!/usr/bin/env python3
"""
Test script for dynamic model fetching - exactly what the AI consultant should do
"""

import os
import requests
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def test_dynamic_fetch():
    """Test the exact same logic as AI consultant get_available_models."""
    api_key = os.getenv('MISTRAL_API_KEY')
    
    if not api_key:
        print("❌ MISTRAL_API_KEY not found in .env file")
        return []
    
    print(f"🔑 Using Mistral API key: {api_key[:10]}...")
    print()
    
    try:
        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        }
        
        print("🌐 Fetching models from Mistral API...")
        response = requests.get(
            "https://api.mistral.ai/v1/models",
            headers=headers,
            timeout=10
        )
        
        print(f"📊 Response status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            models = data.get('data', [])
            
            print(f"📋 Total models from API: {len(models)}")
            
            working_models = []
            for model in models:
                model_id = model.get('id')
                if not model_id:
                    continue
                
                # Skip ONLY embed/moderation models
                if any(skip in model_id.lower() for skip in ['embed', 'moderation']):
                    print(f"⏭️  Skipping: {model_id}")
                    continue
                
                name = model_id.replace('-', ' ').title()
                description = "AI model"
                
                working_models.append({
                    "id": model_id,
                    "name": name,
                    "provider": "mistral",
                    "description": description
                })
                
                print(f"✅ Added: {model_id} -> {name}")
            
            print(f"\n🎯 Final result: {len(working_models)} models")
            
            # Show the exact response format
            result = {
                "available_models": working_models,
                "total_count": len(working_models),
                "providers": ["mistral"]
            }
            
            print(f"\n📦 Response format:")
            print(f"  - available_models: {len(result['available_models'])} items")
            print(f"  - total_count: {result['total_count']}")
            print(f"  - providers: {result['providers']}")
            
            # Show first 5 models as sample
            print(f"\n📋 First 5 models:")
            for i, model in enumerate(working_models[:5]):
                print(f"  {i+1}. {model['id']} - {model['name']} ({model['description']})")
            
            if len(working_models) > 5:
                print(f"  ... and {len(working_models) - 5} more")
            
            return result
            
        else:
            print(f"❌ API returned {response.status_code}")
            print(f"Response: {response.text}")
            
    except Exception as e:
        print(f"❌ Error: {e}")
    
    # Fallback
    print("🔄 Using fallback models")
    return {
        "available_models": [
            {"id": "mistral-tiny", "name": "Mistral Tiny", "provider": "mistral", "description": "Fast"},
            {"id": "mistral-small", "name": "Mistral Small", "provider": "mistral", "description": "Balanced"}
        ],
        "total_count": 2,
        "providers": ["mistral"]
    }

if __name__ == "__main__":
    print("🔍 Testing Dynamic Model Fetching")
    print("=" * 50)
    
    result = test_dynamic_fetch()
    
    print(f"\n📝 Summary:")
    print(f"Success: {'✅' if result['total_count'] > 2 else '❌'}")
    print(f"Models found: {result['total_count']}")
    
    if result['total_count'] > 2:
        print("\n💡 This should work in the AI consultant!")
    else:
        print("\n⚠️  Something is wrong - check the error messages above")
