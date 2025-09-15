/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Production-ready logging utility with different log levels and structured output
 */

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: Record<string, any>;
  error?: Error;
  userId?: string;
  sessionId?: string;
  component?: string;
}

class Logger {
  private logLevel: LogLevel;
  private sessionId: string;
  private userId?: string;

  constructor() {
    // Set log level based on environment
    this.logLevel = process.env.NODE_ENV === 'production' ? LogLevel.WARN : LogLevel.DEBUG;
    this.sessionId = this.generateSessionId();
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  setUserId(userId: string) {
    this.userId = userId;
  }

  private shouldLog(level: LogLevel): boolean {
    return level >= this.logLevel;
  }

  private formatLogEntry(entry: LogEntry): string {
    const { timestamp, level, message, context, error, component } = entry;
    const levelName = LogLevel[level];
    
    let logString = `[${timestamp}] ${levelName}`;
    
    if (component) {
      logString += ` [${component}]`;
    }
    
    logString += `: ${message}`;
    
    if (context && Object.keys(context).length > 0) {
      logString += ` | Context: ${JSON.stringify(context)}`;
    }
    
    if (error) {
      logString += ` | Error: ${error.message}`;
      if (error.stack && process.env.NODE_ENV !== 'production') {
        logString += `\nStack: ${error.stack}`;
      }
    }
    
    return logString;
  }

  private createLogEntry(
    level: LogLevel,
    message: string,
    context?: Record<string, any>,
    error?: Error,
    component?: string
  ): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level,
      message,
      context,
      error,
      userId: this.userId,
      sessionId: this.sessionId,
      component,
    };
  }

  private writeLog(entry: LogEntry) {
    if (!this.shouldLog(entry.level)) return;

    const formattedLog = this.formatLogEntry(entry);
    
    // Console output with appropriate method
    switch (entry.level) {
      case LogLevel.DEBUG:
        console.debug(formattedLog);
        break;
      case LogLevel.INFO:
        console.info(formattedLog);
        break;
      case LogLevel.WARN:
        console.warn(formattedLog);
        break;
      case LogLevel.ERROR:
        console.error(formattedLog);
        break;
    }

    // In production, send to monitoring service
    if (process.env.NODE_ENV === 'production' && entry.level >= LogLevel.ERROR) {
      this.sendToMonitoringService(entry);
    }

    // Store in local storage for debugging (development only)
    if (process.env.NODE_ENV === 'development') {
      this.storeLogLocally(entry);
    }
  }

  private sendToMonitoringService(entry: LogEntry) {
    // TODO: Integrate with monitoring service (e.g., Sentry, LogRocket, etc.)
    // This is a placeholder for production monitoring integration
    try {
      // Example: Sentry.captureException(entry.error, { extra: entry.context });
      console.warn('Production monitoring not configured. Log entry:', entry);
    } catch (error) {
      console.error('Failed to send log to monitoring service:', error instanceof Error ? error.message : String(error));
    }
  }

  private storeLogLocally(entry: LogEntry) {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const logs = JSON.parse(localStorage.getItem('polyoracle_logs') || '[]');
        logs.push(entry);
        
        // Keep only last 100 logs to prevent storage overflow
        if (logs.length > 100) {
          logs.splice(0, logs.length - 100);
        }
        
        localStorage.setItem('polyoracle_logs', JSON.stringify(logs));
      }
    } catch (error) {
      console.warn('Failed to store log locally:', error);
    }
  }

  debug(message: string, context?: Record<string, any>, component?: string) {
    const entry = this.createLogEntry(LogLevel.DEBUG, message, context, undefined, component);
    this.writeLog(entry);
  }

  info(message: string, context?: Record<string, any>, component?: string) {
    const entry = this.createLogEntry(LogLevel.INFO, message, context, undefined, component);
    this.writeLog(entry);
  }

  warn(message: string, context?: Record<string, any>, component?: string) {
    const entry = this.createLogEntry(LogLevel.WARN, message, context, undefined, component);
    this.writeLog(entry);
  }

  error(message: string, error?: Error, context?: Record<string, any>, component?: string) {
    const entry = this.createLogEntry(LogLevel.ERROR, message, context, error, component);
    this.writeLog(entry);
  }

  // Agent-specific logging methods
  agentStart(agentType: string, marketId: string, context?: Record<string, any>) {
    this.info(`Agent ${agentType} started`, { 
      marketId, 
      agentType,
      ...context 
    }, 'AgentSystem');
  }

  agentComplete(agentType: string, marketId: string, duration: number, context?: Record<string, any>) {
    this.info(`Agent ${agentType} completed`, { 
      marketId, 
      agentType, 
      duration,
      ...context 
    }, 'AgentSystem');
  }

  agentError(agentType: string, marketId: string, error: Error, context?: Record<string, any>) {
    this.error(`Agent ${agentType} failed`, error, { 
      marketId, 
      agentType,
      ...context 
    }, 'AgentSystem');
  }

  // Stream-specific logging methods
  streamStart(marketId: string, streamType: 'real' | 'mock') {
    this.info('Stream started', { marketId, streamType }, 'StreamSystem');
  }

  streamEnd(marketId: string, streamType: 'real' | 'mock', duration: number, eventCount: number) {
    this.info('Stream ended', { 
      marketId, 
      streamType, 
      duration, 
      eventCount 
    }, 'StreamSystem');
  }

  streamError(marketId: string, error: Error, context?: Record<string, any>) {
    this.error('Stream error', error, { marketId, ...context }, 'StreamSystem');
  }

  // Trade-specific logging methods
  tradeDecision(marketId: string, decision: any, context?: Record<string, any>) {
    this.info('Trade decision made', { 
      marketId, 
      side: decision.side,
      outcome: decision.outcome,
      size: decision.size,
      confidence: decision.confidence,
      ...context 
    }, 'TradeSystem');
  }

  tradeExecution(marketId: string, orderData: any, context?: Record<string, any>) {
    this.info('Trade executed', { 
      marketId, 
      orderId: orderData.orderID,
      status: orderData.status,
      ...context 
    }, 'TradeSystem');
  }

  tradeError(marketId: string, error: Error, context?: Record<string, any>) {
    this.error('Trade error', error, { marketId, ...context }, 'TradeSystem');
  }

  // Data validation logging
  validationError(component: string, field: string, received: any, expected: string) {
    this.warn('Data validation failed', { 
      field, 
      received: typeof received === 'object' ? JSON.stringify(received) : received,
      expected 
    }, component);
  }

  // Performance monitoring
  performanceMetric(operation: string, duration: number, context?: Record<string, any>) {
    this.info(`Performance: ${operation}`, { 
      duration, 
      operation,
      ...context 
    }, 'Performance');
  }

  // Get logs for debugging (development only)
  getLogs(): LogEntry[] {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        return JSON.parse(localStorage.getItem('polyoracle_logs') || '[]');
      } catch (error) {
        this.warn('Failed to retrieve logs from localStorage', { error: error instanceof Error ? error.message : String(error) });
        return [];
      }
    }
    return [];
  }

  // Clear logs (development only)
  clearLogs() {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.removeItem('polyoracle_logs');
      this.info('Logs cleared');
    }
  }
}

// Create singleton instance
const logger = new Logger();

export default logger;

// Export convenience functions
export const log = {
  debug: (message: string, context?: Record<string, any>, component?: string) => 
    logger.debug(message, context, component),
  info: (message: string, context?: Record<string, any>, component?: string) => 
    logger.info(message, context, component),
  warn: (message: string, context?: Record<string, any>, component?: string) => 
    logger.warn(message, context, component),
  error: (message: string, error?: Error, context?: Record<string, any>, component?: string) => 
    logger.error(message, error, context, component),
  
  // Specialized logging functions
  agent: {
    start: (agentType: string, marketId: string, context?: Record<string, any>) => 
      logger.agentStart(agentType, marketId, context),
    complete: (agentType: string, marketId: string, duration: number, context?: Record<string, any>) => 
      logger.agentComplete(agentType, marketId, duration, context),
    error: (agentType: string, marketId: string, error: Error, context?: Record<string, any>) => 
      logger.agentError(agentType, marketId, error, context),
  },
  
  stream: {
    start: (marketId: string, streamType: 'real' | 'mock') => 
      logger.streamStart(marketId, streamType),
    end: (marketId: string, streamType: 'real' | 'mock', duration: number, eventCount: number) => 
      logger.streamEnd(marketId, streamType, duration, eventCount),
    error: (marketId: string, error: Error, context?: Record<string, any>) => 
      logger.streamError(marketId, error, context),
  },
  
  trade: {
    decision: (marketId: string, decision: any, context?: Record<string, any>) => 
      logger.tradeDecision(marketId, decision, context),
    execution: (marketId: string, orderData: any, context?: Record<string, any>) => 
      logger.tradeExecution(marketId, orderData, context),
    error: (marketId: string, error: Error, context?: Record<string, any>) => 
      logger.tradeError(marketId, error, context),
  },
  
  validation: {
    error: (component: string, field: string, received: any, expected: string) => 
      logger.validationError(component, field, received, expected),
  },
  
  performance: (operation: string, duration: number, context?: Record<string, any>) => 
    logger.performanceMetric(operation, duration, context),
};
