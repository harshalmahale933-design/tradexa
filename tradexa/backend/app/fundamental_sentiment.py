"""
Tradexa Fundamental & Sentiment Engine
=======================================

Provides:

1. Real US macroeconomic data from FRED
2. Indicator-by-indicator fundamental reasoning
3. Fundamental score out of 5
4. Real financial-news sentiment
5. Sentiment score out of 5

Primary asset:
    Gold / XAUUSD

The module is designed so that missing external data
does not crash the Tradexa backend.
"""

import os
from typing import Any, Dict, List, Optional

import requests
from dotenv import load_dotenv


# ============================================================
# ENVIRONMENT
# ============================================================

load_dotenv()


FRED_API_KEY = os.getenv("FRED_API_KEY")
NEWS_API_KEY = os.getenv("NEWS_API_KEY")


FRED_BASE_URL = "https://api.stlouisfed.org/fred/series/observations"
NEWS_BASE_URL = "https://newsapi.org/v2/everything"


# ============================================================
# FRED SERIES
# ============================================================

# Important US economic indicators.
#
# DFF       = Effective Federal Funds Rate
# CPIAUCSL  = Consumer Price Index
# PAYEMS    = Total Nonfarm Payrolls
# UNRATE    = Unemployment Rate

FRED_SERIES = {
    "fed_rate": "DFF",
    "cpi": "CPIAUCSL",
    "nonfarm_payroll": "PAYEMS",
    "unemployment": "UNRATE",
}


# ============================================================
# SAFE NUMBER CONVERSION
# ============================================================

def safe_float(value: Any) -> Optional[float]:
    """
    Safely converts a value to float.

    Returns None when conversion is impossible.
    """

    if value is None:
        return None

    try:
        return float(value)
    except (ValueError, TypeError):
        return None


# ============================================================
# FRED DATA
# ============================================================

def get_fred_series(
    series_id: str,
    limit: int = 12,
) -> List[float]:
    """
    Fetch recent observations from FRED.

    Returns oldest -> newest values.
    """

    if not FRED_API_KEY:
        print("FRED_API_KEY is missing.")
        return []

    params = {
        "series_id": series_id,
        "api_key": FRED_API_KEY,
        "file_type": "json",
        "sort_order": "desc",
        "limit": limit,
    }

    try:
        response = requests.get(
            FRED_BASE_URL,
            params=params,
            timeout=15,
        )

        response.raise_for_status()

        data = response.json()

        observations = data.get(
            "observations",
            [],
        )

        values = []

        for observation in observations:
            value = safe_float(
                observation.get("value")
            )

            if value is not None:
                values.append(value)

        values.reverse()

        return values

    except Exception as exc:
        print(
            f"FRED error for {series_id}: {exc}"
        )

        return []


# ============================================================
# GET US MACRO DATA
# ============================================================

def get_us_macro_data() -> Dict[str, Any]:
    """
    Retrieves real US macroeconomic indicators.

    Returns:

        fed_rate
        cpi
        cpi_yoy
        nonfarm_payroll
        payroll_change
        unemployment
        unemployment_change
    """

    fed_values = get_fred_series(
        FRED_SERIES["fed_rate"],
        limit=30,
    )

    cpi_values = get_fred_series(
        FRED_SERIES["cpi"],
        limit=24,
    )

    payroll_values = get_fred_series(
        FRED_SERIES["nonfarm_payroll"],
        limit=24,
    )

    unemployment_values = get_fred_series(
        FRED_SERIES["unemployment"],
        limit=24,
    )

    # --------------------------------------------------------
    # Current values
    # --------------------------------------------------------

    fed_rate = (
        fed_values[-1]
        if fed_values
        else None
    )

    cpi = (
        cpi_values[-1]
        if cpi_values
        else None
    )

    nonfarm_payroll = (
        payroll_values[-1]
        if payroll_values
        else None
    )

    unemployment = (
        unemployment_values[-1]
        if unemployment_values
        else None
    )

    # --------------------------------------------------------
    # CPI YEAR-OVER-YEAR
    # --------------------------------------------------------

    cpi_yoy = None

    if len(cpi_values) >= 13:
        previous_year_cpi = cpi_values[-13]

        if previous_year_cpi != 0:
            cpi_yoy = (
                (cpi_values[-1] - previous_year_cpi)
                / previous_year_cpi
            ) * 100

    # --------------------------------------------------------
    # PAYROLL MONTHLY CHANGE
    # --------------------------------------------------------

    payroll_change = None

    if len(payroll_values) >= 2:
        payroll_change = (
            payroll_values[-1]
            - payroll_values[-2]
        )

    # --------------------------------------------------------
    # UNEMPLOYMENT CHANGE
    # --------------------------------------------------------

    unemployment_change = None

    if len(unemployment_values) >= 2:
        unemployment_change = (
            unemployment_values[-1]
            - unemployment_values[-2]
        )

    return {
        "fed_rate": fed_rate,
        "cpi": cpi,
        "cpi_yoy": cpi_yoy,
        "nonfarm_payroll": nonfarm_payroll,
        "payroll_change": payroll_change,
        "unemployment": unemployment,
        "unemployment_change": unemployment_change,
    }


# ============================================================
# INDICATOR REASONING
# ============================================================

def analyze_fed_rate(
    fed_rate: Optional[float],
) -> Dict[str, Any]:
    """
    Determines how the current Federal Funds Rate
    affects Gold.

    Lower rates generally support Gold because
    the opportunity cost of holding non-yielding
    Gold decreases.

    Higher rates generally pressure Gold.
    """

    if fed_rate is None:
        return {
            "name": "Federal Funds Rate",
            "value": None,
            "score": 0,
            "bias": "NO_DATA",
            "reason": "Federal Reserve rate data unavailable.",
        }

    if fed_rate < 3.0:
        score = 1
        bias = "BULLISH"
        reason = (
            "Lower interest rates reduce the opportunity "
            "cost of holding Gold."
        )

    elif fed_rate < 4.5:
        score = 0.5
        bias = "SLIGHTLY_BULLISH"
        reason = (
            "Interest rates are relatively moderate, "
            "which provides some support to Gold."
        )

    elif fed_rate < 5.5:
        score = -0.5
        bias = "BEARISH"
        reason = (
            "Higher interest rates increase the opportunity "
            "cost of holding non-yielding Gold."
        )

    else:
        score = -1
        bias = "STRONGLY_BEARISH"
        reason = (
            "Very high interest rates can strongly pressure "
            "Gold through higher yields."
        )

    return {
        "name": "Federal Funds Rate",
        "value": round(fed_rate, 2),
        "score": score,
        "bias": bias,
        "reason": reason,
    }


def analyze_cpi(
    cpi_yoy: Optional[float],
) -> Dict[str, Any]:
    """
    Analyzes US inflation.

    Higher inflation can increase demand for Gold
    as an inflation hedge.

    However, extremely high inflation may cause
    tighter monetary policy, so this module keeps
    the interpretation moderate.
    """

    if cpi_yoy is None:
        return {
            "name": "CPI Inflation",
            "value": None,
            "score": 0,
            "bias": "NO_DATA",
            "reason": "CPI inflation data unavailable.",
        }

    if cpi_yoy >= 4.0:
        score = 1
        bias = "BULLISH"
        reason = (
            "High inflation can increase demand for Gold "
            "as a store of value and inflation hedge."
        )

    elif cpi_yoy >= 2.5:
        score = 0.5
        bias = "SLIGHTLY_BULLISH"
        reason = (
            "Inflation remains above the Fed's typical target, "
            "providing some support for Gold."
        )

    elif cpi_yoy >= 1.5:
        score = 0
        bias = "NEUTRAL"
        reason = (
            "Inflation is relatively contained, so its direct "
            "support for Gold is limited."
        )

    else:
        score = -0.5
        bias = "BEARISH"
        reason = (
            "Very low inflation reduces the immediate need "
            "for Gold as an inflation hedge."
        )

    return {
        "name": "CPI Inflation",
        "value": round(cpi_yoy, 2),
        "unit": "%",
        "score": score,
        "bias": bias,
        "reason": reason,
    }


def analyze_payroll(
    payroll_change: Optional[float],
) -> Dict[str, Any]:
    """
    Analyzes the change in Nonfarm Payrolls.

    Strong employment can support higher interest rates
    and therefore pressure Gold.

    Weak employment can increase expectations of
    easier monetary policy and support Gold.
    """

    if payroll_change is None:
        return {
            "name": "Nonfarm Payrolls",
            "value": None,
            "score": 0,
            "bias": "NO_DATA",
            "reason": "Nonfarm payroll data unavailable.",
        }

    if payroll_change >= 250:
        score = -1
        bias = "BEARISH"
        reason = (
            "Strong employment growth can support a tighter "
            "Federal Reserve policy, which may pressure Gold."
        )

    elif payroll_change >= 150:
        score = -0.5
        bias = "SLIGHTLY_BEARISH"
        reason = (
            "Healthy employment growth can reduce pressure "
            "on the Federal Reserve to cut rates."
        )

    elif payroll_change >= 75:
        score = 0
        bias = "NEUTRAL"
        reason = (
            "Employment growth is moderate and provides "
            "no strong directional signal for Gold."
        )

    else:
        score = 1
        bias = "BULLISH"
        reason = (
            "Weak employment growth can increase expectations "
            "of easier monetary policy, supporting Gold."
        )

    return {
        "name": "Nonfarm Payrolls",
        "value": round(payroll_change, 1),
        "unit": "thousand jobs",
        "score": score,
        "bias": bias,
        "reason": reason,
    }


def analyze_unemployment(
    unemployment: Optional[float],
) -> Dict[str, Any]:
    """
    Analyzes the US unemployment rate.

    Higher unemployment can increase expectations
    for easier monetary policy, which can support Gold.
    """

    if unemployment is None:
        return {
            "name": "Unemployment Rate",
            "value": None,
            "score": 0,
            "bias": "NO_DATA",
            "reason": "Unemployment data unavailable.",
        }

    if unemployment >= 6.0:
        score = 1
        bias = "BULLISH"
        reason = (
            "Very high unemployment can increase expectations "
            "of monetary easing, supporting Gold."
        )

    elif unemployment >= 5.0:
        score = 0.5
        bias = "SLIGHTLY_BULLISH"
        reason = (
            "Elevated unemployment can increase expectations "
            "of future rate cuts."
        )

    elif unemployment >= 4.0:
        score = 0
        bias = "NEUTRAL"
        reason = (
            "The labor market remains relatively stable, "
            "creating no strong fundamental signal."
        )

    else:
        score = -0.5
        bias = "BEARISH"
        reason = (
            "Very low unemployment indicates a strong labor "
            "market, which can reduce pressure for rate cuts."
        )

    return {
        "name": "Unemployment Rate",
        "value": round(unemployment, 2),
        "unit": "%",
        "score": score,
        "bias": bias,
        "reason": reason,
    }


# ============================================================
# FUNDAMENTAL SCORE
# ============================================================

def get_fundamental_score(
    asset_name: str,
) -> Dict[str, Any]:
    """
    Calculates the fundamental score.

    Score range:

        0 = Strongly bearish
        2.5 = Neutral
        5 = Strongly bullish

    The calculation currently uses:

        Federal Funds Rate
        CPI Inflation
        Nonfarm Payrolls
        Unemployment Rate

    The indicators are converted into a normalized
    0-5 score.
    """

    macro = get_us_macro_data()

    # --------------------------------------------------------
    # Only Gold-specific reasoning for now
    # --------------------------------------------------------

    normalized_asset = asset_name.strip().lower()

    is_gold = normalized_asset in {
        "gold",
        "xauusd",
        "xau/usd",
        "xau-usd",
    }

    # For non-Gold assets we still return the data,
    # but clearly label that Gold logic is being used.
    if not is_gold:
        print(
            f"Fundamental model currently optimized for Gold: "
            f"{asset_name}"
        )

    # --------------------------------------------------------
    # Analyze each indicator
    # --------------------------------------------------------

    fed_analysis = analyze_fed_rate(
        macro.get("fed_rate")
    )

    cpi_analysis = analyze_cpi(
        macro.get("cpi_yoy")
    )

    payroll_analysis = analyze_payroll(
        macro.get("payroll_change")
    )

    unemployment_analysis = analyze_unemployment(
        macro.get("unemployment")
    )

    indicators = [
        fed_analysis,
        cpi_analysis,
        payroll_analysis,
        unemployment_analysis,
    ]

    # --------------------------------------------------------
    # Calculate raw fundamental bias
    # --------------------------------------------------------

    available_scores = [
        item["score"]
        for item in indicators
        if item["bias"] != "NO_DATA"
    ]

    if available_scores:
        raw_score = sum(
            available_scores
        ) / len(available_scores)

        # Convert approximately -1 to +1
        # into 0 to 5.
        score = 2.5 + (
            raw_score * 2.5
        )

        score = max(
            0,
            min(5, score),
        )

        score = round(
            score,
            1,
        )

    else:
        score = 2.5

    # --------------------------------------------------------
    # Overall fundamental bias
    # --------------------------------------------------------

    if score >= 4.0:
        overall_bias = "STRONGLY_BULLISH"

    elif score >= 3.0:
        overall_bias = "BULLISH"

    elif score > 2.0:
        overall_bias = "NEUTRAL"

    elif score >= 1.0:
        overall_bias = "BEARISH"

    else:
        overall_bias = "STRONGLY_BEARISH"

    # --------------------------------------------------------
    # Build human-readable summary
    # --------------------------------------------------------

    bullish_count = sum(
        1
        for item in indicators
        if "BULLISH" in item["bias"]
    )

    bearish_count = sum(
        1
        for item in indicators
        if "BEARISH" in item["bias"]
    )

    if bullish_count > bearish_count:
        summary = (
            "Fundamental conditions currently favor Gold."
        )

    elif bearish_count > bullish_count:
        summary = (
            "Fundamental conditions currently pressure Gold."
        )

    else:
        summary = (
            "Fundamental indicators are currently mixed."
        )

    return {
        "score": score,
        "max": 5,
        "status": "LIVE",
        "bias": overall_bias,
        "asset": asset_name,

        "summary": summary,

        "reasoning": {
            "fed_rate": fed_analysis,
            "cpi": cpi_analysis,
            "nonfarm_payroll": payroll_analysis,
            "unemployment": unemployment_analysis,
        },

        "indicators": indicators,

        "data": {
            "fed_rate": macro.get("fed_rate"),
            "cpi": macro.get("cpi"),
            "cpi_yoy": macro.get("cpi_yoy"),
            "nonfarm_payroll": macro.get(
                "nonfarm_payroll"
            ),
            "payroll_change": macro.get(
                "payroll_change"
            ),
            "unemployment": macro.get(
                "unemployment"
            ),
            "unemployment_change": macro.get(
                "unemployment_change"
            ),
        },

        "note": (
            "Calculated from real US macroeconomic "
            "indicators obtained from FRED."
        ),
    }


# ============================================================
# NEWS SENTIMENT
# ============================================================

def get_news_sentiment(
    asset_name: str,
) -> Dict[str, Any]:
    """
    Gets financial news and calculates a simple
    market-news sentiment score.

    Uses NewsAPI when NEWS_API_KEY is configured.

    Score:

        0 = strongly negative
        2.5 = neutral
        5 = strongly positive
    """

    if not NEWS_API_KEY:
        return {
            "score": 2.5,
            "max": 5,
            "status": "NO_API_KEY",
            "articles": 0,
            "raw_average": None,
            "note": (
                "NEWS_API_KEY is not configured."
            ),
        }

    normalized_asset = asset_name.strip().lower()

    if normalized_asset in {
        "gold",
        "xauusd",
        "xau/usd",
        "xau-usd",
    }:
        query = (
            "gold OR XAU OR XAUUSD OR "
            "Federal Reserve OR inflation"
        )

    elif normalized_asset == "btc":
        query = (
            "Bitcoin OR BTC OR cryptocurrency"
        )

    elif normalized_asset == "eth":
        query = (
            "Ethereum OR ETH OR cryptocurrency"
        )

    elif normalized_asset == "eurusd":
        query = (
            "EUR USD OR Euro OR ECB"
        )

    elif normalized_asset == "gbpusd":
        query = (
            "GBP USD OR British Pound OR Bank of England"
        )

    elif normalized_asset == "usdjpy":
        query = (
            "USD JPY OR Japanese Yen OR Bank of Japan"
        )

    else:
        query = asset_name

    params = {
        "q": query,
        "apiKey": NEWS_API_KEY,
        "language": "en",
        "sortBy": "publishedAt",
        "pageSize": 50,
    }

    try:
        response = requests.get(
            NEWS_BASE_URL,
            params=params,
            timeout=15,
        )

        response.raise_for_status()

        data = response.json()

        articles = data.get(
            "articles",
            [],
        )

    except Exception as exc:
        print(
            f"News API error: {exc}"
        )

        return {
            "score": 2.5,
            "max": 5,
            "status": "ERROR",
            "articles": 0,
            "raw_average": None,
            "note": (
                "Unable to retrieve financial news."
            ),
        }

    # --------------------------------------------------------
    # Keyword-based financial sentiment
    # --------------------------------------------------------

    positive_words = {
        "surge",
        "surges",
        "rally",
        "rallies",
        "bullish",
        "gain",
        "gains",
        "rise",
        "rises",
        "higher",
        "strong",
        "strength",
        "support",
        "optimism",
        "positive",
        "record",
        "breakout",
        "upside",
        "growth",
        "easing",
        "cut",
        "cuts",
        "dovish",
    }

    negative_words = {
        "fall",
        "falls",
        "drop",
        "drops",
        "decline",
        "declines",
        "bearish",
        "loss",
        "losses",
        "lower",
        "weak",
        "weakness",
        "risk",
        "negative",
        "crash",
        "selloff",
        "downside",
        "hawkish",
        "rate hike",
        "hikes",
    }

    sentiment_values = []

    for article in articles:

        title = article.get(
            "title",
            "",
        ) or ""

        description = article.get(
            "description",
            "",
        ) or ""

        text = (
            f"{title} {description}"
        ).lower()

        positive_count = sum(
            1
            for word in positive_words
            if word in text
        )

        negative_count = sum(
            1
            for word in negative_words
            if word in text
        )

        total = (
            positive_count
            - negative_count
        )

        if total > 0:
            sentiment_values.append(
                1.0
            )

        elif total < 0:
            sentiment_values.append(
                -1.0
            )

        else:
            sentiment_values.append(
                0.0
            )

    # --------------------------------------------------------
    # No usable sentiment
    # --------------------------------------------------------

    if not sentiment_values:
        return {
            "score": 2.5,
            "max": 5,
            "status": "NO_DATA",
            "articles": len(articles),
            "raw_average": None,
            "note": "No usable news sentiment found.",
        }

    # --------------------------------------------------------
    # Average sentiment
    # --------------------------------------------------------

    raw_average = (
        sum(sentiment_values)
        / len(sentiment_values)
    )

    # Convert -1 ... +1
    # into 0 ... 5
    score = 2.5 + (
        raw_average * 2.5
    )

    score = max(
        0,
        min(5, score),
    )

    score = round(
        score,
        1,
    )

    # --------------------------------------------------------
    # Sentiment label
    # --------------------------------------------------------

    if score >= 4:
        status = "BULLISH"

    elif score >= 3:
        status = "SLIGHTLY_BULLISH"

    elif score > 2:
        status = "NEUTRAL"

    elif score >= 1:
        status = "BEARISH"

    else:
        status = "STRONGLY_BEARISH"

    return {
        "score": score,
        "max": 5,
        "status": status,
        "articles": len(articles),
        "raw_average": round(
            raw_average,
            3,
        ),
        "note": (
            "Based on real financial news "
            "retrieved from the configured news source."
        ),
    }