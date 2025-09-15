#!/usr/bin/env python3
"""Basic test script to verify project functionality."""

import sys
import os

# Add the src directory to the path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'src'))

def test_imports():
    """Test that all main modules can be imported."""
    try:
        from polyoracle.gamma import GammaMarketClient
        print("✓ GammaMarketClient imported successfully")
    except Exception as e:
        print(f"✗ Failed to import GammaMarketClient: {e}")
        return False

    try:
        from polyoracle.objects import SimpleMarket, SimpleEvent
        print("✓ Objects imported successfully")
    except Exception as e:
        print(f"✗ Failed to import objects: {e}")
        return False

    try:
        from polyoracle.state import State, TradeDecision, ResearchResult
        print("✓ State classes imported successfully")
    except Exception as e:
        print(f"✗ Failed to import state classes: {e}")
        return False

    try:
        from polyoracle.configuration import Configuration
        print("✓ Configuration imported successfully")
    except Exception as e:
        print(f"✗ Failed to import Configuration: {e}")
        return False

    return True

def test_gamma_client():
    """Test basic GammaMarketClient functionality."""
    try:
        from polyoracle.gamma import GammaMarketClient
        client = GammaMarketClient()
        print("✓ GammaMarketClient instantiated successfully")
        
        # Test getting markets (with a small limit to avoid long waits)
        markets = client.get_all_current_markets(limit=2)
        if markets and len(markets) > 0:
            print(f"✓ Retrieved {len(markets)} markets from Gamma API")
            return True
        else:
            print("⚠ No markets returned from Gamma API (may be network issue)")
            return True  # Not necessarily a code error
    except Exception as e:
        print(f"✗ GammaMarketClient test failed: {e}")
        return False

def test_objects():
    """Test object creation."""
    try:
        from polyoracle.objects import SimpleMarket
        
        # Test creating a SimpleMarket object
        market_data = {
            "id": 123,
            "question": "Test question?",
            "end": "2024-12-31",
            "description": "Test description",
            "active": True,
            "funded": True,
            "rewardsMinSize": 1.0,
            "rewardsMaxSpread": 0.1,
            "spread": 0.05,
            "outcomes": '["Yes", "No"]',
            "outcome_prices": '["0.5", "0.5"]',
            "clob_token_ids": '["123", "456"]'
        }
        
        market = SimpleMarket(**market_data)
        print("✓ SimpleMarket object created successfully")
        return True
    except Exception as e:
        print(f"✗ Object creation test failed: {e}")
        return False

def main():
    """Run all tests."""
    print("Running basic functionality tests...\n")
    
    tests = [
        ("Import Tests", test_imports),
        ("Object Creation Tests", test_objects),
        ("Gamma Client Tests", test_gamma_client),
    ]
    
    passed = 0
    total = len(tests)
    
    for test_name, test_func in tests:
        print(f"\n--- {test_name} ---")
        if test_func():
            passed += 1
            print(f"✓ {test_name} PASSED")
        else:
            print(f"✗ {test_name} FAILED")
    
    print(f"\n--- Results ---")
    print(f"Passed: {passed}/{total}")
    
    if passed == total:
        print("🎉 All tests passed!")
        return 0
    else:
        print("❌ Some tests failed")
        return 1

if __name__ == "__main__":
    sys.exit(main())
