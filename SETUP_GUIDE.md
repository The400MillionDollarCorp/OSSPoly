# OSSPoly Setup Guide

## Issues Found and Fixed

### Code Issues Fixed:
1. **Import Statement Updates**: Fixed deprecated LangChain imports
   - Changed `from langchain.schema import` to `from langchain_core.messages import`
   - Updated `from langchain.chat_models import` to `from langchain_core.chat_models import`

2. **Type Annotation Fixes**: 
   - Fixed `dict()` return type annotations to `dict`
   - Removed duplicate field in `SimpleEvent` class
   - Fixed method parameter type hints

3. **Security Improvements**:
   - Replaced unsafe `eval()` with `ast.literal_eval()` in tests
   - Removed debug `pdb.set_trace()` statements

4. **Dependencies**: Created `requirements.txt` with all necessary packages

## Setup Instructions

### Backend Setup

1. **Navigate to backend directory**:
   ```bash
   cd backend
   ```

2. **Install Python dependencies**:
   ```bash
   pip install -r requirements.txt
   ```
   
   Or install core dependencies manually:
   ```bash
   pip install python-dotenv pydantic httpx langgraph langchain-openai
   ```

3. **Environment Configuration**:
   ```bash
   # Copy the example environment file
   cp ../.env.example .env
   
   # Edit .env and add your API keys:
   # - OPENAI_API_KEY
   # - EXA_API_KEY
   # - POLYMARKET_PRIVATE_KEY
   # - POLYMARKET_PROXY_ADDRESS
   ```

4. **Install the package in development mode**:
   ```bash
   pip install -e .
   ```

5. **Run tests**:
   ```bash
   python -m pytest tests/ -v
   ```

6. **Start the LangGraph server**:
   ```bash
   make lg-server
   # or
   langgraph dev
   ```

### Frontend Setup

1. **Navigate to frontend directory**:
   ```bash
   cd frontend
   ```

2. **Install Node.js dependencies**:
   ```bash
   pnpm install
   # or
   npm install
   ```

3. **Environment Configuration**:
   ```bash
   # Copy environment variables to .env.local
   cp ../.env.example .env.local
   
   # Add frontend-specific variables with NEXT_PUBLIC_ prefix
   ```

4. **Start development server**:
   ```bash
   pnpm dev
   # or
   npm run dev
   ```

## Project Architecture

### Backend Components:
- **graph.py**: Main LangGraph workflow orchestrating the AI agent
- **state.py**: Data structures for workflow state management
- **polymarket.py**: Polymarket CLOB API integration
- **tools.py**: External research tools (Exa, Tavily)
- **configuration.py**: Environment and model configuration
- **gamma.py**: Gamma API client for market data

### Frontend Components:
- **app/page.tsx**: Main dashboard page
- **components/**: Reusable UI components
- **lib/actions/**: Server actions for API calls
- **lib/utils.ts**: Utility functions

## API Keys Required:
- **OpenAI API Key**: For AI model access
- **Exa API Key**: For web research capabilities
- **Polymarket Credentials**: For trading functionality
- **Privy App ID**: For Web3 wallet integration

## Testing

### Run Backend Tests:
```bash
cd backend
python test_imports.py  # Basic import tests
python -m pytest tests/ # Full test suite
```

### Test Basic Functionality:
```bash
python setup_test.py  # Automated setup and test
```

## Troubleshooting

### Common Issues:
1. **Import Errors**: Ensure all dependencies are installed
2. **API Key Errors**: Verify .env file configuration
3. **Module Not Found**: Check Python path and package installation

### Debug Steps:
1. Verify Python environment: `python --version`
2. Check installed packages: `pip list`
3. Test basic imports: `python -c "import polyoracle"`
4. Validate environment: Check .env file exists and has required keys

## Next Steps:
1. Configure API keys in .env files
2. Set up Polymarket wallet and proxy contract
3. Test the full workflow with a sample market
4. Deploy to production environment if needed
