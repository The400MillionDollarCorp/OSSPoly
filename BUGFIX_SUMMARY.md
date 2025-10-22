# Bug Fix Summary - Stream Recursion Limit Error

**Date:** October 22, 2025  
**Status:** ✅ RESOLVED

---

## The Problem

When analyzing markets, the agent workflow would complete successfully but hit a "Recursion limit of 25 reached" error, causing the stream to fail and the frontend to show an error message.

**Error Message:**
```
ERROR:simple_server:Error in agent stream: Recursion limit of 25 reached without hitting a stop condition.
```

---

## Root Cause

The LangGraph workflow had a logic flaw in the `route_after_reflect_on_trade` function:

**Before (Buggy Code):**
```python
if state.trade_info.get("side") in ["BUY", "SELL"]:
    if state.from_js:
        return "human_confirmation_js"
    else:
        return "human_confirmation"

# If validation was successful, end the workflow
if last_msg.status == "success":
    return "__end__"

# Otherwise, try one more trade decision
return "trade_agent"  # ❌ This creates infinite loop for NO_TRADE!
```

When the agent made a `NO_TRADE` decision (which is valid and expected), the logic would:
1. Skip the BUY/SELL check
2. Fall through to `return "trade_agent"`
3. Loop back to trade_agent → reflect_on_trade → trade_agent → ...
4. Eventually hit LangGraph's 25-step recursion limit

---

## The Fix

Added explicit handling for `NO_TRADE` decisions to properly end the workflow:

**After (Fixed Code):**
```python
# Check if we have a valid trade decision
if state.trade_info.get("side") in ["BUY", "SELL"]:
    if state.from_js:
        return "human_confirmation_js"
    else:
        return "human_confirmation"

# If trade decision is NO_TRADE, end the workflow ✅
if state.trade_info.get("side") == "NO_TRADE":
    print("ROUTE_AFTER_REFLECT_ON_TRADE: NO_TRADE detected, ending workflow")
    return "__end__"

# If validation was successful, end the workflow
if last_msg.status == "success":
    return "__end__"

# If we've exceeded max loops, end anyway
if state.loop_step >= configuration.max_loops:
    print(f"ROUTE_AFTER_REFLECT_ON_TRADE: Max loops ({configuration.max_loops}) exceeded, ending workflow")
    return "__end__"

# Otherwise, try one more trade decision
return "trade_agent"
```

---

## Files Modified

### Backend
- **`/backend/src/polyoracle/graph.py`** (lines 1414-1444)
  - Added NO_TRADE check in `route_after_reflect_on_trade` function
  - Added debug logging for max loops condition

### Frontend (Cleanup Only)
- **`/frontend/lib/actions/agent/stream-agent-analysis.ts`**
  - Removed verbose diagnostic logging (kept essential error handling)
- **`/frontend/app/markets/[id]/_components/market-detail-client.tsx`**
  - Removed verbose diagnostic logging

---

## How to Verify the Fix

1. **Start the backend:**
   ```bash
   cd backend
   source .venv/bin/activate
   langgraph dev
   ```

2. **Start the frontend:**
   ```bash
   cd frontend
   pnpm dev
   ```

3. **Test a market analysis:**
   - Navigate to any market
   - Click "Start Analysis"
   - Agent should complete successfully
   - Backend logs should show: `ROUTE_AFTER_REFLECT_ON_TRADE: NO_TRADE detected, ending workflow`
   - Frontend should display the complete analysis

---

## Technical Details

**Why NO_TRADE is Valid:**
- When the agent determines conditions are not favorable for trading
- When available funds are $0 (as in the test case)
- When market uncertainty is too high
- This is correct risk management behavior

**Why the Loop Occurred:**
- LangGraph workflows continue until they reach a node that returns `"__end__"`
- Without explicit NO_TRADE handling, the workflow had no termination condition
- Each iteration counted toward the 25-step limit

**Why 25 Steps?**
- LangGraph's default recursion limit prevents infinite loops
- Typical workflows complete in 5-15 steps
- Our workflow was reaching 25+ due to the unintended loop

---

## Lessons Learned

1. **Always handle all enum cases explicitly** - Don't rely on fall-through logic
2. **Graph routing functions need clear termination conditions** - Every possible state should have a path to `__end__`
3. **Diagnostic logging is invaluable** - The verbose logs we added helped identify the exact issue quickly
4. **Test NO_TRADE scenarios** - Edge cases like $0 funds expose routing logic bugs

---

## Future Prevention

Consider adding:
1. **Unit tests** for routing functions that verify all trade decision types reach proper endpoints
2. **Integration tests** that run the full workflow with NO_TRADE scenarios
3. **Explicit exhaustiveness checks** for trade decision enums in TypeScript/Python
4. **Graph visualization** to verify all paths eventually reach `__end__`
