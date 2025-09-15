#!/usr/bin/env python3
"""Test script to verify all imports work correctly."""

import sys
import os

# Add the src directory to the path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'src'))

def test_basic_imports():
    """Test that basic modules can be imported without external dependencies."""
    try:
        from polyoracle.objects import SimpleMarket, SimpleEvent, Market
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

def test_object_creation():
    """Test creating basic objects."""
    try:
        from polyoracle.objects import SimpleMarket
        
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

def test_state_objects():
    """Test state object creation."""
    try:
        from polyoracle.state import TradeDecision, ResearchResult
        
        # Test TradeDecision
        trade = TradeDecision(side="BUY", outcome="YES")
        print("✓ TradeDecision object created successfully")
        
        # Test ResearchResult
        research = ResearchResult(
            report="Test report",
            learnings=["Learning 1", "Learning 2"],
            visited_urls=["http://example.com"]
        )
        print("✓ ResearchResult object created successfully")
        return True
    except Exception as e:
        print(f"✗ State object test failed: {e}")
        return False

def main():
    """Run all tests."""
    print("Running import and basic functionality tests...\n")
    
    tests = [
        ("Basic Imports", test_basic_imports),
        ("Object Creation", test_object_creation),
        ("State Objects", test_state_objects),
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
        print("🎉 All basic tests passed!")
        return 0
    else:
        print("❌ Some tests failed")
        return 1

if __name__ == "__main__":
    sys.exit(main())
