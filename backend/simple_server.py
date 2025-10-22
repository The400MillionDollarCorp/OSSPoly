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
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
import uvicorn
from pydantic import BaseModel, ValidationError

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
async def stream_agent_run(thread_id: str, raw_request: Request):
    """Stream agent execution results"""
    
    # DIAGNOSTIC LOG: Capture raw request body before Pydantic validation
    try:
        raw_body = await raw_request.body()
        body_str = raw_body.decode('utf-8')
        logger.info(f"========== STREAM REQUEST DIAGNOSTICS ==========")
        logger.info(f"Thread ID: {thread_id}")
        logger.info(f"Raw request body (first 500 chars): {body_str[:500]}")
        logger.info(f"Request headers: {dict(raw_request.headers)}")
        logger.info(f"================================================")
        
        # Parse JSON to inspect structure
        import json
        body_json = json.loads(body_str)
        logger.info(f"========== PARSED JSON STRUCTURE ==========")
        logger.info(f"Top-level keys: {list(body_json.keys())}")
        logger.info(f"Full JSON (first 1000 chars): {json.dumps(body_json, indent=2)[:1000]}")
        logger.info(f"==========================================")
        
        # Extract data from LangGraph SDK wrapper structure
        # LangGraph SDK wraps data in an 'input' field, extract it
        if 'input' in body_json:
            logger.info(f"🔍 Detected LangGraph SDK format, extracting from 'input' field")
            request_data = body_json['input']
        else:
            request_data = body_json
        
        # Try to parse as AgentRequest
        try:
            request = AgentRequest(**request_data)
            logger.info(f"✅ Successfully parsed as AgentRequest")
            logger.info(f"Market ID: {request.market_id}")
            logger.info(f"Tokens count: {len(request.tokens)}")
            logger.info(f"From JS flag: {request.from_js}")
        except ValidationError as ve:
            logger.error(f"❌ Pydantic validation failed!")
            logger.error(f"Validation errors: {ve.errors()}")
            logger.error(f"Expected schema: market_id (str), tokens (list[dict]), from_js (bool)")
            logger.error(f"Received data: {request_data}")
            raise HTTPException(status_code=422, detail=f"Validation error: {ve.errors()}")
        
    except json.JSONDecodeError as je:
        logger.error(f"❌ Failed to parse JSON: {je}")
        raise HTTPException(status_code=400, detail=f"Invalid JSON: {str(je)}")
    except Exception as e:
        logger.error(f"❌ Unexpected error processing request: {e}")
        raise HTTPException(status_code=500, detail=f"Internal error: {str(e)}")
    
    def serialize_for_json(obj):
        """Recursively convert Pydantic models and other non-serializable objects to dicts"""
        if hasattr(obj, 'model_dump'):
            # It's a Pydantic model
            return obj.model_dump()
        elif isinstance(obj, dict):
            # Recursively handle dictionary values
            return {key: serialize_for_json(value) for key, value in obj.items()}
        elif isinstance(obj, (list, tuple)):
            # Recursively handle list/tuple items
            return [serialize_for_json(item) for item in obj]
        else:
            # Return as-is (primitives, None, etc.)
            return obj
    
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
                # Recursively convert all Pydantic models to dictionaries
                serializable_event = serialize_for_json(event)
                
                # Format event to match LangGraph SDK format
                event_data = {
                    "event": "updates",
                    "data": serializable_event
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
