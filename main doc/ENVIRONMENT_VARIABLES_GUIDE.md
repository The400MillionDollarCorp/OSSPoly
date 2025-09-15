# Environment Variables Setup Guide

## Overview
This guide provides detailed instructions for setting up all required environment variables for both the backend and frontend components of PolyOracle.

## Backend Environment Variables (`backend/.env`)

Create a `.env` file in the `backend/` directory with the following variables:

### AI & Search APIs
```env
# OpenAI API Key - Required for AI agent functionality
# Get from: https://platform.openai.com/api-keys
OPENAI_API_KEY=sk-your_openai_api_key_here

# Exa API Key - Required for deep research functionality
# Get from: https://exa.ai/dashboard
EXA_API_KEY=your_exa_api_key_here

# Firecrawl API Key - Required for web scraping and content extraction
# Get from: https://firecrawl.dev/dashboard
FIRECRAWL_API_KEY=your_firecrawl_api_key_here

# Tavily API Key - Optional (not actively used but may be required)
# Get from: https://tavily.com/dashboard
TAVILY_API_KEY=your_tavily_api_key_here
```

### Polymarket Configuration
```env
# Your wallet's private key - CRITICAL for trading functionality
# Get from: Your MetaMask wallet (Account Details > Export Private Key)
# WARNING: Keep this secret and never share it!
POLY_PRIVATE_KEY=0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef

# Polymarket API credentials - Generated using create_polymarket_creds.py
# Run: python create_polymarket_creds.py to generate these
CLOB_API_KEY=your_generated_clob_api_key
CLOB_SECRET=your_generated_clob_secret
CLOB_PASS_PHRASE=your_generated_clob_passphrase

# Proxy contract address - Set after creating proxy on Polymarket
# Get from: Polymarket website after connecting wallet and creating proxy
POLYMARKET_PROXY_ADDRESS=0x1234567890123456789012345678901234567890
```

### Development Settings
```env
# Logging level - Controls verbosity of logs
# Options: DEBUG, INFO, WARNING, ERROR, CRITICAL
LOG_LEVEL=INFO

# Environment mode
# Options: development, staging, production
NODE_ENV=development

# Monitoring - Enable/disable monitoring features
# Options: true, false
ENABLE_MONITORING=false

# Request limits - Maximum concurrent requests to handle
# Recommended: 5 for development, 10+ for production
MAX_CONCURRENT_REQUESTS=5

# Stream timeout - How long to wait for streaming responses (seconds)
# Recommended: 300 (5 minutes)
STREAM_TIMEOUT=300
```

## Frontend Environment Variables (`frontend/.env.local`)

Create a `.env.local` file in the `frontend/` directory with the following variables:

### Backend Connection
```env
# LangGraph deployment URL - Points to your backend server
# Development: http://localhost:8123
# Production: https://your-deployed-backend.com
LANGGRAPH_DEPLOYMENT_URL=http://localhost:8123
```

### Frontend Configuration
```env
# Mock mode - Use mock data instead of real API calls
# Options: true, false
# Recommended: false for normal operation, true for testing without APIs
NEXT_PUBLIC_ENABLE_MOCK_MODE=false

# Performance monitoring - Enable performance tracking
# Options: true, false
NEXT_PUBLIC_ENABLE_PERFORMANCE_MONITORING=true

# Stream timeout - How long to wait for AI responses (milliseconds)
# Recommended: 300000 (5 minutes)
NEXT_PUBLIC_STREAM_TIMEOUT=300000
```

### Polymarket Frontend Configuration
```env
# Proxy contract address - Same as backend, used for frontend display
NEXT_PUBLIC_POLYMARKET_PROXY_ADDRESS=0x1234567890123456789012345678901234567890
```

## Production Environment Variables

### Backend Production (`backend/.env.production`)
```env
# AI APIs (same as development)
OPENAI_API_KEY=sk-prod_your_production_openai_key
EXA_API_KEY=your_production_exa_key
FIRECRAWL_API_KEY=your_production_firecrawl_key

# Polymarket (use production wallet and keys)
POLY_PRIVATE_KEY=0x_your_production_private_key
CLOB_API_KEY=your_production_clob_key
CLOB_SECRET=your_production_clob_secret
CLOB_PASS_PHRASE=your_production_clob_passphrase
POLYMARKET_PROXY_ADDRESS=0x_your_production_proxy_address

# Production settings
LOG_LEVEL=INFO
NODE_ENV=production
ENABLE_MONITORING=true
MAX_CONCURRENT_REQUESTS=10
STREAM_TIMEOUT=300

# Additional production variables
SENTRY_DSN=your_sentry_dsn_for_error_tracking
DATABASE_URL=your_production_database_url
REDIS_URL=your_redis_url_for_caching
```

### Frontend Production (`frontend/.env.production`)
```env
# Production backend URL
LANGGRAPH_DEPLOYMENT_URL=https://your-production-backend.com

# Production settings
NEXT_PUBLIC_ENABLE_MOCK_MODE=false
NEXT_PUBLIC_ENABLE_PERFORMANCE_MONITORING=true
NEXT_PUBLIC_STREAM_TIMEOUT=300000

# Production Polymarket
NEXT_PUBLIC_POLYMARKET_PROXY_ADDRESS=0x_your_production_proxy_address

# Additional production variables
NEXT_PUBLIC_SENTRY_DSN=your_frontend_sentry_dsn
NEXT_PUBLIC_ANALYTICS_ID=your_analytics_tracking_id
```

## How to Obtain Each API Key

### 1. OpenAI API Key
1. Visit [OpenAI Platform](https://platform.openai.com/)
2. Sign up or log in to your account
3. Navigate to "API Keys" in the left sidebar
4. Click "Create new secret key"
5. Copy the key (starts with `sk-`)
6. **Important**: Add billing information to avoid rate limits

### 2. Exa API Key
1. Visit [Exa.ai](https://exa.ai/)
2. Sign up for an account
3. Go to your dashboard
4. Find "API Keys" section
5. Generate a new API key
6. Copy the key for use in your `.env` file

### 3. Firecrawl API Key
1. Visit [Firecrawl](https://firecrawl.dev/)
2. Create an account
3. Navigate to your dashboard
4. Go to "API Keys" or "Settings"
5. Generate a new API key
6. Copy the key

### 4. Polymarket Credentials

#### Step 1: Get Private Key
1. Open MetaMask (or your Web3 wallet)
2. Click on your account name
3. Select "Account Details"
4. Click "Export Private Key"
5. Enter your password
6. Copy the private key (starts with `0x`)

#### Step 2: Generate API Credentials
1. Add your private key to `backend/.env` as `POLY_PRIVATE_KEY`
2. Run the credential generation script:
   ```bash
   cd backend
   python create_polymarket_creds.py
   ```
3. Copy the output credentials to your `.env` file

#### Step 3: Set Up Proxy Contract
1. Visit [Polymarket](https://polymarket.com/)
2. Connect your wallet
3. Follow prompts to create a proxy contract
4. Copy the proxy contract address
5. Add it to both backend and frontend `.env` files

## Environment Variable Security

### Development Security
- Never commit `.env` files to version control
- Use different API keys for development and production
- Keep your private keys secure and never share them
- Use a dedicated development wallet with minimal funds

### Production Security
- Use environment variable management services (AWS Secrets Manager, etc.)
- Rotate API keys regularly
- Monitor API key usage for unusual activity
- Use separate production wallets with appropriate security measures
- Enable monitoring and alerting for all production services

### Git Security
Add to your `.gitignore` file:
```gitignore
# Environment variables
.env
.env.local
.env.production
.env.staging
*.env

# Logs
*.log
logs/
```

## Validation and Testing

### Backend Validation
Test your backend environment variables:
```bash
cd backend
python -c "
import os
from dotenv import load_dotenv
load_dotenv()

required_vars = ['OPENAI_API_KEY', 'EXA_API_KEY', 'POLY_PRIVATE_KEY']
for var in required_vars:
    value = os.getenv(var)
    if value:
        print(f'✅ {var}: Set (length: {len(value)})')
    else:
        print(f'❌ {var}: Not set')
"
```

### Frontend Validation
Test your frontend environment variables:
```bash
cd frontend
node -e "
const requiredVars = ['LANGGRAPH_DEPLOYMENT_URL'];
requiredVars.forEach(varName => {
  const value = process.env[varName];
  if (value) {
    console.log(\`✅ \${varName}: \${value}\`);
  } else {
    console.log(\`❌ \${varName}: Not set\`);
  }
});
"
```

## Troubleshooting

### Common Issues

#### "Environment variable not found"
- Check file names: `.env` (not `.env.txt`)
- Ensure no spaces around the `=` sign
- Restart your application after changing `.env` files

#### "Invalid API key" errors
- Verify the API key is copied correctly
- Check if the API key has expired
- Ensure you have sufficient credits/quota

#### "Private key invalid" errors
- Ensure the private key starts with `0x`
- Verify it's the correct private key for your wallet
- Check that the wallet has MATIC for gas fees

#### Frontend can't connect to backend
- Verify `LANGGRAPH_DEPLOYMENT_URL` is correct
- Ensure the backend is running on the specified port
- Check firewall and network settings

### Environment Loading Order
1. System environment variables
2. `.env.local` (frontend only)
3. `.env.production` or `.env.development`
4. `.env`

Variables loaded later override earlier ones.

## Quick Setup Checklist

### Backend Setup ✅
- [ ] Create `backend/.env` file
- [ ] Add OpenAI API key
- [ ] Add Exa API key
- [ ] Add Firecrawl API key
- [ ] Add wallet private key
- [ ] Generate Polymarket API credentials
- [ ] Set up proxy contract address
- [ ] Configure development settings

### Frontend Setup ✅
- [ ] Create `frontend/.env.local` file
- [ ] Set backend URL
- [ ] Configure frontend settings
- [ ] Add proxy contract address
- [ ] Test connection to backend

### Production Setup ✅
- [ ] Create production environment files
- [ ] Use production API keys
- [ ] Set up monitoring and logging
- [ ] Configure security settings
- [ ] Test all connections
- [ ] Set up backup procedures

---

**Security Reminder**: Always keep your private keys and API keys secure. Never share them or commit them to version control!
