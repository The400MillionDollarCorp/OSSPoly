#!/usr/bin/env python3
"""
Standalone test script for PolyOracle agent without Docker/LangGraph server.
This allows you to test the agent functionality directly.
"""

import asyncio
import json
from typing import Dict, Any

from polyoracle.state import State, Token
from polyoracle.graph import fetch_market_data, research_agent_node, analysis_agent_node, trade_agent_node


async def test_polyoracle_agent(market_id: str = "516877"):
    """Test the PolyOracle agent with a specific market."""
    print(f"🚀 Testing PolyOracle Agent with Market ID: {market_id}")
    print("=" * 60)
    
    # Initialize state
    state = State(
        market_id=market_id,
        messages=[],
        loop_step=0,
        tokens=None,
        market_data=None,
        research_report=None,
        analysis_info=None,
        trade_decision=None,
        confidence=0.0,
        positions=None,
        trade_info=None,
        market_details=None,
        orderbook_data=None,
        market_trades=None,
        historical_trends=None
    )
    
    try:
        # Step 1: Fetch Market Data
        print("📊 Step 1: Fetching market data...")
        market_result = await fetch_market_data(state)
        print(f"Market data fetched: {bool(state.market_data)}")
        if state.market_data:
            print(f"Question: {state.market_data.get('question', 'N/A')}")
            print(f"Outcomes: {state.market_data.get('outcomes', 'N/A')}")
        print()
        
        # Step 2: Research Agent
        print("🔍 Step 2: Running research agent...")
        try:
            research_result = await research_agent_node(state)
            print(f"Research completed: {bool(state.research_report)}")
            if state.research_report:
                learnings = state.research_report.get('learnings', [])
                print(f"Key learnings found: {len(learnings)}")
                if learnings:
                    print("Sample learning:", learnings[0][:100] + "..." if len(learnings[0]) > 100 else learnings[0])
        except Exception as e:
            print(f"Research agent error: {e}")
        print()
        
        # Step 3: Analysis Agent
        print("📈 Step 3: Running analysis agent...")
        try:
            analysis_result = await analysis_agent_node(state)
            print(f"Analysis completed: {bool(state.analysis_info)}")
            if state.analysis_info:
                print(f"Analysis confidence: {state.analysis_info.get('confidence', 'N/A')}")
        except Exception as e:
            print(f"Analysis agent error: {e}")
        print()
        
        # Step 4: Trade Agent
        print("💰 Step 4: Running trade agent...")
        try:
            trade_result = await trade_agent_node(state)
            print(f"Trade decision made: {bool(state.trade_decision)}")
            if state.trade_decision:
                print(f"Decision: {state.trade_decision}")
                print(f"Confidence: {state.confidence}")
        except Exception as e:
            print(f"Trade agent error: {e}")
        print()
        
        # Summary
        print("📋 SUMMARY")
        print("=" * 30)
        print(f"Market: {state.market_data.get('question', 'N/A') if state.market_data else 'Failed to fetch'}")
        print(f"Research: {'✅ Completed' if state.research_report else '❌ Failed'}")
        print(f"Analysis: {'✅ Completed' if state.analysis_info else '❌ Failed'}")
        print(f"Trade Decision: {state.trade_decision if state.trade_decision else '❌ No decision'}")
        print(f"Confidence: {state.confidence}")
        
    except Exception as e:
        print(f"❌ Agent test failed: {e}")
        import traceback
        traceback.print_exc()


async def test_individual_components():
    """Test individual components separately."""
    print("🧪 Testing Individual Components")
    print("=" * 40)
    
    # Test market data fetch
    print("Testing market data fetch...")
    state = State(
        market_id="516877",
        messages=[],
        loop_step=0,
        tokens=None,
        market_data=None,
        research_report=None,
        analysis_info=None,
        trade_decision=None,
        confidence=0.0,
        positions=None,
        trade_info=None,
        market_details=None,
        orderbook_data=None,
        market_trades=None,
        historical_trends=None
    )
    
    try:
        result = await fetch_market_data(state)
        print(f"✅ Market data: {bool(state.market_data)}")
        if state.market_data:
            print(f"   Question: {state.market_data.get('question', 'N/A')}")
    except Exception as e:
        print(f"❌ Market data failed: {e}")


if __name__ == "__main__":
    print("🤖 PolyOracle Agent Test Suite")
    print("=" * 50)
    
    # Test the full agent workflow
    asyncio.run(test_polyoracle_agent())
    
    print("\n" + "=" * 50)
    
    # Test individual components
    asyncio.run(test_individual_components())
