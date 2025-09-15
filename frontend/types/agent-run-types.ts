/* <ai_context>
   This file contains TypeScript interfaces describing the shape of the agentic run data
   from the Polymarket AI system. Updated for production consistency.
</ai_context> */

export interface ToolCall {
  name: string;
  args?: Record<string, unknown>;
  type?: string;
  id?: string;
}

export interface Message {
  content: string;
  additional_kwargs?: Record<string, unknown>;
  response_metadata?: Record<string, unknown> | null;
  type: string;
  name: string | null;
  id: string;
  example?: boolean;
  tool_calls?: ToolCall[];
  invalid_tool_calls?: unknown[];
  usage_metadata?: unknown | null;
}

// Consolidated TradeInfo interface matching backend
export interface TradeInfo {
  side: "BUY" | "SELL" | "NO_TRADE";
  outcome: "YES" | "NO";
  market_id: string;
  token_id: string;
  size: number;
  reason: string;
  confidence: number;
  trade_evaluation_of_market_data?: string;
}

// Single AgentRunData interface
export interface AgentRunData {
  messages: Message[];
  trade_info?: TradeInfo;
  loop_step?: number;
  market_id: string; // Always string for consistency
  external_research_info?: {
    research_summary: string;
    confidence: number;
    source_links?: string[];
  };
  analysis_info?: {
    analysis_summary: string;
    confidence: number;
    market_metrics?: Record<string, any>;
    orderbook_analysis?: Record<string, any>;
    trading_signals?: Record<string, any>;
    execution_recommendation?: Record<string, any>;
  };
}

export interface AgentBalance {
  usdcBalance: string;
  usdceBalance: string;
}

export interface WithdrawResult {
  success: boolean;
  amount: string;
  hash: string;
}

export interface DepositResult {
  success: boolean;
  amount: string;
  hash: string;
}

// Order response interface matching backend
export interface OrderResponse {
  errorMsg: string;
  orderID: string;
  takingAmount: string;
  makingAmount: string;
  status: string;
  transactionsHashes: string[];
}
