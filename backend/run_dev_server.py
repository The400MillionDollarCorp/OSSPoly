#!/usr/bin/env python3
"""
Development server for the PolyOracle LangGraph agent.
This script runs the LangGraph agent as a development server.
"""

import asyncio
import os
from pathlib import Path
import sys

# Add the src directory to the Python path
src_path = Path(__file__).parent / "src"
sys.path.insert(0, str(src_path))

from polyoracle.graph import graph
from langgraph.pregel import Pregel
from langgraph.checkpoint.memory import MemorySaver

async def main():
    """Run the development server."""
    print("Starting PolyOracle LangGraph Development Server...")
    print(f"Graph name: {graph.name}")
    print("Server is running. You can now interact with the agent.")
    
    # Example of how to invoke the graph
    config = {"configurable": {"thread_id": "dev-session"}}
    
    print("\nTo test the agent, you can use the following example:")
    print("python run_dev_server.py --test")
    
    if "--test" in sys.argv:
        print("\nRunning test invocation...")
        try:
            result = await graph.ainvoke(
                {"messages": [{"role": "user", "content": "What are some interesting markets to trade on Polymarket?"}]},
                config=config
            )
            print(f"Result: {result}")
        except Exception as e:
            print(f"Error during test: {e}")
    else:
        print("\nDevelopment server is ready. The graph is compiled and available.")
        print("You can now connect your frontend or use the LangGraph SDK to interact with the agent.")

if __name__ == "__main__":
    asyncio.run(main())
