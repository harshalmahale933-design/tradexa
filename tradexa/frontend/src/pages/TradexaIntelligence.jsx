import { useEffect, useState } from "react";
import { API_BASE_URL } from "../api";
import Sidebar from "../components/Sidebar";
import { theme } from "../theme";

const API = `${API_BASE_URL}`;

function TradexaIntelligence({
  user,
  onLogout,
  onNavigate,
}) {
  const [symbol, setSymbol] = useState("Gold");
  const [intelligence, setIntelligence] = useState(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  

  // ============================================================
  // LOAD INTELLIGENCE
  // ============================================================

  const analyzeAsset = async (assetName) => {
    const asset = assetName.trim();

    if (!asset) {
      setError("Please enter a symbol.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        `${API_BASE_URL}/market/intelligence/${encodeURIComponent(asset)}`
      );

      if (!response.ok) {
        throw new Error(
          `Unable to analyze ${asset}.`
        );
      }

      const data = await response.json();

      setIntelligence(data);
    } catch (err) {
      console.error(err);

      setIntelligence(null);
      setError(
        err.message || "Unable to load market intelligence."
      );
    } finally {
      setLoading(false);
    }
  };

  // ============================================================
  // LOAD GOLD ON FIRST OPEN
  // ============================================================

  useEffect(() => {
    analyzeAsset("Gold");
  }, []);

  // ============================================================
  // ENTER KEY
  // ============================================================

  const handleKeyDown = (event) => {
    if (event.key === "Enter") {
      analyzeAsset(symbol);
    }
  };

  return (
    <div style={styles.layout}>
      <Sidebar
        activePage="tradexa-intelligence"
        onNavigate={onNavigate}
        user={user}
        onLogout={onLogout}
      />

      <main style={styles.main}>

        {/* ====================================================
            HEADER
        ==================================================== */}

        <div style={styles.header}>

          <div>
            <div style={styles.breadcrumb}>
              <span style={styles.brand}>
                Tradexa
              </span>

              <span style={styles.slash}>
                /
              </span>

              <span>
                Tradexa Intelligence
              </span>
            </div>

            <h1 style={styles.pageTitle}>
              Tradexa Intelligence
            </h1>

            <p style={styles.pageSubtitle}>
              Multi-factor market intelligence for your selected
              trading instrument.
            </p>
          </div>

          <div style={styles.onlineBadge}>
            <span style={styles.onlineDot}></span>
            MARKET ENGINE ONLINE
          </div>

        </div>

        {/* ====================================================
            SEARCH
        ==================================================== */}

        <div style={styles.searchCard}>

          <div style={styles.searchTitle}>
            Analyze Market
          </div>

          <div style={styles.searchSubtitle}>
            Enter a specific asset to generate technical,
            fundamental and sentiment intelligence.
          </div>

          <div style={styles.searchRow}>

            <div style={styles.inputWrapper}>
              <span style={styles.searchIcon}>
                ⌕
              </span>

              <input
                value={symbol}
                onChange={(e) =>
                  setSymbol(e.target.value)
                }
                onKeyDown={handleKeyDown}
                placeholder="Enter symbol e.g. Gold, XAUUSD, EURUSD..."
                style={styles.searchInput}
              />
            </div>

            <button
              onClick={() => analyzeAsset(symbol)}
              disabled={loading}
              style={{
                ...styles.analyzeButton,
                opacity: loading ? 0.6 : 1,
              }}
            >
              {loading ? "Analyzing..." : "Analyze"}
            </button>

          </div>

          <div style={styles.quickSymbols}>

            <span style={styles.quickLabel}>
              Quick:
            </span>

            {[
              "Gold",
              "XAUUSD",
              "EURUSD",
              "GBPUSD",
              "BTCUSD",
              "NIFTY50",
            ].map((item) => (
              <button
                key={item}
                onClick={() => {
                  setSymbol(item);
                  analyzeAsset(item);
                }}
                style={styles.quickButton}
              >
                {item}
              </button>
            ))}

          </div>

        </div>

        {/* ====================================================
            ERROR
        ==================================================== */}

        {error && (
          <div style={styles.errorBox}>
            <strong>Error:</strong> {error}
          </div>
        )}

        {/* ====================================================
            LOADING
        ==================================================== */}

        {loading && (
          <div style={styles.loadingCard}>

            <div style={styles.loadingSpinner}></div>

            <div>
              <div style={styles.loadingTitle}>
                Analyzing {symbol}
              </div>

              <div style={styles.loadingText}>
                Collecting technical, fundamental and
                sentiment data...
              </div>
            </div>

          </div>
        )}

        {/* ====================================================
            INTELLIGENCE
        ==================================================== */}

        {!loading && intelligence && (
          <IntelligenceDashboard
            data={intelligence}
          />
        )}

      </main>
    </div>
  );
}


// ================================================================
// MAIN INTELLIGENCE DASHBOARD
// ================================================================

function IntelligenceDashboard({ data }) {

  const technical = data?.technical || {};
  const fundamental = data?.fundamental || {};
  const sentiment = data?.sentiment || {};

  const overallScore = getNumber(
    data?.overall_score,
    calculateFallbackOverall(
      technical,
      fundamental,
      sentiment
    )
  );

  const overallMax = getNumber(
    data?.overall_max,
    15
  );

  const technicalScore = getNumber(
    technical?.score,
    0
  );

  const technicalMax = getNumber(
    technical?.max,
    5
  );

  const fundamentalScore = getNumber(
    fundamental?.score,
    0
  );

  const fundamentalMax = getNumber(
    fundamental?.max,
    5
  );

  const sentimentScore = getNumber(
    sentiment?.score,
    0
  );

  const sentimentMax = getNumber(
    sentiment?.max,
    5
  );

  const decision =
    data?.decision ||
    calculateDecision(
      overallScore,
      overallMax
    );

  const confidence =
    data?.confidence ||
    calculateConfidence(
      overallScore,
      overallMax
    );

  const technicalTrend =
    technical?.trend ||
    "Neutral";

  const daily = technical?.daily || {};
  const h4 = technical?.h4 || {};

  const indicators =
    fundamental?.indicators || [];

  const gaugePercent = calculatePercent(
    overallScore,
    overallMax
  );

  return (
    <div style={styles.dashboard}>

      {/* ======================================================
          TOP SUMMARY
      ====================================================== */}

      <div style={styles.topSummary}>

        {/* LEFT - SYMBOL */}
        <div style={styles.symbolSection}>

          <div style={styles.symbolHeader}>
            <div>

              <div style={styles.symbolName}>
                {data?.asset || "Selected Asset"}
              </div>

              <div style={styles.symbolCode}>
                {data?.symbol || "MARKET"}
              </div>

            </div>

            <div
              style={{
                ...styles.decisionBadge,
                color: getDecisionColor(decision),
                backgroundColor:
                  getDecisionMutedColor(decision),
              }}
            >
              {decision}
            </div>
          </div>

          <div style={styles.confidenceText}>
            {confidence} confidence
          </div>

          <div style={styles.priceBox}>

            <span style={styles.priceLabel}>
              CURRENT PRICE
            </span>

            <strong style={styles.currentPrice}>
              {formatValue(
                daily?.current_price ??
                technical?.current_price ??
                data?.current_price
              )}
            </strong>

          </div>

        </div>


        {/* CENTER - GAUGE */}
        <div style={styles.gaugeSection}>

          <ScoreGauge
            score={overallScore}
            max={overallMax}
            percent={gaugePercent}
            decision={decision}
          />

        </div>


        {/* RIGHT - SCORE BREAKDOWN */}
        <div style={styles.scoreSection}>

          <div style={styles.scoreTitle}>
            INTELLIGENCE SCORE
          </div>

          <div style={styles.bigScore}>
            {formatScore(overallScore)}
            <span style={styles.bigScoreMax}>
              /{formatScore(overallMax)}
            </span>
          </div>

          <div style={styles.scoreBars}>

            <ScoreRow
              label="Technical"
              score={technicalScore}
              max={technicalMax}
              color={theme.colors.primary}
            />

            <ScoreRow
              label="Fundamental"
              score={fundamentalScore}
              max={fundamentalMax}
              color={theme.colors.green}
            />

            <ScoreRow
              label="Sentiment"
              score={sentimentScore}
              max={sentimentMax}
              color={theme.colors.yellow}
            />

          </div>

        </div>

      </div>


      {/* ======================================================
          TECHNICAL ANALYSIS
      ====================================================== */}

      <section style={styles.section}>

        <SectionTitle
          title="Technical Analysis"
          score={`${formatScore(technicalScore)} / ${formatScore(technicalMax)}`}
          color={getTrendColor(technicalTrend)}
        />

        <div style={styles.technicalGrid}>

          <InfoBox
            label="1D TREND"
            value={
              daily?.trend ||
              daily?.bias ||
              technicalTrend
            }
            color={getTrendColor(
              daily?.trend ||
              daily?.bias ||
              technicalTrend
            )}
          />

          <InfoBox
            label="4H TREND"
            value={
              h4?.trend ||
              h4?.bias ||
              "Neutral"
            }
            color={getTrendColor(
              h4?.trend ||
              h4?.bias ||
              "Neutral"
            )}
          />

          <InfoBox
            label="DAILY SCORE"
            value={`${formatScore(
              daily?.score
            )} / 5`}
          />

          <InfoBox
            label="4H SCORE"
            value={`${formatScore(
              h4?.score
            )} / 5`}
          />

        </div>

        <div style={styles.timeframeCards}>

          <TimeframeCard
            title="1D"
            data={daily}
          />

          <TimeframeCard
            title="4H"
            data={h4}
          />

        </div>

      </section>


      {/* ======================================================
          FUNDAMENTAL + NEWS
      ====================================================== */}

      <section style={styles.section}>

        <SectionTitle
          title="Fundamental Intelligence"
          score={`${formatScore(fundamentalScore)} / ${formatScore(fundamentalMax)}`}
          color={getBiasColor(
            fundamental?.bias
          )}
        />

        <div style={styles.fundamentalTop}>

          <div style={styles.biasPanel}>

            <span style={styles.smallLabel}>
              FUNDAMENTAL BIAS
            </span>

            <strong
              style={{
                ...styles.biasValue,
                color: getBiasColor(
                  fundamental?.bias
                ),
              }}
            >
              {fundamental?.bias ||
                "NEUTRAL"}
            </strong>

          </div>

          <div style={styles.fundamentalSummary}>
            {fundamental?.summary ||
              "No fundamental summary available."}
          </div>

        </div>


        {/* INDICATORS */}

        {indicators.length > 0 ? (

          <div style={styles.indicatorGrid}>

            {indicators.map(
              (indicator, index) => (
                <FundamentalCard
                  key={`${indicator?.name || "indicator"}-${index}`}
                  indicator={indicator}
                />
              )
            )}

          </div>

        ) : (

          <div style={styles.noDataBox}>
            No fundamental indicator data available.
          </div>

        )}

        <div style={styles.sourceLine}>
          ●{" "}
          {fundamental?.status ||
            "Fundamental data"}
          {" — "}
          {fundamental?.note ||
            "Market fundamental information."}
        </div>

      </section>


      {/* ======================================================
          MARKET SENTIMENT / NEWS
      ====================================================== */}

      <section style={styles.section}>

        <SectionTitle
          title="Market Sentiment & News"
          score={`${formatScore(sentimentScore)} / ${formatScore(sentimentMax)}`}
          color={getSentimentColor(
            sentimentScore
          )}
        />

        <div style={styles.sentimentGrid}>

          <InfoBox
            label="SENTIMENT"
            value={getSentimentLabel(
              sentimentScore
            )}
            color={getSentimentColor(
              sentimentScore
            )}
          />

          <InfoBox
            label="ARTICLES ANALYZED"
            value={
              sentiment?.articles ??
              0
            }
          />

          <InfoBox
            label="RAW AVERAGE"
            value={
              sentiment?.raw_average ??
              "N/A"
            }
          />

          <InfoBox
            label="SENTIMENT SCORE"
            value={`${formatScore(
              sentimentScore
            )} / ${formatScore(sentimentMax)}`}
          />

        </div>

        <div style={styles.newsPanel}>

          <div style={styles.newsHeader}>
            <span>
              NEWS INTELLIGENCE
            </span>

            <span
              style={{
                color: getSentimentColor(
                  sentimentScore
                ),
              }}
            >
              {getSentimentLabel(
                sentimentScore
              )}
            </span>
          </div>

          <div style={styles.newsText}>
            {sentiment?.note ||
              sentiment?.summary ||
              "No news sentiment summary available."}
          </div>

        </div>

      </section>


      {/* ======================================================
          FINAL DECISION
      ====================================================== */}

      <div
        style={{
          ...styles.finalDecision,
          borderColor:
            getDecisionColor(decision),
        }}
      >

        <div>

          <div style={styles.finalLabel}>
            TRADEXA INTELLIGENCE DECISION
          </div>

          <div
            style={{
              ...styles.finalDecisionText,
              color:
                getDecisionColor(decision),
            }}
          >
            {decision}
          </div>

        </div>

        <div style={styles.finalScore}>
          <span>
            Overall Score
          </span>

          <strong>
            {formatScore(overallScore)}
            <small>
              /{formatScore(overallMax)}
            </small>
          </strong>
        </div>

      </div>

    </div>
  );
}


// ================================================================
// SCORE GAUGE
// ================================================================

function ScoreGauge({
  score,
  max,
  percent,
  decision,
}) {

  const angle =
    -135 + (percent / 100) * 270;

  const color =
    getDecisionColor(decision);

  return (
    <div style={styles.gaugeWrapper}>

      <div style={styles.gaugeTitle}>
        TRADEXA SCORE
      </div>

      <div style={styles.gauge}>

        <div
          style={{
            ...styles.gaugeArc,
            background: `
              conic-gradient(
                from 225deg,
                ${theme.colors.red} 0deg,
                ${theme.colors.red} 65deg,
                ${theme.colors.yellow} 130deg,
                ${theme.colors.green} 225deg,
                transparent 225deg,
                transparent 360deg
              )
            `,
          }}
        />

        <div style={styles.gaugeInner}>

          <div
            style={{
              ...styles.gaugeDecision,
              color,
            }}
          >
            {decision}
          </div>

          <div style={styles.gaugeNumber}>
            {formatScore(score)}
          </div>

          <div style={styles.gaugeMax}>
            / {formatScore(max)}
          </div>

        </div>

        <div
          style={{
            ...styles.gaugeNeedle,
            transform: `rotate(${angle}deg)`,
          }}
        />

        <div style={styles.gaugeCenter} />

      </div>

      <div style={styles.gaugeScale}>

        <span>BEARISH</span>

        <span>NEUTRAL</span>

        <span>BULLISH</span>

      </div>

    </div>
  );
}


// ================================================================
// SCORE ROW
// ================================================================

function ScoreRow({
  label,
  score,
  max,
  color,
}) {

  const percent =
    calculatePercent(score, max);

  return (
    <div style={styles.scoreRow}>

      <div style={styles.scoreRowHeader}>

        <span>
          {label}
        </span>

        <strong>
          {formatScore(score)}
          <small>
            /{formatScore(max)}
          </small>
        </strong>

      </div>

      <div style={styles.scoreTrack}>

        <div
          style={{
            ...styles.scoreFill,
            width: `${percent}%`,
            backgroundColor: color,
          }}
        />

      </div>

    </div>
  );
}


// ================================================================
// SECTION TITLE
// ================================================================

function SectionTitle({
  title,
  score,
  color,
}) {

  return (
    <div style={styles.sectionTitleRow}>

      <div>

        <h2 style={styles.sectionHeading}>
          {title}
        </h2>

      </div>

      <div
        style={{
          ...styles.sectionScore,
          color,
        }}
      >
        {score}
      </div>

    </div>
  );
}


// ================================================================
// INFO BOX
// ================================================================

function InfoBox({
  label,
  value,
  color,
}) {

  return (
    <div style={styles.infoBox}>

      <span style={styles.smallLabel}>
        {label}
      </span>

      <strong
        style={{
          ...styles.infoValue,
          color: color || theme.colors.text,
        }}
      >
        {value}
      </strong>

    </div>
  );
}


// ================================================================
// TIMEFRAME CARD
// ================================================================

function TimeframeCard({
  title,
  data,
}) {

  const trend =
    data?.trend ||
    data?.bias ||
    "Neutral";

  return (
    <div style={styles.timeframeCard}>

      <div style={styles.timeframeHeader}>

        <span style={styles.timeframeTitle}>
          {title}
        </span>

        <span
          style={{
            ...styles.timeframeTrend,
            color: getTrendColor(trend),
          }}
        >
          {trend}
        </span>

      </div>

      <div style={styles.timeframeBody}>

        <div>
          <span style={styles.smallLabel}>
            SCORE
          </span>

          <strong style={styles.timeframeValue}>
            {formatScore(data?.score)} / 5
          </strong>
        </div>

        <div>
          <span style={styles.smallLabel}>
            PRICE
          </span>

          <strong style={styles.timeframeValue}>
            {formatValue(
              data?.current_price
            )}
          </strong>
        </div>

      </div>

    </div>
  );
}


// ================================================================
// FUNDAMENTAL CARD
// ================================================================

function FundamentalCard({
  indicator,
}) {

  const bias =
    indicator?.bias ||
    "NEUTRAL";

  return (
    <div style={styles.fundamentalCard}>

      <div style={styles.fundamentalHeader}>

        <div>

          <div style={styles.indicatorName}>
            {indicator?.name ||
              "Indicator"}
          </div>

          <div style={styles.indicatorValue}>
            {indicator?.value ??
              "No data"}

            {indicator?.unit
              ? ` ${indicator.unit}`
              : ""}
          </div>

        </div>

        <span
          style={{
            ...styles.indicatorBias,
            color: getBiasColor(bias),
          }}
        >
          {bias}
        </span>

      </div>

      <div style={styles.reason}>
        {indicator?.reason ||
          "No explanation available."}
      </div>

      <div style={styles.indicatorScore}>
        Score:{" "}
        <strong>
          {indicator?.score ?? "-"}
        </strong>
      </div>

    </div>
  );
}


// ================================================================
// HELPERS
// ================================================================

function getNumber(value, fallback) {

  if (
    value === null ||
    value === undefined ||
    value === "" ||
    Number.isNaN(Number(value))
  ) {
    return fallback;
  }

  return Number(value);
}


function formatScore(value) {

  const number = Number(value);

  if (
    value === null ||
    value === undefined ||
    Number.isNaN(number)
  ) {
    return "0";
  }

  return Number.isInteger(number)
    ? String(number)
    : number.toFixed(1);
}


function formatValue(value) {

  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return "—";
  }

  if (typeof value === "number") {
    return value.toLocaleString(
      undefined,
      {
        maximumFractionDigits: 6,
      }
    );
  }

  return String(value);
}


function calculatePercent(score, max) {

  const numericScore = Number(score);
  const numericMax = Number(max);

  if (
    !Number.isFinite(numericScore) ||
    !Number.isFinite(numericMax) ||
    numericMax <= 0
  ) {
    return 0;
  }

  return Math.max(
    0,
    Math.min(
      100,
      (numericScore / numericMax) * 100
    )
  );
}


function calculateFallbackOverall(
  technical,
  fundamental,
  sentiment
) {

  const technicalScore =
    getNumber(technical?.score, 0);

  const fundamentalScore =
    getNumber(fundamental?.score, 0);

  const sentimentScore =
    getNumber(sentiment?.score, 0);

  return (
    technicalScore +
    fundamentalScore +
    sentimentScore
  );
}


function calculateDecision(
  score,
  max
) {

  const percent =
    calculatePercent(score, max);

  if (percent >= 67) {
    return "BUY";
  }

  if (percent <= 33) {
    return "SELL";
  }

  return "WAIT";
}


function calculateConfidence(
  score,
  max
) {

  const percent =
    calculatePercent(score, max);

  if (percent >= 80) {
    return "VERY HIGH";
  }

  if (percent >= 67) {
    return "HIGH";
  }

  if (percent >= 50) {
    return "MEDIUM";
  }

  if (percent >= 33) {
    return "LOW";
  }

  return "VERY LOW";
}


function getDecisionColor(decision) {

  if (!decision) {
    return theme.colors.textMuted;
  }

  const value =
    String(decision).toUpperCase();

  if (
    value === "BUY" ||
    value.includes("BULL")
  ) {
    return theme.colors.green;
  }

  if (
    value === "SELL" ||
    value.includes("BEAR")
  ) {
    return theme.colors.red;
  }

  return theme.colors.yellow;
}


function getDecisionMutedColor(decision) {

  if (!decision) {
    return theme.colors.bgHover;
  }

  const value =
    String(decision).toUpperCase();

  if (
    value === "BUY" ||
    value.includes("BULL")
  ) {
    return theme.colors.greenMuted;
  }

  if (
    value === "SELL" ||
    value.includes("BEAR")
  ) {
    return theme.colors.redMuted;
  }

  return theme.colors.bgHover;
}


function getTrendColor(trend) {

  if (!trend) {
    return theme.colors.textMuted;
  }

  const value =
    String(trend).toUpperCase();

  if (
    value.includes("BULL")
  ) {
    return theme.colors.green;
  }

  if (
    value.includes("BEAR")
  ) {
    return theme.colors.red;
  }

  return theme.colors.yellow;
}


function getBiasColor(bias) {

  if (!bias) {
    return theme.colors.textMuted;
  }

  const value =
    String(bias).toUpperCase();

  if (
    value.includes("BULL")
  ) {
    return theme.colors.green;
  }

  if (
    value.includes("BEAR")
  ) {
    return theme.colors.red;
  }

  return theme.colors.yellow;
}


function getSentimentColor(score) {

  const number =
    Number(score);

  if (number >= 3) {
    return theme.colors.green;
  }

  if (number < 2) {
    return theme.colors.red;
  }

  return theme.colors.yellow;
}


function getSentimentLabel(score) {

  const number =
    Number(score);

  if (number >= 3) {
    return "POSITIVE";
  }

  if (number < 2) {
    return "NEGATIVE";
  }

  return "NEUTRAL";
}


// ================================================================
// STYLES
// ================================================================

const styles = {

  layout: {
    display: "flex",
    minHeight: "100vh",
    backgroundColor: theme.colors.bg,
  },

  main: {
    flex: 1,
    padding: "28px 32px 50px",
    maxWidth: "1400px",
    margin: "0 auto",
    boxSizing: "border-box",
  },


  // ============================================================
  // HEADER
  // ============================================================

  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: "24px",
  },

  breadcrumb: {
    display: "flex",
    alignItems: "center",
    gap: "9px",
    color: theme.colors.textMuted,
    fontSize: "12px",
    marginBottom: "8px",
  },

  brand: {
    color: theme.colors.text,
    fontWeight: 800,
  },

  slash: {
    color: theme.colors.textFaint,
  },

  pageTitle: {
    color: theme.colors.text,
    fontSize: "28px",
    fontWeight: 800,
    margin: 0,
    letterSpacing: "-0.03em",
  },

  pageSubtitle: {
    color: theme.colors.textMuted,
    fontSize: "13px",
    marginTop: "6px",
    marginBottom: 0,
  },

  onlineBadge: {
    display: "flex",
    alignItems: "center",
    gap: "7px",
    padding: "8px 12px",
    borderRadius: "7px",
    backgroundColor: theme.colors.greenMuted,
    color: theme.colors.green,
    fontSize: "10px",
    fontWeight: 800,
    letterSpacing: "0.03em",
  },

  onlineDot: {
    width: "6px",
    height: "6px",
    borderRadius: "50%",
    backgroundColor: theme.colors.green,
  },


  // ============================================================
  // SEARCH
  // ============================================================

  searchCard: {
    backgroundColor: theme.colors.bgCard,
    border: `1px solid ${theme.colors.border}`,
    borderRadius: "12px",
    padding: "18px 20px",
    marginBottom: "18px",
  },

  searchTitle: {
    color: theme.colors.text,
    fontSize: "14px",
    fontWeight: 800,
  },

  searchSubtitle: {
    color: theme.colors.textMuted,
    fontSize: "11px",
    marginTop: "4px",
    marginBottom: "15px",
  },

  searchRow: {
    display: "flex",
    gap: "10px",
  },

  inputWrapper: {
    flex: 1,
    position: "relative",
  },

  searchIcon: {
    position: "absolute",
    left: "12px",
    top: "9px",
    color: theme.colors.textMuted,
    fontSize: "17px",
  },

  searchInput: {
    width: "100%",
    boxSizing: "border-box",
    padding: "11px 14px 11px 34px",
    borderRadius: "7px",
    border: `1px solid ${theme.colors.border}`,
    backgroundColor: theme.colors.bg,
    color: theme.colors.text,
    outline: "none",
    fontSize: "13px",
  },

  analyzeButton: {
    minWidth: "105px",
    padding: "10px 20px",
    borderRadius: "7px",
    border: "none",
    backgroundColor: theme.colors.primary,
    color: "#fff",
    fontWeight: 800,
    fontSize: "12px",
    cursor: "pointer",
  },

  quickSymbols: {
    display: "flex",
    alignItems: "center",
    gap: "7px",
    marginTop: "12px",
    flexWrap: "wrap",
  },

  quickLabel: {
    color: theme.colors.textFaint,
    fontSize: "10px",
    marginRight: "3px",
  },

  quickButton: {
    border: `1px solid ${theme.colors.border}`,
    backgroundColor: "transparent",
    color: theme.colors.textMuted,
    borderRadius: "5px",
    padding: "5px 9px",
    fontSize: "10px",
    cursor: "pointer",
  },


  // ============================================================
  // ERROR / LOADING
  // ============================================================

  errorBox: {
    padding: "12px 15px",
    borderRadius: "8px",
    marginBottom: "15px",
    backgroundColor: theme.colors.redMuted,
    color: theme.colors.red,
    border: `1px solid ${theme.colors.red}`,
    fontSize: "12px",
  },

  loadingCard: {
    display: "flex",
    alignItems: "center",
    gap: "14px",
    padding: "25px",
    borderRadius: "10px",
    backgroundColor: theme.colors.bgCard,
    border: `1px solid ${theme.colors.border}`,
  },

  loadingSpinner: {
    width: "20px",
    height: "20px",
    borderRadius: "50%",
    border: `3px solid ${theme.colors.border}`,
    borderTopColor: theme.colors.primary,
  },

  loadingTitle: {
    color: theme.colors.text,
    fontWeight: 700,
    fontSize: "13px",
  },

  loadingText: {
    color: theme.colors.textMuted,
    fontSize: "11px",
    marginTop: "3px",
  },


  // ============================================================
  // DASHBOARD
  // ============================================================

  dashboard: {
    display: "flex",
    flexDirection: "column",
    gap: "15px",
  },

  topSummary: {
    display: "grid",
    gridTemplateColumns: "1.1fr 1fr 1.2fr",
    minHeight: "300px",
    backgroundColor: theme.colors.bgCard,
    border: `1px solid ${theme.colors.border}`,
    borderRadius: "12px",
    overflow: "hidden",
  },

  symbolSection: {
    padding: "24px",
    borderRight: `1px solid ${theme.colors.border}`,
  },

  symbolHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "15px",
  },

  symbolName: {
    color: theme.colors.text,
    fontSize: "24px",
    fontWeight: 900,
  },

  symbolCode: {
    color: theme.colors.textMuted,
    fontSize: "11px",
    marginTop: "3px",
    textTransform: "uppercase",
  },

  decisionBadge: {
    padding: "6px 10px",
    borderRadius: "6px",
    fontSize: "10px",
    fontWeight: 900,
  },

  confidenceText: {
    color: theme.colors.textMuted,
    fontSize: "10px",
    marginTop: "8px",
    textTransform: "uppercase",
  },

  priceBox: {
    marginTop: "45px",
    paddingTop: "18px",
    borderTop: `1px solid ${theme.colors.border}`,
  },

  priceLabel: {
    display: "block",
    color: theme.colors.textFaint,
    fontSize: "9px",
    fontWeight: 700,
    letterSpacing: "0.08em",
  },

  currentPrice: {
    display: "block",
    color: theme.colors.text,
    fontSize: "26px",
    marginTop: "6px",
    fontFamily: "monospace",
  },


  // ============================================================
  // GAUGE
  // ============================================================

  gaugeSection: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    padding: "15px",
    borderRight: `1px solid ${theme.colors.border}`,
  },

  gaugeWrapper: {
    width: "230px",
    textAlign: "center",
  },

  gaugeTitle: {
    color: theme.colors.textMuted,
    fontSize: "10px",
    fontWeight: 800,
    letterSpacing: "0.08em",
    marginBottom: "8px",
  },

  gauge: {
    position: "relative",
    width: "205px",
    height: "150px",
    margin: "0 auto",
    overflow: "hidden",
  },

  gaugeArc: {
    position: "absolute",
    width: "205px",
    height: "205px",
    borderRadius: "50%",
    top: "2px",
    left: "0",
    transform: "rotate(-45deg)",
  },

  gaugeInner: {
    position: "absolute",
    width: "135px",
    height: "135px",
    borderRadius: "50%",
    backgroundColor: theme.colors.bgCard,
    left: "35px",
    top: "37px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 3,
  },

  gaugeDecision: {
    fontSize: "12px",
    fontWeight: 900,
  },

  gaugeNumber: {
    color: theme.colors.text,
    fontSize: "31px",
    fontWeight: 900,
    lineHeight: 1,
    marginTop: "5px",
    fontFamily: "monospace",
  },

  gaugeMax: {
    color: theme.colors.textFaint,
    fontSize: "10px",
    marginTop: "3px",
  },

  gaugeNeedle: {
    position: "absolute",
    width: "78px",
    height: "3px",
    backgroundColor: theme.colors.text,
    left: "64px",
    top: "102px",
    transformOrigin: "left center",
    zIndex: 5,
    borderRadius: "3px",
  },

  gaugeCenter: {
    position: "absolute",
    width: "11px",
    height: "11px",
    borderRadius: "50%",
    backgroundColor: theme.colors.text,
    left: "59px",
    top: "97px",
    zIndex: 6,
  },

  gaugeScale: {
    display: "flex",
    justifyContent: "space-between",
    color: theme.colors.textFaint,
    fontSize: "8px",
    fontWeight: 700,
    marginTop: "-3px",
  },


  // ============================================================
  // SCORE
  // ============================================================

  scoreSection: {
    padding: "25px",
  },

  scoreTitle: {
    color: theme.colors.textMuted,
    fontSize: "10px",
    fontWeight: 800,
    letterSpacing: "0.08em",
  },

  bigScore: {
    color: theme.colors.text,
    fontSize: "39px",
    fontWeight: 900,
    fontFamily: "monospace",
    marginTop: "7px",
  },

  bigScoreMax: {
    color: theme.colors.textFaint,
    fontSize: "13px",
    fontWeight: 500,
  },

  scoreBars: {
    display: "flex",
    flexDirection: "column",
    gap: "14px",
    marginTop: "25px",
  },

  scoreRow: {
    width: "100%",
  },

  scoreRowHeader: {
    display: "flex",
    justifyContent: "space-between",
    color: theme.colors.textMuted,
    fontSize: "10px",
    marginBottom: "5px",
  },

  scoreTrack: {
    height: "6px",
    borderRadius: "5px",
    backgroundColor: theme.colors.bg,
    overflow: "hidden",
  },

  scoreFill: {
    height: "100%",
    borderRadius: "5px",
  },


  // ============================================================
  // SECTIONS
  // ============================================================

  section: {
    backgroundColor: theme.colors.bgCard,
    border: `1px solid ${theme.colors.border}`,
    borderRadius: "12px",
    padding: "22px",
  },

  sectionTitleRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    paddingBottom: "15px",
    borderBottom: `1px solid ${theme.colors.border}`,
    marginBottom: "16px",
  },

  sectionHeading: {
    color: theme.colors.text,
    fontSize: "15px",
    fontWeight: 800,
    margin: 0,
  },

  sectionScore: {
    fontSize: "13px",
    fontWeight: 900,
    fontFamily: "monospace",
  },


  // ============================================================
  // TECHNICAL
  // ============================================================

  technicalGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gap: "10px",
  },

  infoBox: {
    backgroundColor: theme.colors.bg,
    border: `1px solid ${theme.colors.border}`,
    borderRadius: "8px",
    padding: "14px",
    minHeight: "60px",
    boxSizing: "border-box",
  },

  smallLabel: {
    display: "block",
    color: theme.colors.textFaint,
    fontSize: "9px",
    fontWeight: 700,
    letterSpacing: "0.05em",
    marginBottom: "7px",
  },

  infoValue: {
    color: theme.colors.text,
    fontSize: "15px",
    fontWeight: 900,
  },

  timeframeCards: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "10px",
    marginTop: "10px",
  },

  timeframeCard: {
    backgroundColor: theme.colors.bg,
    border: `1px solid ${theme.colors.border}`,
    borderRadius: "8px",
    padding: "15px",
  },

  timeframeHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "15px",
  },

  timeframeTitle: {
    color: theme.colors.text,
    fontSize: "14px",
    fontWeight: 900,
  },

  timeframeTrend: {
    fontSize: "11px",
    fontWeight: 800,
  },

  timeframeBody: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "20px",
  },

  timeframeValue: {
    color: theme.colors.text,
    fontSize: "14px",
    fontFamily: "monospace",
  },


  // ============================================================
  // FUNDAMENTAL
  // ============================================================

  fundamentalTop: {
    display: "grid",
    gridTemplateColumns: "200px 1fr",
    gap: "20px",
    marginBottom: "15px",
  },

  biasPanel: {
    backgroundColor: theme.colors.bg,
    border: `1px solid ${theme.colors.border}`,
    borderRadius: "8px",
    padding: "15px",
  },

  biasValue: {
    fontSize: "18px",
    fontWeight: 900,
  },

  fundamentalSummary: {
    color: theme.colors.textMuted,
    fontSize: "12px",
    lineHeight: 1.6,
    display: "flex",
    alignItems: "center",
  },

  indicatorGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, 1fr)",
    gap: "10px",
  },

  fundamentalCard: {
    backgroundColor: theme.colors.bg,
    border: `1px solid ${theme.colors.border}`,
    borderRadius: "8px",
    padding: "14px",
  },

  fundamentalHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "15px",
  },

  indicatorName: {
    color: theme.colors.text,
    fontSize: "11px",
    fontWeight: 800,
  },

  indicatorValue: {
    color: theme.colors.text,
    fontSize: "18px",
    fontWeight: 900,
    marginTop: "5px",
    fontFamily: "monospace",
  },

  indicatorBias: {
    fontSize: "9px",
    fontWeight: 900,
    textTransform: "uppercase",
  },

  reason: {
    color: theme.colors.textMuted,
    fontSize: "10px",
    lineHeight: 1.5,
    marginTop: "10px",
  },

  indicatorScore: {
    color: theme.colors.textFaint,
    fontSize: "9px",
    marginTop: "10px",
  },

  sourceLine: {
    color: theme.colors.textFaint,
    fontSize: "9px",
    marginTop: "14px",
  },

  noDataBox: {
    padding: "18px",
    textAlign: "center",
    color: theme.colors.textMuted,
    backgroundColor: theme.colors.bg,
    border: `1px solid ${theme.colors.border}`,
    borderRadius: "8px",
    fontSize: "11px",
  },


  // ============================================================
  // SENTIMENT
  // ============================================================

  sentimentGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gap: "10px",
  },

  newsPanel: {
    marginTop: "10px",
    backgroundColor: theme.colors.bg,
    border: `1px solid ${theme.colors.border}`,
    borderRadius: "8px",
    padding: "15px",
  },

  newsHeader: {
    display: "flex",
    justifyContent: "space-between",
    color: theme.colors.textMuted,
    fontSize: "10px",
    fontWeight: 800,
    letterSpacing: "0.05em",
  },

  newsText: {
    color: theme.colors.textMuted,
    fontSize: "11px",
    lineHeight: 1.6,
    marginTop: "10px",
  },


  // ============================================================
  // FINAL DECISION
  // ============================================================

  finalDecision: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: theme.colors.bgCard,
    border: "1px solid",
    borderRadius: "10px",
    padding: "20px 24px",
  },

  finalLabel: {
    color: theme.colors.textFaint,
    fontSize: "9px",
    fontWeight: 800,
    letterSpacing: "0.08em",
  },

  finalDecisionText: {
    fontSize: "25px",
    fontWeight: 900,
    marginTop: "3px",
  },

  finalScore: {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-end",
    color: theme.colors.textMuted,
    fontSize: "9px",
  },

  finalScoreStrong: {
    color: theme.colors.text,
  },
};

export default TradexaIntelligence;
