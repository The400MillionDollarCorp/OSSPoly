"""
Production-ready logging utility for the PolyOracle backend
"""

import logging
import json
import time
import asyncio
from datetime import datetime
from typing import Dict, Any, Optional
from functools import wraps
import traceback
import os
import structlog

class StructuredLogger:
    """
    Structured logger for production monitoring and debugging
    """
    
    def __init__(self, name: str = "polyoracle"):
        self.logger = logging.getLogger(name)
        self.setup_logging()
        
    def setup_logging(self):
        """Configure logging based on environment"""
        # Set log level based on environment
        log_level = os.getenv("LOG_LEVEL", "INFO").upper()
        self.logger.setLevel(getattr(logging, log_level, logging.INFO))
        
        # Create formatter for structured logging
        formatter = logging.Formatter(
            '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
        )
        
        # Console handler
        if not self.logger.handlers:
            console_handler = logging.StreamHandler()
            console_handler.setFormatter(formatter)
            self.logger.addHandler(console_handler)
            
            # File handler for production
            if os.getenv("NODE_ENV") == "production":
                file_handler = logging.FileHandler("polyoracle.log")
                file_handler.setFormatter(formatter)
                self.logger.addHandler(file_handler)
    
    def _log_structured(self, level: str, message: str, **kwargs):
        """Log with structured data"""
        log_data = {
            "timestamp": datetime.utcnow().isoformat(),
            "message": message,
            "level": level,
            **kwargs
        }
        
        # Convert to JSON string for structured logging
        structured_message = f"{message} | {json.dumps(log_data, default=str)}"
        
        getattr(self.logger, level.lower())(structured_message)
    
    def debug(self, message: str, **kwargs):
        self._log_structured("DEBUG", message, **kwargs)
    
    def info(self, message: str, **kwargs):
        self._log_structured("INFO", message, **kwargs)
    
    def warning(self, message: str, **kwargs):
        self._log_structured("WARNING", message, **kwargs)
    
    def error(self, message: str, error: Optional[Exception] = None, **kwargs):
        if error:
            kwargs.update({
                "error_type": type(error).__name__,
                "error_message": str(error),
                "traceback": traceback.format_exc() if error else None
            })
        self._log_structured("ERROR", message, **kwargs)
    
    def agent_start(self, agent_type: str, market_id: str, **kwargs):
        """Log agent start"""
        self.info(
            f"Agent {agent_type} started",
            agent_type=agent_type,
            market_id=market_id,
            **kwargs
        )
    
    def agent_complete(self, agent_type: str, market_id: str, duration: float, **kwargs):
        """Log agent completion"""
        self.info(
            f"Agent {agent_type} completed",
            agent_type=agent_type,
            market_id=market_id,
            duration=duration,
            **kwargs
        )
    
    def agent_error(self, agent_type: str, market_id: str, error: Exception, **kwargs):
        """Log agent error"""
        self.error(
            f"Agent {agent_type} failed",
            error=error,
            agent_type=agent_type,
            market_id=market_id,
            **kwargs
        )
    
    def trade_decision(self, market_id: str, decision: Dict[str, Any], **kwargs):
        """Log trade decision"""
        self.info(
            "Trade decision made",
            market_id=market_id,
            side=decision.get("side"),
            outcome=decision.get("outcome"),
            size=decision.get("size"),
            confidence=decision.get("confidence"),
            **kwargs
        )
    
    def trade_execution(self, market_id: str, order_data: Dict[str, Any], **kwargs):
        """Log trade execution"""
        self.info(
            "Trade executed",
            market_id=market_id,
            order_id=order_data.get("orderID"),
            status=order_data.get("status"),
            **kwargs
        )
    
    def validation_error(self, component: str, field: str, received: Any, expected: str):
        """Log validation error"""
        self.warning(
            "Data validation failed",
            component=component,
            field=field,
            received=str(received)[:100],  # Truncate long values
            expected=expected
        )
    
    def performance_metric(self, operation: str, duration: float, **kwargs):
        """Log performance metrics"""
        self.info(
            f"Performance: {operation}",
            operation=operation,
            duration=duration,
            **kwargs
        )

# Create singleton logger instance
logger = StructuredLogger()

def log_agent_execution(agent_type: str):
    """Decorator to log agent execution time and errors"""
    def decorator(func):
        if asyncio.iscoroutinefunction(func):
            @wraps(func)
            async def async_wrapper(state, *args, **kwargs):
                market_id = getattr(state, 'market_id', 'unknown')
                start_time = time.time()
                
                logger.agent_start(agent_type, market_id)
                
                try:
                    result = await func(state, *args, **kwargs)
                    duration = time.time() - start_time
                    logger.agent_complete(agent_type, market_id, duration)
                    return result
                except Exception as e:
                    duration = time.time() - start_time
                    logger.agent_error(agent_type, market_id, e, duration=duration)
                    raise
            
            return async_wrapper
        else:
            @wraps(func)
            def wrapper(state, *args, **kwargs):
                market_id = getattr(state, 'market_id', 'unknown')
                start_time = time.time()
                
                logger.agent_start(agent_type, market_id)
                
                try:
                    result = func(state, *args, **kwargs)
                    duration = time.time() - start_time
                    logger.agent_complete(agent_type, market_id, duration)
                    return result
                except Exception as e:
                    duration = time.time() - start_time
                    logger.agent_error(agent_type, market_id, e, duration=duration)
                    raise
            
            return wrapper
    return decorator

def log_performance(operation: str):
    """Decorator to log performance metrics"""
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            start_time = time.time()
            
            try:
                result = func(*args, **kwargs)
                duration = time.time() - start_time
                logger.performance_metric(operation, duration)
                return result
            except Exception as e:
                duration = time.time() - start_time
                logger.performance_metric(operation, duration, error=str(e))
                raise
        
        return wrapper
    return decorator

# Export convenience functions
def log_info(message: str, **kwargs):
    logger.info(message, **kwargs)

def log_error(message: str, error: Optional[Exception] = None, **kwargs):
    logger.error(message, error=error, **kwargs)

def log_warning(message: str, **kwargs):
    logger.warning(message, **kwargs)

def log_debug(message: str, **kwargs):
    logger.debug(message, **kwargs)
