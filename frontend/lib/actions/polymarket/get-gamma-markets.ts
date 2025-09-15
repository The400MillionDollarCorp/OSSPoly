"use server";

import { mapToFrontendMarkets } from "@/lib/utils";
import { AdvancedMarket } from "./getMarkets";

export interface RawGammaMarket {
  id: string;
  question: string;
  conditionId: string;
  slug: string;
  resolutionSource: string;
  endDate: string;
  startDate: string;
  image: string;
  icon: string;
  description: string;
  outcomes: string; // This is a JSON string
  outcomePrices: string; // This is a JSON string
  volume: string;
  liquidity: string;
  active: boolean;
  closed: boolean;
  marketMakerAddress: string;
  createdAt: string;
  updatedAt: string;
  new: boolean;
  featured: boolean;
  submitted_by: string;
  archived: boolean;
  restricted: boolean;
  groupItemTitle: string;
  groupItemThreshold: string;
  enableOrderBook: boolean;
  orderPriceMinTickSize: number;
  orderMinSize: number;
  startDateIso: string;
  volume24hrAmm: number;
  volume24hrClob: number;
  volumeAmm: number;
  volumeClob: number;
  liquidityAmm: number;
  liquidityClob: number;
  negRisk: boolean;
  spread: number;
  oneDayPriceChange: number;
  lastTradePrice: number;
  bestBid: number;
  bestAsk: number;
  clobTokenIds: string; // This is a JSON string
}

export interface GammaMarket {
  id: string;
  question: string;
  conditionId: string;
  slug: string;
  resolutionSource: string;
  endDate: string;
  startDate: string;
  image: string;
  icon: string;
  description: string;
  outcomes: string[];
  clobTokenIds: string[];
  outcomePrices: string[];
  volume: string;
  liquidity: string;
  active: boolean;
  closed: boolean;
  marketMakerAddress: string;
  createdAt: string;
  updatedAt: string;
  new: boolean;
  featured: boolean;
  submitted_by: string;
  archived: boolean;
  restricted: boolean;
  groupItemTitle: string;
  groupItemThreshold: string;
  enableOrderBook: boolean;
  orderPriceMinTickSize: number;
  orderMinSize: number;
  startDateIso: string;
  volume24hrAmm: number;
  volume24hrClob: number;
  volumeAmm: number;
  volumeClob: number;
  liquidityAmm: number;
  liquidityClob: number;
  negRisk: boolean;
  spread: number;
  oneDayPriceChange: number;
  lastTradePrice: number;
  bestBid: number;
  bestAsk: number;
}

interface GammaMarketsResponse {
  markets: AdvancedMarket[];
}

function safeJsonParse<T>(
  jsonString: string | null | undefined,
  defaultValue: T
): T {
  if (!jsonString) return defaultValue;
  try {
    return JSON.parse(jsonString) as T;
  } catch (error) {
    console.warn("Failed to parse JSON string:", error);
    return defaultValue;
  }
}

export async function getGammaMarkets(
  limit: number = 25,
  offset: number = 0,
  options?: {
    marketId?: string;
    order?: string;
    ascending?: boolean;
    archived?: boolean;
    active?: boolean;
    closed?: boolean;
    liquidityNumMin?: number;
    volumeNumMin?: number;
    startDateMin?: string;
    endDateMin?: string;
    featured?: boolean;
    tagId?: string;
    relatedTags?: boolean;
  }
): Promise<GammaMarketsResponse> {
  const params = new URLSearchParams({
    limit: limit.toString(),
    offset: offset.toString(),
  });

  // Add optional parameters if they exist
  if (options) {
    if (options.marketId) params.append("id", options.marketId);
    if (options.order) {
      params.append("order", options.order);
      if (options.ascending !== undefined) {
        params.append("ascending", options.ascending.toString());
      }
    }
    if (options.archived !== undefined)
      params.append("archived", options.archived.toString());
    if (options.active !== undefined)
      params.append("active", options.active.toString());
    if (options.closed !== undefined)
      params.append("closed", options.closed.toString());
    if (options.liquidityNumMin !== undefined)
      params.append("liquidity_num_min", options.liquidityNumMin.toString());
    if (options.volumeNumMin !== undefined)
      params.append("volume_num_min", options.volumeNumMin.toString());
    if (options.startDateMin)
      params.append("start_date_min", options.startDateMin);
    if (options.endDateMin) params.append("end_date_min", options.endDateMin);
    if (options.featured !== undefined)
      params.append("featured", options.featured.toString());
    if (options.tagId) params.append("tag_id", options.tagId);
    if (options.relatedTags)
      params.append("related_tags", options.relatedTags.toString());
  } else {
    // Default filters when no options provided
    params.append("active", "true");
    params.append("closed", "false");
  }

  const url = `https://gamma-api.polymarket.com/markets?${params}`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // Increased to 30 seconds
    
    const response = await fetch(url, {
      next: { revalidate: 60 }, // Cache for 60 seconds
      signal: controller.signal,
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'PolyOracle/1.0'
      }
    });
    
    clearTimeout(timeoutId);

    if (!response.ok) {
      console.error("HTTP error! status:", response.status);
      throw new Error(`HTTP error! status Text: ${response.statusText}`);
    }

    const rawData = await response.json();
    
    console.log(`Gamma API returned ${rawData.length} markets`);
    console.log("First 3 markets:", rawData.slice(0, 3));

    // log all categories for each market if they exist
    for (const market of rawData) {
      if (market.category) {
        console.log(`Market ${market.id} category:`, market.category);
      } else {
        console.log(`Market ${market.id} has no category`);
      }
    }

    // Parse the JSON strings in the response
    const data: GammaMarket[] = rawData
      .filter((market: RawGammaMarket) => {
        // Only include markets that have clobTokenIds
        const tokens = safeJsonParse<string[]>(market.clobTokenIds, []);
        return tokens.length === 2; // Ensure it's a binary market with both token IDs
      })
      .map((market: RawGammaMarket) => {
        // Create the base market object
        const baseMarket = {
          ...market,
          outcomes: safeJsonParse<string[]>(market.outcomes, []),
          clobTokenIds: safeJsonParse<string[]>(market.clobTokenIds, []),
          outcomePrices: safeJsonParse<string[]>(market.outcomePrices, []),
          volumeNum: parseFloat(market.volume || "0"),
          liquidityNum: parseFloat(market.liquidity || "0"),
          title: market.question,
          endDate: market.endDate,
          startDate: market.startDate,
          imageUrl: market.image,
          category: market.groupItemTitle || "General",
          subcategory: "",
          status: market.closed
            ? "closed"
            : market.active
            ? "active"
            : "inactive",
        };

        return baseMarket;
      });
    // log 5 markets
    // console.log(data.markets.slice(0, 5));

    const frontendMarkets = mapToFrontendMarkets(data);
    
    console.log(`Processed ${frontendMarkets.length} frontend markets`);
    console.log("Sample frontend market:", frontendMarkets[0]);

    return { markets: frontendMarkets };
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      console.warn("Gamma markets request timed out, providing fallback data");
    } else {
      console.error("Error fetching Gamma markets:", error);
    }
    
    // Provide fallback mock data that matches AdvancedMarket interface
    const mockMarkets: AdvancedMarket[] = [
      {
        condition_id: "mock-condition-517817",
        question_id: "mock-question-517817", 
        tokens: [
          { token_id: "123456", outcome: "Yes" },
          { token_id: "789012", outcome: "No" }
        ],
        outcomePrices: ["0.55", "0.45"],
        rewards: {
          min_size: 1,
          max_spread: 0.1,
          event_start_date: "2024-01-01",
          event_end_date: "2024-11-05",
          in_game_multiplier: 1.0,
          reward_epoch: 1
        },
        minimum_order_size: "1.0",
        minimum_tick_size: "0.01",
        description: "Mock market data due to API unavailability",
        category: "Politics",
        end_date: "2024-11-05T23:59:59Z",
        end_date_iso: "2024-11-05T23:59:59Z",
        game_start_time: "2024-01-01T00:00:00Z",
        question: "Will Donald Trump win the 2024 US Presidential Election?",
        market_slug: "trump-2024-election",
        min_incentive_size: "10.0",
        max_incentive_spread: "0.05",
        active: true,
        closed: false,
        seconds_delay: 0,
        icon: "",
        fpmm: "0x0000000000000000000000000000000000000000",
        outcomes: [
          { outcome: "Yes", price: "0.55" },
          { outcome: "No", price: "0.45" }
        ],
        volume: "1000000",
        volume24hrClob: 25000,
        volume24hrAmm: 50000,
        liquidity: "500000",
        liquidityClob: 100000,
        volumeClob: 250000,
        featured: true
      }
    ];
    
    console.log("Returning mock market data due to API failure");
    return { markets: mockMarkets };
  }
}
