#!/usr/bin/env python3
"""Simplified test script to verify basic functionality."""

import sys
import os

# Add the src directory to the path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'src'))

def test_minimal_imports():
    """Test minimal imports without external dependencies."""
    try:
        # Test basic Python imports first
        import json
        import typing
        print("✓ Basic Python modules work")
        
        # Test pydantic
        from pydantic import BaseModel
        print("✓ Pydantic imported")
        
        # Test our objects module
        sys.path.insert(0, 'src')
        from polyoracle.objects import SimpleMarket
        print("✓ SimpleMarket imported")
        
        # Create a simple object
        market = SimpleMarket(
            id=123,
            question="Test?",
            end="2024-12-31",
            description="Test",
            active=True,
            funded=True,
            rewardsMinSize=1.0,
            rewardsMaxSpread=0.1,
            spread=0.05,
            outcomes='["Yes", "No"]',
            outcome_prices='["0.5", "0.5"]'
        )
        print("✓ SimpleMarket object created")
        print(f"  Market ID: {market.id}")
        print(f"  Question: {market.question}")
        
        return True
    except Exception as e:
        print(f"✗ Test failed: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    print("Running minimal functionality test...\n")
    if test_minimal_imports():
        print("\n🎉 Basic functionality works!")
        sys.exit(0)
    else:
        print("\n❌ Test failed")
        sys.exit(1)
