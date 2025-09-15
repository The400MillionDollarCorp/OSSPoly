"use server";

/* eslint-disable @typescript-eslint/no-explicit-any */
import { Client } from "@langchain/langgraph-sdk";
import { mockAgentStream } from "./mock-stream";
import { validateStreamChunk, DataValidationError } from "@/lib/utils/data-validation";

export interface StreamAgentAnalysisInput {
  marketId: string;
  marketQuestion?: string;
  customInstructions?: string;
  positions?: Array<{
    market_id: string;
    outcome: string;
    shares: number;
    avg_price: number;
  }>;
  availableFunds?: number;
}

class StreamTimeoutError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'StreamTimeoutError';
  }
}

class StreamConnectionError extends Error {
  constructor(message: string, public originalError?: Error) {
    super(message);
    this.name = 'StreamConnectionError';
  }
}

// const DEPLOYMENT_URL = process.env.LANGGRAPH_DEPLOYMENT_URL;
// const ASSISTANT_ID = "polyoracle";
// const USE_MOCK = process.env.NODE_ENV === "development" || !DEPLOYMENT_URL;

export async function streamAgentAnalysis({
  marketId,
  marketQuestion,
  customInstructions,
  positions,
  availableFunds = 10.0,
}: StreamAgentAnalysisInput) {
  console.log("streamAgentAnalysis called with:", {
    marketId,
    marketQuestion,
    customInstructions,
    positions,
    availableFunds,
  });

  const deploymentUrl = process.env.LANGGRAPH_DEPLOYMENT_URL;
  console.log("LANGGRAPH_DEPLOYMENT_URL:", deploymentUrl);

  // Get market data to pass tokens to mock stream
  let market = null;
  let tokens: any[] = [];
  try {
    const { getGammaMarkets } = await import("@/lib/actions/polymarket/get-gamma-markets");
    const response = await getGammaMarkets(1, 0, { marketId: marketId });
    market = response.markets.find(m => m.condition_id === marketId || m.question_id === marketId);
    tokens = market?.tokens || [];
  } catch (e) {
    console.warn("Failed to fetch market data for tokens:", e);
  }

  // If no deployment URL, use mock stream
  if (!deploymentUrl) {
    console.log("Using mock stream (no deployment URL)");
    return mockAgentStream(parseInt(marketId), tokens);
  }

  // Check if we should use mock mode based on environment flag
  const enableMockMode = process.env.NEXT_PUBLIC_ENABLE_MOCK_MODE === "true";
  if (enableMockMode) {
    console.log("Using mock stream (mock mode enabled)");
    return mockAgentStream(parseInt(marketId), tokens);
  }

  // Add timeout and error handling for production streams
  const STREAM_TIMEOUT = 900000; // 15 minutes for deep research operations
  const CONNECTION_TIMEOUT = 60000; // 60 seconds for initial connection

  try {
    const client = new Client({ apiUrl: deploymentUrl });

    // Create a new thread with timeout
    const threadPromise = client.threads.create();
    const thread = await Promise.race([
      threadPromise,
      new Promise((_, reject) => 
        setTimeout(() => reject(new StreamTimeoutError('Thread creation timed out')), CONNECTION_TIMEOUT)
      )
    ]) as { thread_id: string };
    
    console.log("Created thread:", thread.thread_id);

    // Start the stream with validation and error handling
    const stream = client.runs.stream(
      thread.thread_id,
      "polyoracle", // assistant_id from langgraph.json
      {
        input: {
          market_id: marketId,
          market_question: marketQuestion,
          custom_instructions: customInstructions,
          positions: positions,
          available_funds: availableFunds,
          from_js: true,
        },
        streamMode: "values", // Use values mode to get complete state data
      }
    );

    // Wrap the stream with validation and timeout handling
    return createValidatedStream(stream, STREAM_TIMEOUT);
  } catch (error) {
    console.error("Error creating LangGraph stream:", error);
    
    if (error instanceof StreamTimeoutError) {
      console.warn('Stream connection timed out, falling back to mock');
    } else {
      console.warn('Stream connection failed, falling back to mock:', error);
    }
    
    // Fallback to mock stream on error - use tokens if available
    return mockAgentStream(parseInt(marketId), tokens);
  }
}

/**
 * Creates a validated stream wrapper that handles errors and timeouts
 */
function createValidatedStream(originalStream: any, timeout: number) {
  let streamTimeout: NodeJS.Timeout;
  let hasEnded = false;

  const validatedStream = new ReadableStream({
    async start(controller) {
      // Set up stream timeout
      streamTimeout = setTimeout(() => {
        if (!hasEnded) {
          console.warn('Stream timed out after', timeout, 'ms');
          controller.error(new StreamTimeoutError('Stream timed out'));
        }
      }, timeout);

      try {
        let chunkCount = 0;
        for await (const chunk of originalStream) {
          if (hasEnded) break;

          chunkCount++;
          console.log(`Processing chunk ${chunkCount}:`, chunk?.event || 'unknown event');

          try {
            // Validate chunk structure
            const validatedChunk = validateStreamChunk(chunk);
            if (validatedChunk) {
              controller.enqueue(chunk);
              
              // Reset timeout on each successful chunk to handle long operations
              clearTimeout(streamTimeout);
              streamTimeout = setTimeout(() => {
                if (!hasEnded) {
                  console.warn('Stream timed out after', timeout, 'ms of inactivity');
                  controller.error(new StreamTimeoutError('Stream timed out due to inactivity'));
                }
              }, timeout);
            }
          } catch (validationError) {
            if (validationError instanceof DataValidationError) {
              console.warn('Invalid stream chunk received:', validationError.message);
              // Continue processing other chunks
            } else {
              console.error('Unexpected validation error:', validationError);
              controller.error(validationError);
              break;
            }
          }
        }
        
        console.log(`Stream completed successfully after ${chunkCount} chunks`);
        hasEnded = true;
        clearTimeout(streamTimeout);
        controller.close();
      } catch (error) {
        hasEnded = true;
        clearTimeout(streamTimeout);
        console.error('Stream processing error:', error);
        
        // Provide more specific error messages
        if (error instanceof Error) {
          if (error.message.includes('timeout') || error.message.includes('TIMEOUT')) {
            controller.error(new StreamTimeoutError('Backend operation timed out - try again or check backend logs'));
          } else if (error.message.includes('connection') || error.message.includes('network')) {
            controller.error(new StreamConnectionError('Network connection lost - check backend status', error));
          } else {
            controller.error(new StreamConnectionError('Stream processing failed', error));
          }
        } else {
          controller.error(new StreamConnectionError('Unknown stream error occurred'));
        }
      }
    },

    cancel() {
      hasEnded = true;
      clearTimeout(streamTimeout);
      console.log('Stream cancelled by user');
    }
  });

  return validatedStream;
}

/**
 * Creates a mock stream for development and fallback scenarios
 */
// function createMockStream() {
//   console.log("Creating mock stream");
//   
//   return mockAgentStream(0, []);
// }

// Export error classes for use in components
export { StreamTimeoutError, StreamConnectionError };
