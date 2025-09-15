/* eslint-disable @typescript-eslint/no-explicit-any */
// <ai_context>
// This file provides comprehensive data validation utilities for the PolyOracle frontend.
// It includes validation for agent events, trade data, and stream processing with proper
// error handling and fallback mechanisms for production reliability.
// </ai_context>
import { AgentEvent, TradeInfo, AnalysisInfo, ExternalResearchInfo } from "@/types/agent-stream-types";

export class DataValidationError extends Error {
  constructor(message: string, public field?: string, public received?: any) {
    super(message);
    this.name = 'DataValidationError';
  }
}

/**
 * Validates and sanitizes market ID to ensure it's always a string
 */
export function validateMarketId(marketId: unknown): string {
  if (typeof marketId === 'string') {
    return marketId;
  }
  if (typeof marketId === 'number') {
    return marketId.toString();
  }
  throw new DataValidationError('Invalid market ID format', 'market_id', marketId);
}

/**
 * Validates and sanitizes token ID to ensure it's always a string
 */
export function validateTokenId(tokenId: unknown): string {
  if (typeof tokenId === 'string') {
    return tokenId;
  }
  if (typeof tokenId === 'number') {
    return tokenId.toString();
  }
  throw new DataValidationError('Invalid token ID format', 'token_id', tokenId);
}

/**
 * Validates trade info structure and ensures all required fields are present
 */
export function validateTradeInfo(data: unknown): TradeInfo {
  if (!data || typeof data !== 'object') {
    throw new DataValidationError('Trade info must be an object', 'trade_info', data);
  }

  const tradeData = data as Record<string, any>;

  // Validate required fields
  const requiredFields = ['side', 'outcome', 'market_id', 'token_id', 'size', 'reason', 'confidence'];
  for (const field of requiredFields) {
    if (!(field in tradeData) || tradeData[field] === null || tradeData[field] === undefined) {
      throw new DataValidationError(`Missing required field: ${field}`, field, tradeData[field]);
    }
  }

  // Validate side enum
  if (!['BUY', 'SELL', 'NO_TRADE'].includes(tradeData.side)) {
    throw new DataValidationError('Invalid trade side', 'side', tradeData.side);
  }

  // Validate outcome enum
  if (!['YES', 'NO'].includes(tradeData.outcome)) {
    throw new DataValidationError('Invalid trade outcome', 'outcome', tradeData.outcome);
  }

  // Validate confidence range
  const confidence = Number(tradeData.confidence);
  if (isNaN(confidence) || confidence < 0 || confidence > 1) {
    throw new DataValidationError('Confidence must be between 0 and 1', 'confidence', tradeData.confidence);
  }

  // Validate size is a number
  const size = Number(tradeData.size);
  if (isNaN(size) || size < 0) {
    throw new DataValidationError('Size must be a non-negative number', 'size', tradeData.size);
  }

  return {
    side: tradeData.side as "BUY" | "SELL" | "NO_TRADE",
    outcome: tradeData.outcome as "YES" | "NO",
    market_id: validateMarketId(tradeData.market_id),
    token_id: validateTokenId(tradeData.token_id),
    size: size,
    reason: String(tradeData.reason),
    confidence: confidence,
    trade_evaluation_of_market_data: tradeData.trade_evaluation_of_market_data ? String(tradeData.trade_evaluation_of_market_data) : undefined,
  };
}

/**
 * Validates analysis info structure
 */
export function validateAnalysisInfo(data: unknown): AnalysisInfo {
  if (!data || typeof data !== 'object') {
    throw new DataValidationError('Analysis info must be an object', 'analysis_info', data);
  }

  const analysisData = data as Record<string, any>;

  // Validate required fields
  if (!analysisData.analysis_summary || typeof analysisData.analysis_summary !== 'string') {
    throw new DataValidationError('Analysis summary is required and must be a string', 'analysis_summary', analysisData.analysis_summary);
  }

  const confidence = Number(analysisData.confidence);
  if (isNaN(confidence) || confidence < 0 || confidence > 1) {
    throw new DataValidationError('Confidence must be between 0 and 1', 'confidence', analysisData.confidence);
  }

  return {
    analysis_summary: analysisData.analysis_summary,
    confidence: confidence,
    market_metrics: analysisData.market_metrics || {},
    orderbook_analysis: analysisData.orderbook_analysis || {},
    trading_signals: analysisData.trading_signals || {},
    execution_recommendation: analysisData.execution_recommendation || {},
  };
}

/**
 * Validates external research info structure
 */
export function validateExternalResearchInfo(data: unknown): ExternalResearchInfo {
  if (!data || typeof data !== 'object') {
    throw new DataValidationError('External research info must be an object', 'external_research_info', data);
  }

  const researchData = data as Record<string, any>;

  if (!researchData.research_summary || typeof researchData.research_summary !== 'string') {
    throw new DataValidationError('Research summary is required and must be a string', 'research_summary', researchData.research_summary);
  }

  const confidence = Number(researchData.confidence);
  if (isNaN(confidence) || confidence < 0 || confidence > 1) {
    throw new DataValidationError('Confidence must be between 0 and 1', 'confidence', researchData.confidence);
  }

  return {
    research_summary: researchData.research_summary,
    confidence: confidence,
    source_links: Array.isArray(researchData.source_links) ? researchData.source_links : [],
  };
}

/**
 * Validates and sanitizes agent event data
 */
export function validateAgentEvent(data: unknown): AgentEvent {
  if (!data || typeof data !== 'object') {
    throw new DataValidationError('Agent event must be an object', 'agent_event', data);
  }

  const eventData = data as Record<string, any>;

  if (!eventData.name || typeof eventData.name !== 'string') {
    throw new DataValidationError('Event name is required and must be a string', 'name', eventData.name);
  }

  if (!eventData.data || typeof eventData.data !== 'object') {
    throw new DataValidationError('Event data is required and must be an object', 'data', eventData.data);
  }

  const validatedData: AgentEvent['data'] = {
    messages: Array.isArray(eventData.data.messages) ? eventData.data.messages : [],
  };

  // Validate optional fields with proper error handling
  try {
    if (eventData.data.trade_info) {
      validatedData.trade_info = validateTradeInfo(eventData.data.trade_info);
    }
  } catch (error) {
    console.warn('Invalid trade_info in agent event:', error);
    // Don't include invalid trade_info
  }

  try {
    if (eventData.data.analysis_info) {
      validatedData.analysis_info = validateAnalysisInfo(eventData.data.analysis_info);
    }
  } catch (error) {
    console.warn('Invalid analysis_info in agent event:', error);
    // Don't include invalid analysis_info
  }

  try {
    if (eventData.data.external_research_info) {
      validatedData.external_research_info = validateExternalResearchInfo(eventData.data.external_research_info);
    }
  } catch (error) {
    console.warn('Invalid external_research_info in agent event:', error);
    // Don't include invalid external_research_info
  }

  // Include other fields as-is but sanitize market_data
  if (eventData.data.market_data) {
    validatedData.market_data = eventData.data.market_data;
    // Sanitize market ID in market_data if present
    if (validatedData.market_data && validatedData.market_data.id) {
      try {
        validatedData.market_data.id = validateMarketId(validatedData.market_data.id);
      } catch (error) {
        console.warn('Invalid market ID in market_data:', error);
      }
    }
  }

  // Include order_response if present
  if (eventData.data.order_response) {
    validatedData.order_response = eventData.data.order_response;
  }

  return {
    name: eventData.name,
    data: validatedData,
  };
}

/**
 * Safely parses JSON with error handling
 */
export function safeJsonParse(jsonString: string, fallback: any): any {
  try {
    return JSON.parse(jsonString);
  } catch (error) {
    console.warn('Failed to parse JSON:', error);
    return fallback;
  }
}

/**
 * Validates stream chunk structure
 */
export function validateStreamChunk(chunk: any): boolean {
  try {
    // Handle LangGraph streaming chunk formats
    if (chunk && typeof chunk === 'object') {
      // LangGraph "updates" format: { "node_name": { "messages": [...], "other_data": ... } }
      if (chunk.updates && typeof chunk.updates === 'object') {
        return true;
      }
      
      // LangGraph "values" format: { "messages": [...], "other_state": ... }
      if (chunk.values && typeof chunk.values === 'object') {
        return true;
      }
      
      // LangGraph "metadata" format
      if (chunk.metadata) {
        return true;
      }
      
      // Standard chunk format with event and data (allow null data)
      if (chunk.event) {
        return true;
      }
    }
    
    return false;
  } catch (error) {
    console.warn('Chunk validation error:', error);
    return false;
  }
}
