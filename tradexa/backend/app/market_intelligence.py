"""
Tradexa - Market Intelligence Engine
====================================
Fetches real price data from TwelveData and calculates Tradexa Scores.
"""

import os
import time
import requests
from dotenv import load_dotenv

load_dotenv()

API_KEY = os.getenv("TWELVEDATA_API_KEY")
BASE_URL = "https://api.twelvedata.com"

# ============================================================
# CACHE
# ============================================================

_cache = {}

CACHE_DURATION_SECONDS = 300  # 5 minutes


# ============================================================
# ASSET SYMBOLS
# ============================================================

ASSET_SYMBOLS = {
    "Gold": "XAU/USD",
    "EURUSD": "EUR/USD",
    "GBPUSD": "GBP/USD",
    "USDJPY": "USD/JPY",
    "BTC": "BTC/USD",
    "ETH": "ETH/USD",
    "Nifty": "NSEI",
    "Reliance": "RELIANCE.BSE",
    "AAPL": "AAPL",
    "TSLA": "TSLA",
}


# ============================================================
# GET TIME SERIES
# ============================================================

def get_time_series(
    symbol: str,
    interval: str = "1day",
    outputsize: int = 30
):
    """
    Fetch recent price candles from TwelveData.

    Uses a 5-minute cache to reduce API requests.
    """

    if not API_KEY:
        print("ERROR: TWELVEDATA_API_KEY is missing")
        return None

    cache_key = f"{symbol}_{interval}_{outputsize}"

    now = time.time()

    # --------------------------------------------------------
    # CHECK CACHE
    # --------------------------------------------------------

    if cache_key in _cache:

        cached_time, cached_data = _cache[cache_key]

        if now - cached_time < CACHE_DURATION_SECONDS:

            print(
                f"Using cached data for "
                f"{symbol} ({interval})"
            )

            return cached_data

    # --------------------------------------------------------
    # API REQUEST
    # --------------------------------------------------------

    url = f"{BASE_URL}/time_series"

    params = {
        "symbol": symbol,
        "interval": interval,
        "outputsize": outputsize,
        "apikey": API_KEY,
    }

    try:

        response = requests.get(
            url,
            params=params,
            timeout=10
        )

        # ----------------------------------------------------
        # RATE LIMIT
        # ----------------------------------------------------

        if response.status_code == 429:

            print(
                f"TwelveData rate limit reached for "
                f"{symbol} ({interval})"
            )

            # Use old cache if available

            if cache_key in _cache:

                return _cache[cache_key][1]

            return None

        response.raise_for_status()

        data = response.json()

        # ----------------------------------------------------
        # TWELVEDATA ERROR
        # ----------------------------------------------------

        if data.get("status") == "error":

            print(
                f"TwelveData error for "
                f"{symbol} ({interval}): "
                f"{data.get('message', 'Unknown error')}"
            )

            if cache_key in _cache:

                return _cache[cache_key][1]

            return None

        # ----------------------------------------------------
        # VALIDATE VALUES
        # ----------------------------------------------------

        if "values" not in data:

            print(
                f"No values returned for "
                f"{symbol} ({interval}): "
                f"{data}"
            )

            if cache_key in _cache:

                return _cache[cache_key][1]

            return None

        # ----------------------------------------------------
        # REVERSE DATA
        # ----------------------------------------------------

        candles = list(
            reversed(data["values"])
        )

        # ----------------------------------------------------
        # SAVE TO CACHE
        # ----------------------------------------------------

        _cache[cache_key] = (
            now,
            candles
        )

        print(
            f"Fetched fresh data for "
            f"{symbol} ({interval})"
        )

        return candles

    except requests.exceptions.RequestException as e:

        print(
            f"Request error for "
            f"{symbol} ({interval}): {e}"
        )

        if cache_key in _cache:

            return _cache[cache_key][1]

        return None

    except Exception as e:

        print(
            f"Unexpected error for "
            f"{symbol} ({interval}): {e}"
        )

        if cache_key in _cache:

            return _cache[cache_key][1]

        return None


# ============================================================
# TECHNICAL SCORE
# ============================================================

def calculate_technical_score(candles):

    """
    Simple technical score out of 5.

    Based on:

    - Current price vs SMA10
    - Recent momentum
    """

    if not candles or len(candles) < 10:

        return {
            "score": 2.5,
            "trend": "Unknown",
            "note": "Not enough data"
        }

    # --------------------------------------------------------
    # CLOSE PRICES
    # --------------------------------------------------------

    closes = [
        float(c["close"])
        for c in candles
    ]

    # --------------------------------------------------------
    # SMA10
    # --------------------------------------------------------

    sma10 = sum(
        closes[-10:]
    ) / 10

    current_price = closes[-1]

    # --------------------------------------------------------
    # MOMENTUM
    # --------------------------------------------------------

    recent = closes[-5:]

    rising_count = sum(
        1
        for i in range(
            1,
            len(recent)
        )
        if recent[i] > recent[i - 1]
    )

    # --------------------------------------------------------
    # TREND SCORE
    # --------------------------------------------------------

    trend_score = 2.5

    if current_price > sma10:

        trend_score += 1.25

    else:

        trend_score -= 1.25

    # --------------------------------------------------------
    # MOMENTUM SCORE
    # --------------------------------------------------------

    momentum_score = (
        rising_count / 4
    ) * 2.5

    # --------------------------------------------------------
    # FINAL SCORE
    # --------------------------------------------------------

    total = (
        trend_score
        + momentum_score
        - 1.25
    )

    total = round(
        max(
            0,
            min(
                5,
                total
            )
        ),
        1
    )

    trend_label = (
        "Bullish"
        if current_price > sma10
        else "Bearish"
    )

    return {

        "score": total,

        "trend": trend_label,

        "current_price": current_price,

        "sma10": round(
            sma10,
            4
        ),
    }


# ============================================================
# ASSET TECHNICAL ANALYSIS
# ============================================================

def get_asset_technical_analysis(
    asset_name: str
):

    """
    Full technical breakdown.

    1D + 4H
    """

    # --------------------------------------------------------
    # CASE-INSENSITIVE LOOKUP
    # --------------------------------------------------------

    normalized = (
        asset_name
        .strip()
        .lower()
    )

    matched_key = next(
        (
            key
            for key in ASSET_SYMBOLS
            if key.lower() == normalized
        ),
        None
    )

    if not matched_key:

        return None

    symbol = ASSET_SYMBOLS[
        matched_key
    ]

    asset_name = matched_key

    # --------------------------------------------------------
    # DAILY
    # --------------------------------------------------------

    daily_candles = get_time_series(
        symbol,
        interval="1day",
        outputsize=30
    )

    # --------------------------------------------------------
    # 4 HOUR
    # --------------------------------------------------------

    h4_candles = get_time_series(
        symbol,
        interval="4h",
        outputsize=30
    )

    # --------------------------------------------------------
    # ANALYSIS
    # --------------------------------------------------------

    daily_analysis = (

        calculate_technical_score(
            daily_candles
        )

        if daily_candles

        else None
    )

    h4_analysis = (

        calculate_technical_score(
            h4_candles
        )

        if h4_candles

        else None
    )

    # --------------------------------------------------------
    # RESULT
    # --------------------------------------------------------

    return {

        "asset": asset_name,

        "symbol": symbol,

        "daily": daily_analysis,

        "h4": h4_analysis,
    }