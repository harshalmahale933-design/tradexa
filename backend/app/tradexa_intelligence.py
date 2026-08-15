"""
Tradexa Intelligence Engine
============================

Combines:

1. Technical Analysis
2. Real Fundamental Data
3. Real News Sentiment

into one Tradexa Intelligence report.

Risk Assessment is NOT included.
"""

from app.market_intelligence import (
    get_asset_technical_analysis,
)

from app.fundamental_sentiment import (
    get_news_sentiment,
    get_fundamental_score,
)


# ---------------------------------------------------------
# CONFIDENCE
# ---------------------------------------------------------

def calculate_confidence(score: float) -> str:
    """
    Converts overall score into confidence level.

    Maximum score = 15
    """

    if score >= 12:
        return "HIGH"

    if score >= 9:
        return "MEDIUM"

    return "LOW"


# ---------------------------------------------------------
# DIRECTION
# ---------------------------------------------------------

def calculate_direction(
    technical_score: float,
    fundamental_score: float,
    sentiment_score: float,
    trend: str,
) -> str:
    """
    Determines BUY / SELL / WAIT.

    This is Tradexa Intelligence,
    NOT a risk assessment system.
    """

    total_score = (
        technical_score
        + fundamental_score
        + sentiment_score
    )

    # BUY condition
    if total_score >= 10:

        if trend == "Bullish":
            return "BUY"

    # SELL condition
    if total_score <= 7:

        if trend == "Bearish":
            return "SELL"

    # Otherwise
    return "WAIT"


# ---------------------------------------------------------
# MAIN TRadEXA INTELLIGENCE
# ---------------------------------------------------------

def get_tradexa_intelligence(
    asset_name: str,
):
    """
    Generates the complete Tradexa Intelligence
    report for one asset.

    Includes:

    Technical
    Fundamental
    Sentiment
    Decision
    Confidence
    """

    # -----------------------------------------------------
    # GET TECHNICAL ANALYSIS
    # -----------------------------------------------------

    analysis = get_asset_technical_analysis(
        asset_name
    )

    if not analysis:
        return None

    daily = analysis.get("daily")

    h4 = analysis.get("h4")

    if not daily:
        return None

    # -----------------------------------------------------
    # TECHNICAL
    # -----------------------------------------------------

    daily_score = daily.get(
        "score",
        2.5,
    )

    h4_score = (
        h4.get(
            "score",
            2.5,
        )
        if h4
        else 2.5
    )

    technical_score = round(
        (
            daily_score
            + h4_score
        ) / 2,
        1,
    )

    trend = daily.get(
        "trend",
        "Unknown",
    )

    # -----------------------------------------------------
    # REAL FUNDAMENTAL DATA
    # -----------------------------------------------------

    fundamental = get_fundamental_score(
        analysis["asset"]
    )

    fundamental_score = fundamental.get(
        "score"
    )

    # If API does not return data,
    # do NOT pretend it is 2.5.
    if fundamental_score is None:
        fundamental_score = 0.0

    # -----------------------------------------------------
    # REAL NEWS SENTIMENT
    # -----------------------------------------------------

    sentiment = get_news_sentiment(
        analysis["asset"]
    )

    sentiment_score = sentiment.get(
        "score"
    )

    # If no real sentiment data exists,
    # do NOT create fake neutral data.
    if sentiment_score is None:
        sentiment_score = 0.0

    # -----------------------------------------------------
    # OVERALL SCORE
    # -----------------------------------------------------

    overall_score = round(
        technical_score
        + fundamental_score
        + sentiment_score,
        1,
    )

    # -----------------------------------------------------
    # DECISION
    # -----------------------------------------------------

    direction = calculate_direction(
        technical_score,
        fundamental_score,
        sentiment_score,
        trend,
    )

    # -----------------------------------------------------
    # CONFIDENCE
    # -----------------------------------------------------

    confidence = calculate_confidence(
        overall_score
    )

    # -----------------------------------------------------
    # FINAL RESPONSE
    # -----------------------------------------------------

    return {
        "asset": analysis["asset"],

        "symbol": analysis["symbol"],

        "decision": direction,

        "confidence": confidence,

        "overall_score": overall_score,

        "overall_max": 15,

        # ---------------------------------------------
        # TECHNICAL
        # ---------------------------------------------

        "technical": {
            "score": technical_score,

            "max": 5,

            "trend": trend,

            "daily": daily,

            "h4": h4,
        },

        # ---------------------------------------------
        # FUNDAMENTAL
        # ---------------------------------------------

        "fundamental": {
    "score": fundamental.get(
        "score",
        2.5,
    ),

    "max": 5,

    "status": fundamental.get(
        "status",
        "NO_DATA",
    ),

    "bias": fundamental.get(
        "bias",
        "NEUTRAL",
    ),

    "summary": fundamental.get(
        "summary",
        "",
    ),

    "reasoning": fundamental.get(
        "reasoning",
        {},
    ),

    "indicators": fundamental.get(
        "indicators",
        [],
    ),

    "data": fundamental.get(
        "data",
        {},
    ),

    "note": fundamental.get(
        "note",
        "",
    ),
},

        # ---------------------------------------------
        # SENTIMENT
        # ---------------------------------------------

        "sentiment": {
            "score": sentiment.get(
                "score"
            ),

            "max": 5,

            "status": sentiment.get(
                "status",
                "NO_DATA",
            ),

            "articles": sentiment.get(
                "articles",
                0,
            ),

            "raw_average": sentiment.get(
                "raw_average"
            ),

            "note": sentiment.get(
                "note",
                "",
            ),
        },
    }