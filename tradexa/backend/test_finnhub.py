import os
import requests
from dotenv import load_dotenv

load_dotenv()

API_KEY = os.getenv("FINNHUB_API_KEY")

if not API_KEY:
    print("ERROR: FINNHUB_API_KEY not found in .env")
    exit()

print("Finnhub API key loaded successfully.")

url = "https://finnhub.io/api/v1/quote"

params = {
    "symbol": "AAPL",
    "token": API_KEY,
}

try:
    response = requests.get(url, params=params, timeout=10)

    print("HTTP Status:", response.status_code)
    print("Response:")
    print(response.text)

except Exception as e:
    print("Request failed:", e)