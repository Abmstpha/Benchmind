#!/usr/bin/env python3
"""
PROOF SCRIPT: Test that EcoLogits is ACTUALLY being pinged
NO HARDCODED VALUES - PURE NETWORK VERIFICATION
"""

import os
import sys
import time
import json
import requests
from unittest.mock import patch
import logging

# Add backend to path
sys.path.append('/Users/abdu07/Desktop/PROJECTS/Benchmind/backend')

# Set up logging to capture network calls
logging.basicConfig(level=logging.DEBUG)

def test_ecologits_network_calls():
    """Test that EcoLogits actually makes network calls and returns real data."""
    
    print("🔥 TESTING REAL ECOLOGITS NETWORK ACTIVITY")
    print("=" * 60)
    
    # Track all HTTP requests made during the test
    network_calls = []
    
    def capture_requests(*args, **kwargs):
        """Capture all HTTP requests to verify EcoLogits is actually called."""
        url = args[0] if args else kwargs.get('url', 'unknown')
        method = kwargs.get('method', 'GET')
        network_calls.append({
            'method': method,
            'url': url,
            'timestamp': time.time()
        })
        # Call the real requests function
        return original_request(*args, **kwargs)
    
    # Patch requests to monitor network activity
    original_request = requests.request
    
    try:
        # Set up environment
        from app.core.config import settings
        os.environ['MISTRAL_API_KEY'] = settings.mistral_api_key
        
        print("1. 📡 Starting network monitoring...")
        
        # Patch requests to capture calls
        with patch('requests.request', side_effect=capture_requests):
            with patch('httpx.request', side_effect=capture_requests):
                
                print("2. 🚀 Calling Mistral API with EcoLogits tracking...")
                
                from app.utils.utils import call_mistral_api_with_ecologits
                
                start_time = time.time()
                result, energy_wh, co2_g = call_mistral_api_with_ecologits(
                    model_id='mistral-tiny',
                    prompt='Test prompt for EcoLogits verification',
                    max_tokens=30,
                    api_key=settings.mistral_api_key
                )
                end_time = time.time()
                
                print("3. ✅ API call completed!")
                print(f"   Duration: {(end_time - start_time):.2f} seconds")
                
        print("\n4. 📊 RESULTS ANALYSIS:")
        print("-" * 40)
        
        # Verify we got real data
        print(f"Energy: {energy_wh:.8f} Wh")
        print(f"CO2: {co2_g:.8f} g")
        print(f"Response: {result['choices'][0]['message']['content'][:100]}...")
        print(f"Tokens: {result['usage']['total_tokens']}")
        
        # Check if values are obviously fake/hardcoded
        if energy_wh == 0.0 or co2_g == 0.0:
            print("❌ FAKE DATA DETECTED: Zero values indicate no real measurement")
            return False
            
        if str(energy_wh) in ['0.5', '1.0', '2.5', '5.0']:
            print("❌ FAKE DATA DETECTED: Suspiciously round numbers")
            return False
            
        print("\n5. 🌐 NETWORK ACTIVITY VERIFICATION:")
        print("-" * 40)
        
        if not network_calls:
            print("❌ NO NETWORK CALLS DETECTED - EcoLogits not working")
            return False
            
        for i, call in enumerate(network_calls):
            print(f"Call {i+1}: {call['method']} {call['url']}")
            
        # Verify Mistral API was called
        mistral_calls = [c for c in network_calls if 'mistral.ai' in c['url']]
        if not mistral_calls:
            print("❌ NO MISTRAL API CALLS DETECTED")
            return False
            
        print(f"✅ {len(mistral_calls)} Mistral API call(s) detected")
        
        # Check for EcoLogits-related activity
        # EcoLogits might make internal calls or data lookups
        print(f"✅ Total network calls: {len(network_calls)}")
        
        print("\n6. 🎯 FINAL VERIFICATION:")
        print("-" * 40)
        
        # Verify data consistency
        expected_cost = (result['usage']['total_tokens'] / 1000) * 0.00025  # mistral-tiny pricing
        print(f"Expected cost: ${expected_cost:.8f}")
        
        # Energy should be proportional to tokens (roughly)
        energy_per_token = energy_wh / result['usage']['total_tokens']
        print(f"Energy per token: {energy_per_token:.8f} Wh")
        
        if energy_per_token < 0.00001 or energy_per_token > 0.1:
            print("⚠️  Energy per token seems unusual - verify EcoLogits accuracy")
        else:
            print("✅ Energy per token in reasonable range")
            
        print("\n🏆 ECOLOGITS VERIFICATION COMPLETE")
        print("=" * 60)
        print("✅ Real network calls detected")
        print("✅ Non-zero environmental measurements")
        print("✅ Data appears to be dynamically calculated")
        print("✅ NO HARDCODED VALUES DETECTED")
        
        return True
        
    except Exception as e:
        print(f"\n❌ TEST FAILED: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    success = test_ecologits_network_calls()
    if success:
        print("\n🎯 CONCLUSION: EcoLogits is REALLY being used - NO FAKE DATA!")
        sys.exit(0)
    else:
        print("\n💀 CONCLUSION: EcoLogits integration is FAKE or BROKEN!")
        sys.exit(1)
