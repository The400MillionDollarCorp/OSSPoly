import os
from dotenv import load_dotenv
from py_clob_client.client import ClobClient

# Load environment variables from .env
load_dotenv()

HOST = "https://clob.polymarket.com"
CHAIN_ID = 137  # Polygon mainnet

PRIVATE_KEY = os.getenv("POLY_PRIVATE_KEY")

if not PRIVATE_KEY:
    raise ValueError("POLY_PRIVATE_KEY not found in .env")

client = ClobClient(HOST, key=PRIVATE_KEY, chain_id=CHAIN_ID)

creds = client.create_or_derive_api_creds()

print("✅ Your Polymarket API credentials:")
print("API Key:", creds.api_key)
print("API Secret:", creds.api_secret)
print("API Passphrase:", creds.api_passphrase)
