# PolyOracle AI Project - Agent Guide

## Build/Test/Lint Commands
- **Backend Tests:** `cd backend && python -m pytest tests/` (single test: `python -m pytest tests/test_file.py`)
- **Backend Lint:** `cd backend && make lint` (format: `make format`)
- **Backend Server:** `cd backend && make lg-server` (or `langgraph dev`)
- **Frontend Dev:** `cd frontend && pnpm dev` (build: `pnpm build`, lint: `pnpm lint`)
- **Frontend Test:** No test commands configured in package.json

## Architecture
- **Backend:** Python LangGraph agent with LangChain, Polymarket CLOB API integration, Exa/Tavily research tools
  - Core modules: `graph.py` (workflow), `state.py` (data structures), `polymarket.py` (trading), `tools.py` (research)
- **Frontend:** Next.js 15 + TypeScript + TailwindCSS + Shadcn UI, Web3 integration via Privy/Wagmi
- **APIs:** OpenAI, Exa (research), Polymarket CLOB, Gamma market data

## Code Style - Backend (Python)
- **Imports:** stdlib → 3rd party → local, use `from langchain_core` not `langchain.schema`
- **Types:** Comprehensive type hints, `Optional[Type]`, `Dict[str, Any]`, Pydantic models with Field descriptions
- **Naming:** PascalCase classes, snake_case functions/vars, UPPER_SNAKE_CASE constants
- **Async:** Consistent async/await, proper signatures with `Annotated[State, InjectedState]`
- **Errors:** Try-catch with descriptive messages, print statements for debugging
- **Security:** Use `ast.literal_eval()` not `eval()`, no `pdb.set_trace()` in production

## Code Style - Frontend (TypeScript)
- **Path alias:** `@/*` for relative imports
- **Strict TypeScript:** All types required, no `any` suppressions
- **UI:** Shadcn components, Tailwind for styling, consistent Radix UI patterns
- **Package Manager:** Use `pnpm` not npm
