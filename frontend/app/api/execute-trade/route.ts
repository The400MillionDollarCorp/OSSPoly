import { NextRequest, NextResponse } from 'next/server';

interface TradeExecutionRequest {
  market_id: string;
  token_id: string;
  side: "BUY" | "SELL";
  outcome: "YES" | "NO";
  size: number;
  reason: string;
  confidence: number;
}

interface TradeExecutionResponse {
  success: boolean;
  orderID?: string;
  takingAmount?: string;
  makingAmount?: string;
  status?: string;
  transactionsHashes?: string[];
  errorMsg?: string;
  message?: string;
}

export async function POST(request: NextRequest): Promise<NextResponse<TradeExecutionResponse>> {
  try {
    const body: TradeExecutionRequest = await request.json();
    
    console.log("Trade execution request:", body);

    // Validate required fields
    const requiredFields: (keyof TradeExecutionRequest)[] = [
      'market_id', 'token_id', 'side', 'outcome', 'size'
    ];

    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { 
            success: false, 
            errorMsg: `Missing required field: ${field}`,
            message: `Field ${field} is required for trade execution`
          },
          { status: 400 }
        );
      }
    }

    // Check if size is a positive number
    if (body.size <= 0) {
      return NextResponse.json(
        {
          success: false,
          errorMsg: "Invalid trade size",
          message: "Trade size must be a positive number"
        },
        { status: 400 }
      );
    }

    // Get backend URL from environment
    const backendUrl = process.env.POLYORACLE_BACKEND_URL || 'http://127.0.0.1:2024';
    
    console.log("Calling backend at:", backendUrl);

    // Call the backend trade execution API
    const backendResponse = await fetch(`${backendUrl}/execute-trade`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        market_id: body.market_id,
        token_id: body.token_id,
        side: body.side,
        outcome: body.outcome,
        size: body.size,
        reason: body.reason,
        confidence: body.confidence,
      }),
    });

    if (!backendResponse.ok) {
      const errorData = await backendResponse.json().catch(() => ({ 
        message: `Backend request failed with status ${backendResponse.status}` 
      }));
      
      console.error("Backend trade execution failed:", errorData);
      
      return NextResponse.json(
        {
          success: false,
          errorMsg: errorData.message || "Backend trade execution failed",
          message: `Trade execution failed: ${errorData.message || backendResponse.statusText}`
        },
        { status: backendResponse.status }
      );
    }

    const result = await backendResponse.json();
    console.log("Backend trade execution result:", result);

    // Return the successful result
    return NextResponse.json({
      success: true,
      orderID: result.orderID || result.order_id,
      takingAmount: result.takingAmount || result.taking_amount || "0",
      makingAmount: result.makingAmount || result.making_amount || "0",
      status: result.status || "pending",
      transactionsHashes: result.transactionsHashes || result.transaction_hashes || [],
      message: result.message || "Trade executed successfully",
      ...result, // Include any additional fields from backend
    });

  } catch (error) {
    console.error("Trade execution API error:", error);
    
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
    
    return NextResponse.json(
      {
        success: false,
        errorMsg: errorMessage,
        message: `Internal server error: ${errorMessage}`
      },
      { status: 500 }
    );
  }
}

export async function GET(): Promise<NextResponse> {
  return NextResponse.json(
    { 
      message: "Trade execution endpoint. Use POST to execute trades.",
      method: "POST",
      requiredFields: ["market_id", "token_id", "side", "outcome", "size"]
    },
    { status: 405 }
  );
}
