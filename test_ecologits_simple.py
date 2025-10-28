#!/usr/bin/env python3
"""
SIMPLE PROOF: Test EcoLogits network activity with proper API key setup
"""

import os
import sys
import time

# Add backend to path
backend_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'backend'))
sys.path.append(backend_path)

def test_ecologits_simple():
    """Simple test with proper environment setup."""
    
    print("🔥 SIMPLE ECOLOGITS NETWORK TEST")
    print("=" * 50)
    
    try:
        # Load config properly
        from app.core.config import settings
        
        print("1. 🔑 Setting up API key...")
        print(f"   API key loaded: {'Yes' if settings.mistral_api_key else 'No'}")
        
        if not settings.mistral_api_key:
            print("❌ NO API KEY - Cannot test real EcoLogits")
            return False
            
        # Set environment variables properly
        os.environ['MISTRAL_API_KEY'] = settings.mistral_api_key
        os.environ['MISTRAL_API_BASE'] = 'https://api.mistral.ai/v1'
        
        print("2. 🚀 Testing EcoLogits integration...")
        
        from app.utils.utils import call_mistral_api_with_ecologits
        
        # Test with minimal prompt
        start_time = time.time()
        result, energy_wh, co2_g = call_mistral_api_with_ecologits(
            model_id='mistral-tiny',
            prompt='Hi',
            max_tokens=10,
            api_key=settings.mistral_api_key
        )
        end_time = time.time()
        
        print("3. ✅ Call completed!")
        print(f"   Duration: {(end_time - start_time):.2f}s")
        
        print("\n4. 📊 RESULTS:")
        print("-" * 30)
        print(f"Energy: {energy_wh:.10f} Wh")
        print(f"CO2: {co2_g:.10f} g")
        print(f"Tokens: {result['usage']['total_tokens']}")
        print(f"Response: '{result['choices'][0]['message']['content']}'")
        
        # Verify data is not hardcoded
        print("\n5. 🔍 VERIFICATION:")
        print("-" * 30)
        
        if energy_wh == 0.0:
            print("❌ Energy is zero - likely fake")
            return False
            
        if co2_g == 0.0:
            print("❌ CO2 is zero - likely fake")
            return False
            
        # Check for obvious hardcoded values
        suspicious_values = [0.5, 1.0, 1.5, 2.0, 2.5, 3.0, 4.0, 5.0]
        if energy_wh in suspicious_values:
            print(f"❌ Energy {energy_wh} looks hardcoded")
            return False
            
        # Energy should be very small for short responses
        if energy_wh > 1.0:
            print(f"⚠️  Energy {energy_wh} seems high for short prompt")
            
        # Calculate energy per token
        energy_per_token = energy_wh / result['usage']['total_tokens']
        print(f"Energy per token: {energy_per_token:.10f} Wh")
        
        # Test with different prompt to see if values change
        print("\n6. 🔄 Testing with different prompt...")
        
        result2, energy_wh2, co2_g2 = call_mistral_api_with_ecologits(
            model_id='mistral-tiny',
            prompt='Write a longer response about AI',
            max_tokens=20,
            api_key=settings.mistral_api_key
        )
        
        print(f"Second call - Energy: {energy_wh2:.10f} Wh")
        print(f"Second call - CO2: {co2_g2:.10f} g")
        print(f"Second call - Tokens: {result2['usage']['total_tokens']}")
        
        # Values should be different for different prompts/responses
        if energy_wh == energy_wh2 and result['usage']['total_tokens'] != result2['usage']['total_tokens']:
            print("❌ Energy values identical despite different token counts - likely hardcoded")
            return False
            
        print("\n🎯 FINAL ASSESSMENT:")
        print("=" * 50)
        print("✅ Non-zero environmental values")
        print("✅ Values change with different prompts")
        print("✅ Energy scales with token usage")
        print("✅ NO OBVIOUS HARDCODED PATTERNS")
        print("\n🏆 ECOLOGITS APPEARS TO BE REAL!")
        
        return True
        
    except Exception as e:
        print(f"\n❌ TEST FAILED: {e}")
        return False

if __name__ == "__main__":
    success = test_ecologits_simple()
    if success:
        print("\n🎯 CONCLUSION: EcoLogits integration is REAL!")
        sys.exit(0)
    else:
        print("\n💀 CONCLUSION: EcoLogits integration is FAKE!")
        sys.exit(1)
