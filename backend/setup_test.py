#!/usr/bin/env python3
"""Setup and test script for the PolyOracle backend."""

import subprocess
import sys
import os

def install_dependencies():
    """Install required dependencies."""
    print("Installing dependencies...")
    
    dependencies = [
        "python-dotenv",
        "pydantic>=2.0.0", 
        "httpx",
        "typing-extensions"
    ]
    
    for dep in dependencies:
        try:
            print(f"Installing {dep}...")
            result = subprocess.run([sys.executable, "-m", "pip", "install", dep], 
                                  capture_output=True, text=True, check=True)
            print(f"✓ {dep} installed successfully")
        except subprocess.CalledProcessError as e:
            print(f"✗ Failed to install {dep}: {e}")
            return False
    
    return True

def test_basic_functionality():
    """Test basic functionality."""
    print("\nTesting basic functionality...")
    
    # Add src to path
    sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'src'))
    
    try:
        # Test imports
        from polyoracle.objects import SimpleMarket, SimpleEvent
        print("✓ Objects imported successfully")
        
        # Test object creation
        market = SimpleMarket(
            id=123,
            question="Will this test pass?",
            end="2024-12-31",
            description="Test market for functionality",
            active=True,
            funded=True,
            rewardsMinSize=1.0,
            rewardsMaxSpread=0.1,
            spread=0.05,
            outcomes='["Yes", "No"]',
            outcome_prices='["0.6", "0.4"]'
        )
        print("✓ SimpleMarket created successfully")
        print(f"  Market: {market.question}")
        print(f"  Active: {market.active}")
        
        return True
        
    except Exception as e:
        print(f"✗ Test failed: {e}")
        import traceback
        traceback.print_exc()
        return False

def main():
    """Main setup and test function."""
    print("PolyOracle Backend Setup and Test")
    print("=" * 40)
    
    # Install dependencies
    if not install_dependencies():
        print("\n❌ Dependency installation failed")
        return 1
    
    # Test functionality
    if not test_basic_functionality():
        print("\n❌ Functionality test failed")
        return 1
    
    print("\n🎉 Setup and tests completed successfully!")
    print("\nNext steps:")
    print("1. Copy .env.example to .env and fill in your API keys")
    print("2. Install additional dependencies: pip install -r requirements.txt")
    print("3. Run the full test suite: python -m pytest tests/")
    
    return 0

if __name__ == "__main__":
    sys.exit(main())
