"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import React, { useEffect, useState } from "react";
import { format } from "date-fns";
import { BarChart3Icon, TimerIcon, DollarSignIcon } from "lucide-react";
import { streamAgentAnalysis } from "@/lib/actions/agent/stream-agent-analysis";
import { AgentEvent } from "@/types/agent-stream-types";
// import { handleInterrupt } from "@/lib/actions/agent/handle-interruption";
import { AdvancedMarket } from "@/lib/actions/polymarket/getMarkets";
import StreamingAgentConsole from "./streaming-agent-console";

interface MarketDetailClientProps {
  marketId: string;
  initialMarketData: AdvancedMarket;
}

export default function MarketDetailClient({
  marketId,
  initialMarketData,
}: MarketDetailClientProps) {
  const [market, setMarket] = useState<AdvancedMarket | null>(null);

  const [loading, setLoading] = useState<boolean>(true);
  const [agentStarted, setAgentStarted] = useState<boolean>(false);
  const [, setStreamOutput] = useState<string[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [agentEvents, setAgentEvents] = useState<AgentEvent[]>([]);
  // const [streamConfig, setStreamConfig] = useState<any>(null);

  useEffect(() => {
    if (initialMarketData) {
      setMarket(initialMarketData);
      setLoading(false);
    }
  }, [initialMarketData]);

  const handleStartAnalysis = async () => {
    setAgentStarted(true);
    setIsStreaming(true);
    const streamData: any[] = [];

    try {
      const stream = await streamAgentAnalysis({
        marketId,
        marketQuestion: initialMarketData?.question,
        customInstructions: "",
        positions: [],
        availableFunds: 10.0
      });
      const rawStreamData = [];

      // Keep track of successful reflections
      const successfulReflections = new Set<string>();

      for await (const chunk of stream as any) {
        rawStreamData.push(chunk);
        console.log("Received chunk:", JSON.stringify(chunk, null, 2));

        // Skip metadata events
        if (chunk.event === "metadata") continue;

        // Handle both "updates" and "values" events from LangGraph
        if ((chunk.event === "updates" || chunk.event === "values") && chunk.data) {
          // Process each key in the data object as a separate event
          console.log("Processing chunk.data:", chunk.data);
          Object.entries(chunk.data).forEach(([eventName, eventData]) => {
            console.log(`Processing event: ${eventName}`, eventData);
            // Check if this is a successful reflection event
            if (
              eventName.startsWith("reflect_on_") &&
              (
                eventData as { messages?: { status: string }[] }
              )?.messages?.some((m) => m.status === "success")
            ) {
              successfulReflections.add(eventName.replace("reflect_on_", ""));
            }

            const eventInfo = {
              name: eventName,
              data: eventData as Record<string, any>,
              timestamp: new Date().toISOString(),
            };

            streamData.push(eventInfo);

            // Add reflection events always (they can happen multiple times)
            // For non-reflection events, only add if there's no successful reflection yet
            const baseEventName = eventName.replace("reflect_on_", "");
            if (
              eventName.startsWith("reflect_on_") ||
              !successfulReflections.has(baseEventName)
            ) {
              console.log(`Adding event to state: ${eventName}`, eventData);
            setAgentEvents((prev) => [
                ...prev,
                {
                  name: eventName,
                  data: eventData as Record<string, any>,
                },
              ]);
            }
          });
        }

        setStreamOutput((prev) => [...prev]);
      }

      if (rawStreamData[rawStreamData.length - 1].data.__interrupt__) {
        console.log("Interrupt detected");
        // const lastChunk = rawStreamData[rawStreamData.length - 1];
        setStreamOutput((prev) => [...prev]);
        return;
      }

      // Write stream data to file
      // await writeStreamToFile(rawStreamData);
    } catch (err) {
      console.error("Streaming error:", err);
      setError(
        err instanceof Error ? err.message : "An error occurred while streaming"
      );
    } finally {
      setIsStreaming(false);
    }
  };

  const handleTradeConfirmation = async (decision: "YES" | "NO") => {
    console.log("Trade confirmation:", decision);
    
    if (decision === "NO") {
      console.log("Trade cancelled by user");
      return;
    }

    // Find the most recent trade info from agent events
    const tradeEvent = agentEvents
      .slice()
      .reverse()
      .find((event: AgentEvent) => 
        event.data?.trade_info || event.data?.trade_decision
      );

    if (!tradeEvent) {
      console.error("No trade data found in agent events");
      setError("No trade data available for execution");
      return;
    }

    const tradeData = tradeEvent.data?.trade_info || tradeEvent.data?.trade_decision;
    
    if (!tradeData || tradeData.side === "NO_TRADE") {
      console.log("No valid trade to execute");
      return;
    }

    console.log("Executing trade with data:", tradeData);

    try {
      setIsStreaming(true);
      setError(null);

      // Call the backend API to execute the trade
      const response = await fetch('/api/execute-trade', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          market_id: tradeData.market_id,
          token_id: tradeData.token_id,
          side: tradeData.side,
          outcome: tradeData.outcome,
          size: tradeData.size,
          reason: tradeData.reason,
          confidence: tradeData.confidence,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      console.log("Trade execution result:", result);

      // Update agent events with the execution result
      const executionEvent: AgentEvent = {
        name: "trade_execution",
        data: {
          messages: [{
            content: `Trade executed successfully. Order ID: ${result.orderID || 'N/A'}`,
            type: "ai",
            name: null,
            id: `trade_exec_${Date.now()}`,
          }],
          execution_result: result,
        },
        timestamp: new Date().toISOString(),
      };

      setAgentEvents((prev: AgentEvent[]) => [...prev, executionEvent]);

    } catch (error) {
      console.error("Trade execution failed:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
      setError(`Trade execution failed: ${errorMessage}`);
      
      // Add error event to agent events
      const errorEvent: AgentEvent = {
        name: "trade_execution_error",
        data: {
          messages: [{
            content: `Trade execution failed: ${errorMessage}`,
            type: "ai",
            name: null,
            id: `trade_error_${Date.now()}`,
          }],
          error: errorMessage,
        },
        timestamp: new Date().toISOString(),
      };
      
      setAgentEvents((prev: AgentEvent[]) => [...prev, errorEvent]);
    } finally {
      setIsStreaming(false);
    }
  };

  if (loading || !market) {
    return (
      <div className="w-full h-96 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-muted-foreground">Loading market data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {!agentStarted ? (
        <div className="space-y-6">
          <div className="flex items-start gap-6">
            <div className="w-24 h-24 rounded-lg overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={market.icon}
                alt={market.question}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex-1">
              <h1 className="text-3xl font-bold mb-2">{market.question}</h1>
              <p className="text-muted-foreground whitespace-pre-line">
                {market.description}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              icon={<DollarSignIcon className="w-5 h-5" />}
              title="Volume"
              value={`$${market.volume.toLocaleString()}`}
            />
            <StatCard
              icon={<BarChart3Icon className="w-5 h-5" />}
              title="Liquidity"
              value={`$${market.liquidity.toLocaleString()}`}
            />
            <StatCard
              icon={<TimerIcon className="w-5 h-5" />}
              title="Ends"
              value={format(new Date(market.end_date), "MMM d, yyyy")}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="rounded-xl border bg-card p-6">
              <h2 className="text-xl font-semibold mb-4">Current Prices</h2>
              <div className="space-y-4">
                {market.outcomes.map(({ outcome, price }) => (
                  <div
                    key={outcome}
                    className="flex items-center justify-between"
                  >
                    <span className="font-medium">{outcome}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-2xl font-bold">
                        {(parseFloat(price) * 100).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-xl border bg-card p-6">
              <h2 className="text-xl font-semibold mb-4">Market Info</h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Category</span>
                  <span className="font-medium">{market.category}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-center">
            <button
              onClick={handleStartAnalysis}
              className="bg-primary text-primary-foreground hover:bg-primary/90 px-8 py-3 rounded-lg font-medium transition-colors"
            >
              Run AI Analysis
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-6">
            <div className="rounded-xl border bg-card p-6">
              <div className="flex items-start gap-4">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={market.icon}
                  alt={market.question}
                  className="w-16 h-16 rounded-lg"
                />
                <div>
                  <h2 className="text-xl font-semibold">{market.question}</h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    Ends {format(new Date(market.end_date), "MMM d, yyyy")}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-xl border bg-card p-6 space-y-4">
              <h3 className="font-semibold">Market Stats</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Volume</p>
                  <p className="font-medium">
                    ${market.volume.toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Liquidity</p>
                  <p className="font-medium">
                    ${market.liquidity.toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Category</p>
                  <p className="font-medium">{market.category}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:row-span-2">
            {error ? (
              <div className="text-red-500">{error}</div>
            ) : (
              <StreamingAgentConsole
                isStreaming={isStreaming}
                agentEvents={agentEvents}
                onTradeConfirmation={handleTradeConfirmation}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

interface StatCardProps {
  icon: React.ReactNode;
  title: string;
  value: string;
}

function StatCard({ icon, title, value }: StatCardProps) {
  return (
    <div className="rounded-xl border bg-card p-6">
      <div className="flex items-center gap-2 text-muted-foreground mb-2">
        {icon}
        <span className="text-sm">{title}</span>
      </div>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  );
}
