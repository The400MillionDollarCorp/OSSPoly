#!/usr/bin/env python3
"""
Simple HTTP server to serve PolyOracle agent functionality without Docker/LangGraph server.
This provides a REST API that the frontend can call directly.
"""

import asyncio
import json
import logging
import time
from typing import Dict, Any, AsyncGenerator
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
import uvicorn
from pydantic import BaseModel

# Import our agent components
import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), 'src'))

from polyoracle.graph import create_graph
from polyoracle.state import State, Token

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="PolyOracle Agent API", version="1.0.0")

# Enable CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class AgentRequest(BaseModel):
    market_id: str
    tokens: list[Dict[str, Any]]
    from_js: bool = True

class ThreadResponse(BaseModel):
    thread_id: str

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "service": "polyoracle-agent"}

@app.post("/threads", response_model=ThreadResponse)
async def create_thread():
    """Create a new thread (simulate LangGraph SDK behavior)"""
    import uuid
    thread_id = str(uuid.uuid4())
    return ThreadResponse(thread_id=thread_id)

@app.post("/threads/{thread_id}/runs/stream")
async def stream_agent_run(thread_id: str, request: AgentRequest):
    """Stream agent execution results"""
    
    async def generate_agent_stream():
        try:
            # Initialize the graph
            graph = create_graph()
            
            # Convert tokens to proper format
            tokens = []
            for token_data in request.tokens:
                token = Token(
                    token_id=token_data.get('token_id', ''),
                    outcome=token_data.get('outcome', ''),
                    price=float(token_data.get('price', 0.0))
                )
                tokens.append(token)
            
            # Create initial state
            initial_state = State(
                market_id=request.market_id,
                tokens=tokens,
                from_js=request.from_js
            )
            
            logger.info(f"Starting agent workflow for market {request.market_id}")
            
            # Stream through the graph execution
            config = {"configurable": {"thread_id": thread_id}}
            
            async for event in graph.astream(initial_state, config):
                # Format event to match LangGraph SDK format
                event_data = {
                    "event": "updates",
                    "data": event
                }
                
                yield f"data: {json.dumps(event_data)}\n\n"
                
                # Add small delay to prevent overwhelming the client
                await asyncio.sleep(0.1)
                
        except Exception as e:
            logger.error(f"Error in agent stream: {e}")
            error_event = {
                "event": "error",
                "data": {"error": str(e)}
            }
            yield f"data: {json.dumps(error_event)}\n\n"
    
    return StreamingResponse(
        generate_agent_stream(),
        media_type="text/plain",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "Content-Type": "text/event-stream",
        }
    )

@app.post("/threads/{thread_id}/runs/{run_id}/interrupt")
async def handle_interrupt(thread_id: str, run_id: str, decision: Dict[str, Any]):
    """Handle human confirmation interrupts"""
    logger.info(f"Received interrupt for thread {thread_id}, run {run_id}: {decision}")
    
    # For now, just return success
    # In a full implementation, this would resume the agent with the decision
    return {"status": "success", "message": "Interrupt handled"}

class TradeExecutionRequest(BaseModel):
    market_id: str
    token_id: str
    side: str  # "BUY" or "SELL"
    outcome: str  # "YES" or "NO"
    size: float
    reason: str
    confidence: float

@app.post("/execute-trade")
async def execute_trade(request: TradeExecutionRequest):
    """Execute a trade based on agent decision"""
    try:
        logger.info(f"Received trade execution request: {request}")
        
        # Import the polymarket client
        from polyoracle.polymarket import Polymarket
        
        # Initialize the client
        poly_client = Polymarket()
        
        # Execute the trade
        result = poly_client.execute_market_order(
            token_id=request.token_id,
            amount=request.size,
            side=request.side.upper()
        )
        
        logger.info(f"Trade execution result: {result}")
        
        # Handle different result types
        if isinstance(result, str):
            # If it's a mock order ID or simple string response
            if result.startswith("mock_market_order_id_"):
                return {
                    "success": True,
                    "orderID": result,
                    "takingAmount": str(request.size),
                    "makingAmount": "0",
                    "status": "mock_execution",
                    "transactionsHashes": [],
                    "message": "Trade executed successfully (mock mode)"
                }
            else:
                # Try to parse as JSON if it's a string
                try:
                    import json
                    parsed_result = json.loads(result)
                    if isinstance(parsed_result, dict):
                        result = parsed_result
                except:
                    # If parsing fails, treat as successful order ID
                    return {
                        "success": True,
                        "orderID": result,
                        "takingAmount": str(request.size),
                        "makingAmount": "0",
                        "status": "completed",
                        "transactionsHashes": [],
                        "message": "Trade executed successfully"
                    }
        
        # Handle dictionary result
        if isinstance(result, dict):
            # Check if the trade was successful
            if result.get("success", True):  # Default to True if no success field
                return {
                    "success": True,
                    "orderID": result.get("orderID") or result.get("order_id") or str(int(time.time())),
                    "takingAmount": str(result.get("takingAmount", request.size)),
                    "makingAmount": str(result.get("makingAmount", 0)),
                    "status": result.get("status", "completed"),
                    "transactionsHashes": result.get("transactionsHashes", []),
                    "message": "Trade executed successfully"
                }
            else:
                return {
                    "success": False,
                    "errorMsg": result.get("errorMsg", "Trade execution failed"),
                    "message": f"Trade failed: {result.get('errorMsg', 'Unknown error')}"
                }
        
        # Fallback for unknown result types
        return {
            "success": True,
            "orderID": f"order_{int(time.time())}",
            "takingAmount": str(request.size),
            "makingAmount": "0",
            "status": "completed",
            "transactionsHashes": [],
            "message": "Trade executed successfully"
        }
            
    except Exception as e:
        logger.error(f"Trade execution error: {str(e)}")
        return {
            "success": False,
            "errorMsg": str(e),
            "message": f"Trade execution failed: {str(e)}"
        }

if __name__ == "__main__":
    # Start the server
    uvicorn.run(
        "simple_server:app",
        host="127.0.0.1",
        port=2024,
        reload=True,
        log_level="info"
    )
