# PolyOracle Troubleshooting Guide

## Common Issues and Solutions

### Installation Issues

#### Python Version Compatibility
**Problem**: `python: command not found` or version conflicts
```bash
# Check Python version
python --version
python3 --version

# If Python 3.11+ not found, install from python.org
# Windows: Download from https://www.python.org/downloads/
# macOS: brew install python@3.11
# Linux: sudo apt install python3.11
```

#### Virtual Environment Issues
**Problem**: Cannot activate virtual environment
```bash
# Windows
cd backend
python -m venv .venv
.venv\Scripts\activate

# macOS/Linux  
cd backend
python3 -m venv .venv
source .venv/bin/activate

# Verify activation
which python  # Should show path to .venv
```

#### Dependency Installation Failures
**Problem**: `pip install` fails with permission errors
```bash
# Ensure virtual environment is activated
pip install --upgrade pip
pip install -e ".[dev]"

# If still failing, try:
pip install --user -e ".[dev]"
```

#### Node.js/pnpm Issues
**Problem**: `pnpm: command not found`
```bash
# Install pnpm globally
npm install -g pnpm

# Or use npm instead
cd frontend
npm install
npm run dev
```

### Environment Variable Issues

#### Missing API Keys
**Problem**: `API key not found` errors
```bash
# Check if .env file exists
ls -la backend/.env
ls -la frontend/.env.local

# Verify environment variables are loaded
cd backend
python -c "import os; from dotenv import load_dotenv; load_dotenv(); print('OPENAI_API_KEY:', 'SET' if os.getenv('OPENAI_API_KEY') else 'NOT SET')"
```

**Solution**: 
1. Ensure `.env` files exist in correct locations
2. Check for typos in variable names
3. Verify no spaces around `=` signs
4. Restart applications after changing `.env` files

#### Invalid API Keys
**Problem**: `401 Unauthorized` or `Invalid API key` errors
```bash
# Test OpenAI API key
curl -H "Authorization: Bearer YOUR_API_KEY" https://api.openai.com/v1/models

# Test Exa API key  
curl -H "Authorization: Bearer YOUR_EXA_KEY" https://api.exa.ai/search
```

**Solution**:
1. Verify API keys are copied correctly (no extra spaces)
2. Check if API keys have expired
3. Ensure sufficient credits/quota remaining
4. Regenerate keys if necessary

### Backend Issues

#### LangGraph Server Won't Start
**Problem**: `make lg-server` fails or server crashes
```bash
# Check if port 8123 is already in use
netstat -an | grep 8123
# Windows: netstat -an | findstr 8123

# Kill existing processes
# Windows: taskkill /F /PID <pid>
# macOS/Linux: kill -9 <pid>

# Try starting manually
cd backend
langgraph dev --port 8124
```

#### Import Errors
**Problem**: `ModuleNotFoundError: No module named 'polyoracle'`
```bash
# Reinstall in development mode
cd backend
pip install -e ".[dev]"

# Check Python path
python -c "import sys; print('\n'.join(sys.path))"
```

#### Polymarket Connection Issues
**Problem**: Cannot connect to Polymarket or invalid credentials
```bash
# Verify private key format
python -c "
key = 'YOUR_PRIVATE_KEY'
if key.startswith('0x') and len(key) == 66:
    print('✅ Private key format valid')
else:
    print('❌ Invalid private key format')
"

# Test Polymarket connection
cd backend
python create_polymarket_creds.py
```

**Common Solutions**:
1. Ensure private key starts with `0x` and is 64 characters (plus 0x)
2. Verify wallet has MATIC for gas fees
3. Check proxy contract is set up on Polymarket website
4. Regenerate API credentials if needed

### Frontend Issues

#### Cannot Connect to Backend
**Problem**: `Connection refused` or `Network Error`
```bash
# Check if backend is running
curl http://localhost:8123/health
# or visit in browser

# Verify environment variable
cd frontend
echo $LANGGRAPH_DEPLOYMENT_URL
# Windows: echo %LANGGRAPH_DEPLOYMENT_URL%
```

**Solution**:
1. Ensure backend is running on correct port
2. Check `LANGGRAPH_DEPLOYMENT_URL` in `.env.local`
3. Verify firewall isn't blocking connections
4. Try different port if 8123 is blocked

#### Build Failures
**Problem**: `npm run build` or `pnpm build` fails
```bash
# Clear cache and reinstall
cd frontend
rm -rf node_modules .next
pnpm install
pnpm build

# Check for TypeScript errors
pnpm run type-check
```

#### Runtime Errors
**Problem**: React errors or blank pages
```bash
# Check browser console for errors
# Open Developer Tools (F12)
# Look in Console and Network tabs

# Check Next.js logs
cd frontend
pnpm dev
# Look for error messages in terminal
```

### Web3 and Wallet Issues

#### Wallet Connection Problems
**Problem**: Cannot connect MetaMask or wallet
1. Ensure MetaMask is installed and unlocked
2. Check if correct network (Polygon) is selected
3. Verify website is added to MetaMask's connected sites
4. Try refreshing page or restarting browser

#### Transaction Failures
**Problem**: Transactions fail or get stuck
1. Check MATIC balance for gas fees
2. Verify network congestion (try higher gas price)
3. Reset MetaMask account if nonce issues
4. Check transaction on Polygonscan

#### Proxy Contract Issues
**Problem**: Proxy contract not working
1. Visit Polymarket.com and connect wallet
2. Follow prompts to create proxy contract
3. Copy exact proxy address (starts with `0x`)
4. Add to both backend and frontend `.env` files

### Performance Issues

#### Slow Response Times
**Problem**: Agent takes too long to respond
```bash
# Check timeout settings
# Backend: STREAM_TIMEOUT in .env
# Frontend: NEXT_PUBLIC_STREAM_TIMEOUT in .env.local

# Monitor resource usage
# Windows: Task Manager
# macOS: Activity Monitor  
# Linux: htop or top
```

**Solutions**:
1. Increase timeout values
2. Check internet connection speed
3. Verify API rate limits aren't exceeded
4. Monitor system resources (CPU, memory)

#### Memory Issues
**Problem**: High memory usage or crashes
```bash
# Monitor memory usage
# Check for memory leaks in browser dev tools
# Restart services periodically

# Reduce concurrent requests
# Set MAX_CONCURRENT_REQUESTS=3 in backend/.env
```

### Data Validation Issues

#### Type Errors
**Problem**: TypeScript or validation errors
```bash
# Check data validation logs
# Look for DataValidationError messages

# Test data validation
cd frontend
npm run type-check
```

**Solutions**:
1. Check data structure matches expected types
2. Verify API responses are properly formatted
3. Update type definitions if API changes
4. Add error boundaries for graceful handling

### Debugging Tools

#### Backend Debugging
```bash
# Enable debug logging
# Set LOG_LEVEL=DEBUG in backend/.env

# Run with verbose output
cd backend
python -m pdb src/polyoracle/graph.py

# Check logs
tail -f backend/polyoracle.log
```

#### Frontend Debugging
```bash
# Enable development mode
cd frontend
pnpm dev

# Use browser dev tools
# Network tab: Check API calls
# Console tab: Check for errors
# React DevTools: Inspect components
```

#### Network Debugging
```bash
# Test backend connectivity
curl -v http://localhost:8123/health

# Check network configuration
# Windows: ipconfig
# macOS/Linux: ifconfig

# Test external API connectivity
curl -v https://api.openai.com/v1/models
```

### Recovery Procedures

#### Reset Development Environment
```bash
# Backend reset
cd backend
rm -rf .venv
python -m venv .venv
source .venv/bin/activate  # or .venv\Scripts\activate on Windows
pip install -e ".[dev]"

# Frontend reset  
cd frontend
rm -rf node_modules .next
pnpm install
```

#### Reset Polymarket Credentials
```bash
# Regenerate API credentials
cd backend
python create_polymarket_creds.py

# Update .env files with new credentials
# Restart backend server
```

#### Clear Browser Data
1. Clear browser cache and cookies
2. Disconnect and reconnect wallet
3. Reset MetaMask if needed
4. Try incognito/private browsing mode

### Getting Help

#### Log Collection
When reporting issues, collect these logs:
```bash
# Backend logs
cd backend
cat polyoracle.log

# Frontend logs (browser console)
# Open Developer Tools > Console
# Copy all error messages

# System information
python --version
node --version
pnpm --version
```

#### Issue Reporting Template
```markdown
## Issue Description
Brief description of the problem

## Environment
- OS: Windows/macOS/Linux
- Python version: 
- Node.js version:
- Browser: Chrome/Firefox/Safari

## Steps to Reproduce
1. Step one
2. Step two
3. Step three

## Expected Behavior
What should happen

## Actual Behavior  
What actually happens

## Error Messages
```
Paste error messages here
```

## Additional Context
Any other relevant information
```

#### Common Error Messages and Solutions

| Error Message | Likely Cause | Solution |
|---------------|--------------|----------|
| `ModuleNotFoundError` | Missing dependencies | Run `pip install -e ".[dev]"` |
| `Connection refused` | Backend not running | Start backend with `make lg-server` |
| `Invalid API key` | Wrong/expired API key | Check and regenerate API keys |
| `Network timeout` | Slow connection/high load | Increase timeout values |
| `Validation error` | Data format mismatch | Check data types and structure |
| `Transaction failed` | Insufficient gas/wrong network | Check MATIC balance and network |
| `Proxy contract error` | Proxy not set up | Create proxy on Polymarket website |

### Prevention Tips

#### Regular Maintenance
1. Keep dependencies updated
2. Monitor API key usage and quotas
3. Regularly backup configuration files
4. Test in development before production changes

#### Best Practices
1. Use version control for configuration changes
2. Document any custom modifications
3. Monitor system resources and performance
4. Set up proper logging and alerting

#### Security Checklist
1. Never commit `.env` files to version control
2. Use separate API keys for development/production
3. Regularly rotate API keys and passwords
4. Monitor for unusual activity or errors
5. Keep private keys secure and backed up
