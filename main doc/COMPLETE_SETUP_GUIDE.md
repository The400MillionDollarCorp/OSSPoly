# PolyOracle: Complete Setup Guide for Beginners

## 🎯 What is PolyOracle?

PolyOracle is an intelligent AI trading agent that analyzes and trades on Polymarket, a decentralized prediction market platform. The system consists of:

- **AI Agent "Poly"**: Performs deep market research, analysis, and makes trading decisions
- **Web Interface**: Modern React app where you can monitor the agent's thought process and approve/reject trades
- **Real-time Streaming**: Watch the AI agent work in real-time as it researches and analyzes markets

### Key Features:
- 🔍 **Deep Research**: Uses advanced search engines (Exa, Firecrawl) to gather market intelligence
- 🧠 **AI Analysis**: Leverages GPT-4 to analyze market conditions and sentiment
- 📊 **Smart Trading**: Makes informed buy/sell/hold decisions based on comprehensive analysis
- 🔒 **Human Oversight**: All trades require your approval before execution
- 📈 **Real-time Monitoring**: Production-ready with comprehensive error handling and logging

## 🏗️ Project Architecture

```
PolyOracle/
├── backend/                 # Python AI Agent (LangGraph + LangChain)
│   ├── src/polyoracle/     # Core agent logic
│   ├── tests/              # Test suite
│   └── scripts/            # Utility scripts
├── frontend/               # Next.js Web Application
│   ├── app/                # Next.js app router
│   ├── components/         # React components
│   ├── lib/                # Utilities and actions
│   └── types/              # TypeScript definitions
└── docs/                   # Documentation
```

## 📋 Prerequisites

Before starting, ensure you have:

### Required Software:
- **Python 3.11+** - [Download here](https://www.python.org/downloads/)
- **Node.js 18+** - [Download here](https://nodejs.org/)
- **pnpm** - Install with: `npm install -g pnpm`
- **Git** - [Download here](https://git-scm.com/)

### Required Accounts & API Keys:
- **OpenAI Account** - [Sign up here](https://platform.openai.com/)
- **Exa Account** - [Sign up here](https://exa.ai/)
- **Firecrawl Account** - [Sign up here](https://firecrawl.dev/)
- **Polymarket Wallet** - MetaMask or similar Web3 wallet
- **Polygon Network Setup** - Add Polygon to your wallet

### Optional (for enhanced features):
- **Tavily Account** - [Sign up here](https://tavily.com/) (not actively used)

## 🚀 Step-by-Step Installation

### Step 1: Clone the Repository

```bash
git clone https://github.com/YourUser/polytrader.git
cd polytrader
```

### Step 2: Backend Setup

#### 2.1 Navigate to Backend Directory
```bash
cd backend
```

#### 2.2 Create Python Virtual Environment
```bash
# Windows
python -m venv .venv
.venv\Scripts\activate

# macOS/Linux
python3 -m venv .venv
source .venv/bin/activate
```

#### 2.3 Install Dependencies
```bash
pip install -e ".[dev]"
```

#### 2.4 Set Up Environment Variables
Create a `.env` file in the `backend/` directory:

```bash
# Copy the example file (if it exists) or create new
touch .env
```

Add the following content to `backend/.env`:

```env
# === AI & SEARCH APIs ===
OPENAI_API_KEY=your_openai_api_key_here
EXA_API_KEY=your_exa_api_key_here
FIRECRAWL_API_KEY=your_firecrawl_api_key_here
TAVILY_API_KEY=your_tavily_api_key_here

# === POLYMARKET CONFIGURATION ===
# Your wallet's private key (NEVER share this!)
POLY_PRIVATE_KEY=0x1234567890abcdef...

# Polymarket API credentials (generated automatically)
CLOB_API_KEY=your_clob_api_key
CLOB_SECRET=your_clob_secret
CLOB_PASS_PHRASE=your_clob_passphrase

# Proxy contract address (set after Polymarket setup)
POLYMARKET_PROXY_ADDRESS=0x...

# === DEVELOPMENT SETTINGS ===
LOG_LEVEL=INFO
NODE_ENV=development
ENABLE_MONITORING=false
MAX_CONCURRENT_REQUESTS=5
STREAM_TIMEOUT=300
```

### Step 3: Frontend Setup

#### 3.1 Navigate to Frontend Directory
```bash
cd ../frontend
```

#### 3.2 Install Dependencies
```bash
pnpm install
```

#### 3.3 Set Up Environment Variables
Create a `.env.local` file in the `frontend/` directory:

```env
# === BACKEND CONNECTION ===
LANGGRAPH_DEPLOYMENT_URL=http://localhost:8123

# === FRONTEND CONFIGURATION ===
NEXT_PUBLIC_ENABLE_MOCK_MODE=false
NEXT_PUBLIC_ENABLE_PERFORMANCE_MONITORING=true
NEXT_PUBLIC_STREAM_TIMEOUT=300000

# === POLYMARKET FRONTEND ===
NEXT_PUBLIC_POLYMARKET_PROXY_ADDRESS=0x...
```

## 🔑 Getting Your API Keys

### OpenAI API Key
1. Go to [OpenAI Platform](https://platform.openai.com/)
2. Sign up or log in
3. Navigate to API Keys section
4. Create a new API key
5. Copy the key (starts with `sk-`)

### Exa API Key
1. Go to [Exa.ai](https://exa.ai/)
2. Sign up for an account
3. Navigate to your dashboard
4. Find your API key in the settings
5. Copy the key

### Firecrawl API Key
1. Go to [Firecrawl](https://firecrawl.dev/)
2. Sign up for an account
3. Navigate to your dashboard
4. Generate an API key
5. Copy the key

### Polymarket Setup (Advanced)

#### 4.1 Set Up Your Wallet
1. Install MetaMask or your preferred Web3 wallet
2. Add Polygon network to your wallet:
   - Network Name: Polygon Mainnet
   - RPC URL: https://polygon-rpc.com/
   - Chain ID: 137
   - Currency Symbol: MATIC

#### 4.2 Get Your Private Key
⚠️ **SECURITY WARNING**: Never share your private key with anyone!

1. In MetaMask, go to Account Details
2. Export Private Key
3. Copy the private key (starts with `0x`)
4. Add it to your `.env` file as `POLY_PRIVATE_KEY`

#### 4.3 Generate Polymarket API Credentials
```bash
cd backend
python create_polymarket_creds.py
```

This will output your Polymarket API credentials. Add them to your `.env` file.

#### 4.4 Set Up Proxy Contract
1. Go to [Polymarket](https://polymarket.com/)
2. Connect your wallet
3. Create a proxy contract when prompted
4. Copy the proxy address and add it to both `.env` files

## 🏃‍♂️ Running the Application

### Start Backend (Terminal 1)
```bash
cd backend
# Activate virtual environment if not already active
.venv\Scripts\activate  # Windows
# source .venv/bin/activate  # macOS/Linux

# Start the LangGraph server
make lg-server
# or alternatively: langgraph dev
```

The backend will start on `http://localhost:8123`

### Start Frontend (Terminal 2)
```bash
cd frontend
pnpm dev
```

The frontend will start on `http://localhost:3000`

## 🎮 Using PolyOracle

### First Time Setup
1. Open your browser to `http://localhost:3000`
2. Connect your Web3 wallet
3. Ensure you have some USDC on Polygon for trading
4. Browse available markets or let the AI suggest interesting ones

### Running an Analysis
1. Select a market you want the AI to analyze
2. Click "Start Analysis"
3. Watch in real-time as the AI:
   - Researches the market using multiple sources
   - Analyzes sentiment and market conditions
   - Makes a trading recommendation
4. Review the AI's reasoning and decide whether to approve any suggested trades

### Understanding the AI Process
The AI follows this workflow:
1. **Research Phase**: Gathers information from news, social media, and market data
2. **Analysis Phase**: Processes information to understand market sentiment
3. **Decision Phase**: Makes buy/sell/hold recommendation with reasoning
4. **Execution Phase**: Waits for your approval before making any trades

## 🔧 Configuration Options

### Backend Configuration (`backend/src/polyoracle/configuration.py`)
- `model`: AI model to use (default: gpt-4o-mini)
- `temperature`: AI creativity level (0.0-1.0)
- `max_search_results`: Number of search results per query
- `max_loops`: Maximum analysis iterations

### Frontend Configuration
- `NEXT_PUBLIC_STREAM_TIMEOUT`: How long to wait for AI responses
- `NEXT_PUBLIC_ENABLE_MOCK_MODE`: Use mock data for testing

## 🧪 Testing Your Setup

### Backend Tests
```bash
cd backend
make test
# or: pytest
```

### Frontend Tests
```bash
cd frontend
pnpm test
```

### End-to-End Test
```bash
# Run the production flow test
node test-production-flow.js
```

## 📊 Monitoring and Logs

### Development Logs
- Backend logs appear in your terminal
- Frontend logs appear in browser console
- Check `backend/polyoracle.log` for detailed logs

### Production Monitoring
The system includes comprehensive monitoring:
- Error tracking and alerting
- Performance metrics
- Trade execution monitoring
- Stream processing health checks

## 🚨 Troubleshooting

### Common Issues

#### "Module not found" errors
```bash
# Reinstall dependencies
cd backend && pip install -e ".[dev]"
cd frontend && pnpm install
```

#### "API key not found" errors
- Check your `.env` files exist and have correct variable names
- Ensure no extra spaces around the `=` sign
- Restart both backend and frontend after changing `.env` files

#### "Connection refused" errors
- Ensure backend is running on port 8123
- Check firewall settings
- Verify `LANGGRAPH_DEPLOYMENT_URL` in frontend `.env.local`

#### Polymarket connection issues
- Verify your private key is correct
- Ensure you have MATIC for gas fees
- Check that proxy contract is set up correctly

### Getting Help
1. Check the logs in your terminal
2. Review the error messages in browser console
3. Ensure all environment variables are set correctly
4. Verify your API keys are valid and have sufficient credits

## 🔒 Security Best Practices

### Environment Variables
- Never commit `.env` files to version control
- Use different API keys for development and production
- Regularly rotate your API keys

### Wallet Security
- Never share your private key
- Use a dedicated wallet for trading (not your main wallet)
- Start with small amounts for testing

### Production Deployment
- Use environment-specific configuration files
- Enable monitoring and alerting
- Set up proper backup procedures
- Use SSL certificates for HTTPS

## 📈 Next Steps

Once you have the basic setup working:

1. **Explore Markets**: Try analyzing different types of prediction markets
2. **Customize Prompts**: Modify the AI prompts in `backend/src/polyoracle/prompts.py`
3. **Add Features**: Extend the system with additional analysis tools
4. **Deploy to Production**: Use the production configuration files
5. **Monitor Performance**: Set up comprehensive monitoring and alerting

## 🤝 Contributing

To contribute to PolyOracle:
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## 📚 Additional Resources

- [Polymarket API Documentation](https://docs.polymarket.com/)
- [LangGraph Documentation](https://langchain-ai.github.io/langgraph/)
- [Next.js Documentation](https://nextjs.org/docs)
- [Polygon Network Guide](https://polygon.technology/)

---

**Happy Trading! 🚀**

Remember: This is an AI trading agent. Always review and understand any trades before approving them. Start with small amounts and never invest more than you can afford to lose.
