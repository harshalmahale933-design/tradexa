import { useEffect, useMemo, useState } from "react";
import { API_BASE_URL } from "../api";
import Sidebar from "../components/Sidebar";
import { theme } from "../theme";



function MarketIntelligence({ user, onLogout, onNavigate }) {
  const [topScores, setTopScores] = useState([]);
  const [assetData, setAssetData] = useState({});
  const [selectedAsset, setSelectedAsset] = useState("Gold");
  const [intelligence, setIntelligence] = useState(null);

  const [search, setSearch] = useState("");
  const [biasFilter, setBiasFilter] = useState("All");
  const [loadingTop, setLoadingTop] = useState(true);
  const [loadingIntel, setLoadingIntel] = useState(false);
  const [error, setError] = useState("");
  
  // =========================================================
  // LOAD TOP SCORER
  // =========================================================

  useEffect(() => {
    let cancelled = false;

    const loadTopScorer = async () => {
      try {
        setLoadingTop(true);
        setError("");

        const response = await fetch(`${API_BASE_URL}/market/top-scorer`);

        if (!response.ok) {
          throw new Error("Unable to load market data.");
        }

        const data = await response.json();

        if (!cancelled) {
          setTopScores(data.results || []);
        }
      } catch (err) {
        console.error(err);

        if (!cancelled) {
          setError("Unable to load market data.");
        }
      } finally {
        if (!cancelled) {
          setLoadingTop(false);
        }
      }
    };

    loadTopScorer();

    return () => {
      cancelled = true;
    };
  }, []);

  // =========================================================
  // LOAD INTELLIGENCE FOR ONE ASSET
  // =========================================================

  const loadIntelligence = async (asset) => {
    if (!asset) return;

    setSelectedAsset(asset);
    setLoadingIntel(true);
    setError("");

    try {
      const response = await fetch(
        `${API_BASE_URL}/market/intelligence/${encodeURIComponent(asset)}`
      );

      if (!response.ok) {
        throw new Error(`Unable to analyze ${asset}.`);
      }

      const data = await response.json();

      setIntelligence(data);

      // Store the intelligence so the Top Scorer
      // table can display 1D / 4H / News / Fundamental data.
      setAssetData((prev) => ({
        ...prev,
        [asset]: data,
      }));
    } catch (err) {
      console.error(err);
      setIntelligence(null);
      setError(err.message);
    } finally {
      setLoadingIntel(false);
    }
  };

  // =========================================================
  // LOAD GOLD INITIALLY
  // =========================================================

  useEffect(() => {
    loadIntelligence("Gold");
  }, []);

  // =========================================================
  // LOAD INTELLIGENCE DATA FOR TOP SCORER ROWS
  // =========================================================

  useEffect(() => {
    if (!topScores.length) return;

    let cancelled = false;

    const loadRows = async () => {
      const results = await Promise.allSettled(
        topScores.map(async (asset) => {
          const response = await fetch(
            `${API_BASE_URL}/market/intelligence/${encodeURIComponent(asset.asset)}`
          );

          if (!response.ok) {
            throw new Error(`Failed for ${asset.asset}`);
          }

          return {
            asset: asset.asset,
            data: await response.json(),
          };
        })
      );

      if (cancelled) return;

      const mapped = {};

      results.forEach((result) => {
        if (result.status === "fulfilled") {
          mapped[result.value.asset] = result.value.data;
        }
      });

      setAssetData((prev) => ({
        ...prev,
        ...mapped,
      }));
    };

    loadRows();

    return () => {
      cancelled = true;
    };
  }, [topScores]);

  // =========================================================
  // FILTER TABLE
  // =========================================================

  const filteredScores = useMemo(() => {
    return topScores.filter((asset) => {
      const matchesSearch =
        !search ||
        asset.asset?.toLowerCase().includes(search.toLowerCase()) ||
        asset.symbol?.toLowerCase().includes(search.toLowerCase());

      const matchesBias =
        biasFilter === "All" ||
        getBias(asset) === biasFilter;

      return matchesSearch && matchesBias;
    });
  }, [topScores, search, biasFilter]);

  return (
    <div style={styles.layout}>
      <Sidebar
        activePage="market"
        onNavigate={onNavigate}
        user={user}
        onLogout={onLogout}
      />

      <main style={styles.main}>
        {/* =====================================================
            PAGE HEADER
        ====================================================== */}

        <div style={styles.breadcrumb}>
          <strong>Tradexa</strong>
          <span>/</span>
          <span>Market Intelligence</span>
        </div>

        <div style={styles.header}>
          <div>
            <h1 style={styles.pageTitle}>Market Intelligence</h1>

            <p style={styles.pageSubtitle}>
              Multi-factor market scoring across technical,
              fundamental, sentiment and multi-timeframe data.
            </p>
          </div>

          <div style={styles.liveBadge}>
            <span style={styles.liveDot}></span>
            LIVE MARKET DATA
          </div>
        </div>

        {/* =====================================================
            SEARCH / FILTER
        ====================================================== */}

        <div style={styles.filterRow}>
          <div style={styles.searchBox}>
            <span style={styles.searchIcon}>⌕</span>

            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search symbol..."
              style={styles.searchInput}
            />
          </div>

          <select
            value={biasFilter}
            onChange={(e) => setBiasFilter(e.target.value)}
            style={styles.filterSelect}
          >
            <option value="All">Bias: All</option>
            <option value="Bullish">Bullish</option>
            <option value="Neutral">Neutral</option>
            <option value="Bearish">Bearish</option>
          </select>
        </div>

        {error && (
          <div style={styles.errorBox}>
            {error}
          </div>
        )}

        {/* =====================================================
            TOP SCORER
        ====================================================== */}

        <section style={styles.card}>
          <div style={styles.cardHeader}>
            <div>
              <h2 style={styles.cardTitle}>Top Scorer</h2>

              <p style={styles.cardSubtitle}>
                Ranked market opportunities based on Tradexa
                Intelligence scoring.
              </p>
            </div>

            <div style={styles.engineStatus}>
              <span style={styles.statusDot}></span>
              Market engine online
            </div>
          </div>

          {loadingTop ? (
            <div style={styles.loading}>
              Loading market data...
            </div>
          ) : filteredScores.length === 0 ? (
            <div style={styles.loading}>
              No market data available.
            </div>
          ) : (
            <div style={styles.tableScroll}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>SYMBOL</th>
                    <th style={styles.th}>ASSET</th>
                    <th style={styles.th}>BIAS</th>
                    <th style={styles.th}>SCORE</th>
                    <th style={styles.th}>PRICE</th>
                    <th style={styles.th}>1 DAY</th>
                    <th style={styles.th}>4 HOUR</th>
                    <th style={styles.th}>NEWS / SENTIMENT</th>
                    <th style={styles.th}>FUNDAMENTAL</th>
                    <th style={styles.th}></th>
                  </tr>
                </thead>

                <tbody>
                  {filteredScores.map((asset, index) => {
                    const data = assetData[asset.asset];

                    return (
                      <MarketRow
                        key={`${asset.asset}-${index}`}
                        asset={asset}
                        data={data}
                        selected={selectedAsset === asset.asset}
                        onClick={() =>
                          loadIntelligence(asset.asset)
                        }
                      />
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* =====================================================
            ASSET INTELLIGENCE
        ====================================================== */}

        <section style={styles.assetPanel}>
          <div style={styles.assetPanelHeader}>
            <div>
              <h2 style={styles.cardTitle}>
                Asset Intelligence
              </h2>

              <p style={styles.cardSubtitle}>
                Detailed analysis for the selected asset.
              </p>
            </div>

            <div style={styles.analyzeRow}>
              <select
                value={selectedAsset}
                onChange={(e) => loadIntelligence(e.target.value)}
                style={styles.assetSelect}
              >
                {topScores.length > 0 ? (
                  topScores.map((asset) => (
                    <option
                      key={asset.asset}
                      value={asset.asset}
                    >
                      {asset.asset}
                    </option>
                  ))
                ) : (
                  <option value="Gold">Gold</option>
                )}
              </select>

              <button
                onClick={() => loadIntelligence(selectedAsset)}
                style={styles.analyzeButton}
              >
                {loadingIntel ? "Loading..." : "Analyze"}
              </button>
            </div>
          </div>

          {loadingIntel ? (
            <div style={styles.loadingPanel}>
              Fetching live intelligence for{" "}
              <strong>{selectedAsset}</strong>...
            </div>
          ) : intelligence ? (
            <IntelligenceDashboard data={intelligence} />
          ) : (
            <div style={styles.loadingPanel}>
              Select an asset to view intelligence.
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

// ============================================================
// MARKET ROW
// ============================================================

function MarketRow({
  asset,
  data,
  selected,
  onClick,
}) {
  const bias = getBias(asset);
  const biasColor = getBiasColor(bias);

  const technical = data?.technical;
  const fundamental = data?.fundamental;
  const sentiment = data?.sentiment;

  const daily = technical?.daily;
  const h4 = technical?.h4;

  return (
    <tr
      style={{
        ...styles.tr,
        ...(selected ? styles.selectedRow : {}),
      }}
      onClick={onClick}
    >
      {/* SYMBOL */}
      <td style={styles.td}>
        <div style={styles.symbol}>
          {asset.symbol || getSymbol(asset.asset)}
        </div>

        <div style={styles.category}>
          {getCategory(asset.asset)}
        </div>
      </td>

      {/* ASSET */}
      <td style={styles.td}>
        <strong style={styles.assetText}>
          {asset.asset}
        </strong>
      </td>

      {/* BIAS */}
      <td style={styles.td}>
        <span
          style={{
            ...styles.biasBadge,
            color: biasColor,
            backgroundColor: getBiasBackground(bias),
          }}
        >
          {bias}
        </span>
      </td>

      {/* SCORE */}
      <td style={styles.td}>
        <span
          style={{
            ...styles.scoreBadge,
            color:
              Number(asset.score) >= 0
                ? theme.colors.green
                : theme.colors.red,
            backgroundColor:
              Number(asset.score) >= 0
                ? theme.colors.greenMuted
                : theme.colors.redMuted,
          }}
        >
          {formatScore(asset.score)}
        </span>
      </td>

      {/* PRICE */}
      <td style={styles.td}>
        <span style={styles.price}>
          {asset.current_price ??
            daily?.current_price ??
            "—"}
        </span>
      </td>

      {/* 1 DAY */}
      <td style={styles.td}>
        <TimeframeCell
          timeframe="1D"
          value={daily}
        />
      </td>

      {/* 4 HOUR */}
      <td style={styles.td}>
        <TimeframeCell
          timeframe="4H"
          value={h4}
        />
      </td>

      {/* NEWS / SENTIMENT */}
      <td style={styles.td}>
        <SentimentCell sentiment={sentiment} />
      </td>

      {/* FUNDAMENTAL */}
      <td style={styles.td}>
        <FundamentalCell fundamental={fundamental} />
      </td>

      {/* ARROW */}
      <td style={styles.td}>
        <span style={styles.arrow}>›</span>
      </td>
    </tr>
  );
}

// ============================================================
// TIMEFRAME CELL
// ============================================================

function TimeframeCell({ value }) {
  if (!value) {
    return <span style={styles.mutedDash}>—</span>;
  }

  const trend = value.trend || value.bias || "Neutral";
  const score = value.score;

  const color = getBiasColorFromText(trend);

  return (
    <div>
      <div
        style={{
          ...styles.tableTrend,
          color,
        }}
      >
        {trend}
      </div>

      <div style={styles.tableSubValue}>
        {score != null ? `${score}/5` : "Available"}
      </div>
    </div>
  );
}

// ============================================================
// SENTIMENT CELL
// ============================================================

function SentimentCell({ sentiment }) {
  if (!sentiment) {
    return <span style={styles.mutedDash}>—</span>;
  }

  const score = Number(sentiment.score ?? 0);
  const max = Number(sentiment.max ?? 5);

  let label = "Neutral";

  if (score >= 3) {
    label = "Positive";
  } else if (score < 2) {
    label = "Negative";
  }

  return (
    <div>
      <div
        style={{
          ...styles.tableTrend,
          color: getSentimentColor(score),
        }}
      >
        {label}
      </div>

      <div style={styles.tableSubValue}>
        Score: {score}/{max}
      </div>
    </div>
  );
}

// ============================================================
// FUNDAMENTAL CELL
// ============================================================

function FundamentalCell({ fundamental }) {
  if (!fundamental) {
    return <span style={styles.mutedDash}>—</span>;
  }

  const bias = normalizeBias(
    fundamental.bias
  );

  return (
    <div>
      <div
        style={{
          ...styles.tableTrend,
          color: getBiasColor(bias),
        }}
      >
        {bias}
      </div>

      <div style={styles.tableSubValue}>
        Score:{" "}
        {fundamental.score != null
          ? `${fundamental.score}/${fundamental.max ?? 5}`
          : "—"}
      </div>
    </div>
  );
}

// ============================================================
// INTELLIGENCE DASHBOARD
// ============================================================

function IntelligenceDashboard({ data }) {
  return (
    <div style={styles.intelligenceGrid}>
      <TechnicalCard technical={data.technical} />

      <FundamentalCard
        fundamental={data.fundamental}
      />

      <SentimentCard
        sentiment={data.sentiment}
      />

      <MultiTimeframeCard
        technical={data.technical}
      />
    </div>
  );
}

// ============================================================
// TECHNICAL CARD
// ============================================================

function TechnicalCard({ technical }) {
  if (!technical) {
    return (
      <IntelligenceCard
        title="Technical Analysis"
        icon="⌁"
      >
        <EmptyData />
      </IntelligenceCard>
    );
  }

  const daily = technical.daily;
  const h4 = technical.h4;

  return (
    <IntelligenceCard
      title="Technical Analysis"
      icon="⌁"
      accent={theme.colors.primary}
    >
      <div style={styles.cardTopValue}>
        <div>
          <span style={styles.smallLabel}>
            Overall Bias
          </span>

          <strong
            style={{
              ...styles.bigValue,
              color: getBiasColorFromText(
                technical.trend
              ),
            }}
          >
            {technical.trend || "Neutral"}
          </strong>
        </div>

        <div style={styles.cardScore}>
          {technical.score ?? "—"}
          <span>
            / {technical.max ?? 10}
          </span>
        </div>
      </div>

      <div style={styles.indicatorList}>
        <IndicatorLine
          label="1 Day Trend"
          value={daily?.trend}
          color={getBiasColorFromText(
            daily?.trend
          )}
        />

        <IndicatorLine
          label="1 Day Score"
          value={
            daily?.score != null
              ? `${daily.score} / 5`
              : "—"
          }
        />

        <IndicatorLine
          label="4 Hour Trend"
          value={h4?.trend}
          color={getBiasColorFromText(
            h4?.trend
          )}
        />

        <IndicatorLine
          label="4 Hour Score"
          value={
            h4?.score != null
              ? `${h4.score} / 5`
              : "—"
          }
        />

        <IndicatorLine
          label="Current Price"
          value={
            daily?.current_price ?? "—"
          }
        />
      </div>

      <div style={styles.cardFooter}>
        <span>Technical Summary</span>

        <p>
          {technical.summary ||
            "Technical market analysis based on available price data and indicators."}
        </p>
      </div>
    </IntelligenceCard>
  );
}

// ============================================================
// FUNDAMENTAL CARD
// ============================================================

function FundamentalCard({ fundamental }) {
  if (!fundamental) {
    return (
      <IntelligenceCard
        title="Fundamental Analysis"
        icon="◈"
      >
        <EmptyData />
      </IntelligenceCard>
    );
  }

  const indicators =
    fundamental.indicators || [];

  return (
    <IntelligenceCard
      title="Fundamental Analysis"
      icon="◈"
      accent={getBiasColor(
        normalizeBias(fundamental.bias)
      )}
    >
      <div style={styles.cardTopValue}>
        <div>
          <span style={styles.smallLabel}>
            Overall Bias
          </span>

          <strong
            style={{
              ...styles.bigValue,
              color: getBiasColor(
                normalizeBias(
                  fundamental.bias
                )
              ),
            }}
          >
            {normalizeBias(
              fundamental.bias
            )}
          </strong>
        </div>

        <div style={styles.cardScore}>
          {fundamental.score ?? "—"}
          <span>
            / {fundamental.max ?? 5}
          </span>
        </div>
      </div>

      <div style={styles.indicatorList}>
        {indicators.length > 0 ? (
          indicators
            .slice(0, 5)
            .map((indicator, index) => (
              <IndicatorLine
                key={`${indicator.name}-${index}`}
                label={indicator.name}
                value={
                  indicator.value ??
                  indicator.bias ??
                  "—"
                }
                color={getBiasColor(
                  normalizeBias(
                    indicator.bias
                  )
                )}
              />
            ))
        ) : (
          <IndicatorLine
            label="Fundamental Status"
            value={fundamental.status || "Available"}
          />
        )}
      </div>

      <div style={styles.cardFooter}>
        <span>Fundamental Summary</span>

        <p>
          {fundamental.summary ||
            "Fundamental market factors are being evaluated."}
        </p>
      </div>
    </IntelligenceCard>
  );
}

// ============================================================
// SENTIMENT CARD
// ============================================================

function SentimentCard({ sentiment }) {
  if (!sentiment) {
    return (
      <IntelligenceCard
        title="News & Sentiment"
        icon="◉"
      >
        <EmptyData />
      </IntelligenceCard>
    );
  }

  const score = Number(
    sentiment.score ?? 0
  );

  const max = Number(
    sentiment.max ?? 5
  );

  const percentage = Math.max(
    0,
    Math.min(100, (score / max) * 100)
  );

  const label =
    score >= 3
      ? "Positive"
      : score < 2
      ? "Negative"
      : "Neutral";

  return (
    <IntelligenceCard
      title="News & Sentiment"
      icon="◉"
      accent={getSentimentColor(score)}
    >
      <div style={styles.cardTopValue}>
        <div>
          <span style={styles.smallLabel}>
            Sentiment
          </span>

          <strong
            style={{
              ...styles.bigValue,
              color: getSentimentColor(score),
            }}
          >
            {label}
          </strong>
        </div>

        <div style={styles.cardScore}>
          {score}
          <span>
            / {max}
          </span>
        </div>
      </div>

      <div style={styles.sentimentVisual}>
        <div style={styles.sentimentCircle}>
          <strong>
            {Math.round(percentage)}%
          </strong>

          <span>Positive</span>
        </div>

        <div style={styles.sentimentStats}>
          <div>
            <span
              style={{
                ...styles.sentimentDot,
                backgroundColor:
                  theme.colors.green,
              }}
            ></span>

            Positive
          </div>

          <div>
            <span
              style={{
                ...styles.sentimentDot,
                backgroundColor:
                  theme.colors.yellow,
              }}
            ></span>

            Neutral
          </div>

          <div>
            <span
              style={{
                ...styles.sentimentDot,
                backgroundColor:
                  theme.colors.red,
              }}
            ></span>

            Negative
          </div>
        </div>
      </div>

      <div style={styles.newsInfo}>
        <span>Articles Analyzed</span>

        <strong>
          {sentiment.articles ?? 0}
        </strong>
      </div>

      <div style={styles.cardFooter}>
        <span>News Sentiment</span>

        <p>
          {sentiment.note ||
            "Latest available news and sentiment data."}
        </p>
      </div>
    </IntelligenceCard>
  );
}

// ============================================================
// MULTI TIMEFRAME CARD
// ============================================================

function MultiTimeframeCard({ technical }) {
  const timeframes = [
    {
      name: "1 Day",
      data: technical?.daily,
    },
    {
      name: "4 Hour",
      data: technical?.h4,
    },
    {
      name: "1 Hour",
      data: technical?.h1,
    },
    {
      name: "30 Min",
      data: technical?.m30,
    },
    {
      name: "15 Min",
      data: technical?.m15,
    },
  ];

  return (
    <IntelligenceCard
      title="Multi-Timeframe Analysis"
      icon="◫"
      accent={theme.colors.yellow}
    >
      <div style={styles.timeframeHeader}>
        <span>TIMEFRAME</span>
        <span>TREND</span>
        <span>BIAS</span>
        <span>SCORE</span>
      </div>

      <div>
        {timeframes.map((item) => {
          const trend =
            item.data?.trend ||
            item.data?.bias ||
            "—";

          const score =
            item.data?.score;

          return (
            <div
              key={item.name}
              style={styles.timeframeRow}
            >
              <span style={styles.timeframeName}>
                {item.name}
              </span>

              <span
                style={{
                  color: getBiasColorFromText(
                    trend
                  ),
                  fontWeight: 800,
                }}
              >
                {trend !== "—"
                  ? "↑"
                  : "—"}
              </span>

              <span
                style={{
                  color: getBiasColorFromText(
                    trend
                  ),
                  fontWeight: 700,
                  fontSize: "11px",
                }}
              >
                {trend}
              </span>

              <span style={styles.timeframeScore}>
                {score != null
                  ? `${score} / 5`
                  : "—"}
              </span>
            </div>
          );
        })}
      </div>

      <div style={styles.cardFooter}>
        <span>Overall Summary</span>

        <p>
          Stronger alignment across higher
          timeframes receives greater weight in
          the market intelligence score.
        </p>
      </div>
    </IntelligenceCard>
  );
}

// ============================================================
// INTELLIGENCE CARD
// ============================================================

function IntelligenceCard({
  title,
  icon,
  accent,
  children,
}) {
  return (
    <div
      style={{
        ...styles.intelligenceCard,
        borderTop: `2px solid ${
          accent || theme.colors.border
        }`,
      }}
    >
      <div style={styles.intelligenceCardHeader}>
        <div style={styles.intelligenceTitle}>
          <span
            style={{
              ...styles.cardIcon,
              color:
                accent ||
                theme.colors.primary,
            }}
          >
            {icon}
          </span>

          {title}
        </div>
      </div>

      {children}
    </div>
  );
}

// ============================================================
// INDICATOR LINE
// ============================================================

function IndicatorLine({
  label,
  value,
  color,
}) {
  return (
    <div style={styles.indicatorLine}>
      <span>{label}</span>

      <strong
        style={{
          color:
            color ||
            theme.colors.text,
        }}
      >
        {value || "—"}
      </strong>
    </div>
  );
}

// ============================================================
// EMPTY DATA
// ============================================================

function EmptyData() {
  return (
    <div style={styles.emptyData}>
      No data available.
    </div>
  );
}

// ============================================================
// HELPERS
// ============================================================

function getBias(asset) {
  if (!asset) return "Neutral";

  if (asset.trend) {
    return normalizeBias(asset.trend);
  }

  if (asset.bias) {
    return normalizeBias(asset.bias);
  }

  if (Number(asset.score) > 0) {
    return "Bullish";
  }

  if (Number(asset.score) < 0) {
    return "Bearish";
  }

  return "Neutral";
}

function normalizeBias(value) {
  if (!value) return "Neutral";

  const text = String(value).toLowerCase();

  if (
    text.includes("very bullish") ||
    text.includes("bullish")
  ) {
    return "Bullish";
  }

  if (
    text.includes("very bearish") ||
    text.includes("bearish")
  ) {
    return "Bearish";
  }

  return "Neutral";
}

function getBiasColor(bias) {
  if (bias === "Bullish") {
    return theme.colors.green;
  }

  if (bias === "Bearish") {
    return theme.colors.red;
  }

  return theme.colors.yellow;
}

function getBiasBackground(bias) {
  if (bias === "Bullish") {
    return theme.colors.greenMuted;
  }

  if (bias === "Bearish") {
    return theme.colors.redMuted;
  }

  return "rgba(234, 179, 8, 0.12)";
}

function getBiasColorFromText(value) {
  if (!value) {
    return theme.colors.textMuted;
  }

  const text = String(value).toLowerCase();

  if (text.includes("bull")) {
    return theme.colors.green;
  }

  if (text.includes("bear")) {
    return theme.colors.red;
  }

  return theme.colors.yellow;
}

function getSentimentColor(score) {
  if (score >= 3) {
    return theme.colors.green;
  }

  if (score < 2) {
    return theme.colors.red;
  }

  return theme.colors.yellow;
}

function formatScore(score) {
  if (score == null) {
    return "—";
  }

  const number = Number(score);

  if (Number.isNaN(number)) {
    return score;
  }

  return number > 0
    ? `+${number}`
    : String(number);
}

function getSymbol(asset) {
  if (!asset) return "—";

  const map = {
    Gold: "XAUUSD",
    Bitcoin: "BTCUSD",
    Ethereum: "ETHUSD",
    "British Pound": "GBPUSD",
    Euro: "EURUSD",
    "US Dollar / Yen": "USDJPY",
  };

  return map[asset] || asset;
}

function getCategory(asset) {
  if (!asset) return "Market";

  const text = asset.toLowerCase();

  if (
    text.includes("gold") ||
    text.includes("silver")
  ) {
    return "Metal";
  }

  if (
    text.includes("bitcoin") ||
    text.includes("ethereum") ||
    text.includes("crypto")
  ) {
    return "Crypto";
  }

  if (
    text.includes("pound") ||
    text.includes("euro") ||
    text.includes("yen") ||
    text.includes("usd")
  ) {
    return "Forex";
  }

  return "Market";
}

// ============================================================
// STYLES
// ============================================================

const styles = {
  layout: {
    display: "flex",
    minHeight: "100vh",
    backgroundColor: theme.colors.bg,
  },

  main: {
    flex: 1,
    minWidth: 0,
    padding: "28px 30px 50px",
    maxWidth: "1500px",
    margin: "0 auto",
  },

  breadcrumb: {
    display: "flex",
    alignItems: "center",
    gap: "9px",
    color: theme.colors.textMuted,
    fontSize: "12px",
    marginBottom: "10px",
  },

  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: "22px",
  },

  pageTitle: {
    color: theme.colors.text,
    fontSize: "27px",
    fontWeight: 800,
    margin: 0,
    letterSpacing: "-0.03em",
  },

  pageSubtitle: {
    color: theme.colors.textMuted,
    fontSize: "12.5px",
    marginTop: "5px",
  },

  liveBadge: {
    display: "flex",
    alignItems: "center",
    gap: "7px",
    padding: "7px 12px",
    borderRadius: "7px",
    backgroundColor: theme.colors.greenMuted,
    color: theme.colors.green,
    fontSize: "10px",
    fontWeight: 800,
  },

  liveDot: {
    width: "6px",
    height: "6px",
    borderRadius: "50%",
    backgroundColor: theme.colors.green,
  },

  filterRow: {
    display: "flex",
    justifyContent: "flex-end",
    alignItems: "center",
    gap: "10px",
    marginBottom: "20px",
  },

  searchBox: {
    display: "flex",
    alignItems: "center",
    width: "250px",
    height: "38px",
    border: `1px solid ${theme.colors.border}`,
    borderRadius: "7px",
    backgroundColor: theme.colors.bgCard,
  },

  searchIcon: {
    color: theme.colors.textFaint,
    paddingLeft: "11px",
    fontSize: "16px",
  },

  searchInput: {
    width: "100%",
    height: "100%",
    border: "none",
    outline: "none",
    background: "transparent",
    color: theme.colors.text,
    padding: "0 10px",
    fontSize: "12px",
  },

  filterSelect: {
    height: "38px",
    minWidth: "135px",
    border: `1px solid ${theme.colors.border}`,
    borderRadius: "7px",
    backgroundColor: theme.colors.bgCard,
    color: theme.colors.text,
    padding: "0 12px",
    fontSize: "12px",
    outline: "none",
  },

  card: {
    backgroundColor: theme.colors.bgCard,
    border: `1px solid ${theme.colors.border}`,
    borderRadius: "12px",
    overflow: "hidden",
    marginBottom: "20px",
  },

  cardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "20px 22px",
    borderBottom: `1px solid ${theme.colors.border}`,
  },

  cardTitle: {
    color: theme.colors.text,
    fontSize: "16px",
    fontWeight: 800,
    margin: 0,
  },

  cardSubtitle: {
    color: theme.colors.textMuted,
    fontSize: "11px",
    marginTop: "5px",
    marginBottom: 0,
  },

  engineStatus: {
    display: "flex",
    alignItems: "center",
    gap: "7px",
    color: theme.colors.textMuted,
    fontSize: "10px",
  },

  statusDot: {
    width: "6px",
    height: "6px",
    borderRadius: "50%",
    backgroundColor: theme.colors.green,
  },

  tableScroll: {
    width: "100%",
    overflowX: "auto",
  },

  table: {
    width: "100%",
    minWidth: "1100px",
    borderCollapse: "collapse",
  },

  th: {
    padding: "10px 12px",
    textAlign: "left",
    color: theme.colors.textMuted,
    backgroundColor: theme.colors.bgHover,
    fontSize: "9px",
    fontWeight: 800,
    letterSpacing: "0.05em",
    borderRight: `1px solid ${theme.colors.border}`,
    borderBottom: `1px solid ${theme.colors.border}`,
    whiteSpace: "nowrap",
  },

  tr: {
    cursor: "pointer",
    transition: "background-color 0.15s",
  },

  selectedRow: {
    backgroundColor: "rgba(79, 70, 229, 0.07)",
  },

  td: {
    padding: "12px",
    borderRight: `1px solid ${theme.colors.border}`,
    borderBottom: `1px solid ${theme.colors.border}`,
    verticalAlign: "middle",
    fontSize: "11px",
  },

  symbol: {
    color: "#6ea8ff",
    fontWeight: 800,
    fontSize: "12px",
  },

  category: {
    color: theme.colors.textFaint,
    fontSize: "9px",
    marginTop: "3px",
  },

  assetText: {
    color: theme.colors.text,
    fontSize: "11px",
  },

  biasBadge: {
    display: "inline-block",
    padding: "4px 8px",
    borderRadius: "12px",
    fontSize: "9px",
    fontWeight: 800,
  },

  scoreBadge: {
    display: "inline-block",
    padding: "4px 8px",
    borderRadius: "5px",
    fontSize: "10px",
    fontWeight: 800,
  },

  price: {
    color: theme.colors.text,
    fontWeight: 700,
    fontFamily: "monospace",
    fontSize: "11px",
  },

  tableTrend: {
    fontSize: "10px",
    fontWeight: 800,
  },

  tableSubValue: {
    color: theme.colors.textFaint,
    fontSize: "9px",
    marginTop: "3px",
  },

  mutedDash: {
    color: theme.colors.textFaint,
    fontSize: "13px",
  },

  arrow: {
    color: theme.colors.textMuted,
    fontSize: "18px",
  },

  assetPanel: {
    backgroundColor: theme.colors.bgCard,
    border: `1px solid ${theme.colors.border}`,
    borderRadius: "12px",
    overflow: "hidden",
  },

  assetPanelHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "19px 22px",
    borderBottom: `1px solid ${theme.colors.border}`,
  },

  analyzeRow: {
    display: "flex",
    gap: "9px",
  },

  assetSelect: {
    width: "190px",
    height: "37px",
    backgroundColor: theme.colors.bg,
    border: `1px solid ${theme.colors.border}`,
    borderRadius: "7px",
    color: theme.colors.text,
    padding: "0 11px",
    outline: "none",
    fontSize: "11px",
  },

  analyzeButton: {
    height: "37px",
    padding: "0 19px",
    border: "none",
    borderRadius: "7px",
    backgroundColor: theme.colors.primary,
    color: "#fff",
    fontSize: "11px",
    fontWeight: 800,
    cursor: "pointer",
  },

  intelligenceGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(4, minmax(0, 1fr))",
    gap: "10px",
    padding: "16px",
  },

  intelligenceCard: {
    minWidth: 0,
    backgroundColor: theme.colors.bg,
    border: `1px solid ${theme.colors.border}`,
    borderRadius: "9px",
    overflow: "hidden",
  },

  intelligenceCardHeader: {
    padding: "13px 14px",
    borderBottom: `1px solid ${theme.colors.border}`,
    backgroundColor: theme.colors.bgHover,
  },

  intelligenceTitle: {
    display: "flex",
    alignItems: "center",
    gap: "7px",
    color: theme.colors.text,
    fontSize: "12px",
    fontWeight: 800,
  },

  cardIcon: {
    fontSize: "15px",
  },

  cardTopValue: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "14px",
  },

  smallLabel: {
    display: "block",
    color: theme.colors.textMuted,
    fontSize: "9px",
    marginBottom: "4px",
  },

  bigValue: {
    color: theme.colors.text,
    fontSize: "14px",
    fontWeight: 800,
  },

  cardScore: {
    color: theme.colors.text,
    fontSize: "19px",
    fontWeight: 900,
  },

  cardScoreSpan: {
    color: theme.colors.textFaint,
    fontSize: "10px",
  },

  indicatorList: {
    padding: "0 14px 10px",
  },

  indicatorLine: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "8px",
    padding: "7px 0",
    borderBottom: `1px solid ${theme.colors.border}`,
  },

  indicatorLineLabel: {
    color: theme.colors.textMuted,
    fontSize: "9px",
  },

  indicatorLineValue: {
    fontSize: "9px",
  },

  cardFooter: {
    padding: "12px 14px",
    backgroundColor: theme.colors.bgHover,
    borderTop: `1px solid ${theme.colors.border}`,
  },

  cardFooterSpan: {
    color: theme.colors.textMuted,
    fontSize: "9px",
  },

  cardFooterP: {
    color: theme.colors.textMuted,
    fontSize: "9px",
    lineHeight: 1.5,
    margin: "6px 0 0",
  },

  sentimentVisual: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "16px",
    padding: "10px 14px 14px",
  },

  sentimentCircle: {
    width: "74px",
    height: "74px",
    borderRadius: "50%",
    border: `8px solid ${theme.colors.green}`,
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    flexShrink: 0,
  },

  sentimentCircleStrong: {
    color: theme.colors.text,
    fontSize: "15px",
    fontWeight: 900,
  },

  sentimentCircleSpan: {
    color: theme.colors.textMuted,
    fontSize: "8px",
  },

  sentimentStats: {
    display: "flex",
    flexDirection: "column",
    gap: "7px",
    color: theme.colors.textMuted,
    fontSize: "9px",
  },

  sentimentDot: {
    display: "inline-block",
    width: "6px",
    height: "6px",
    borderRadius: "50%",
    marginRight: "6px",
  },

  newsInfo: {
    display: "flex",
    justifyContent: "space-between",
    margin: "0 14px 10px",
    padding: "8px 0",
    borderTop: `1px solid ${theme.colors.border}`,
    color: theme.colors.textMuted,
    fontSize: "9px",
  },

  newsInfoStrong: {
    color: theme.colors.text,
  },

  timeframeHeader: {
    display: "grid",
    gridTemplateColumns: "1.2fr .7fr 1fr .9fr",
    gap: "5px",
    padding: "11px 14px 7px",
    color: theme.colors.textFaint,
    fontSize: "8px",
    fontWeight: 800,
  },

  timeframeRow: {
    display: "grid",
    gridTemplateColumns: "1.2fr .7fr 1fr .9fr",
    gap: "5px",
    alignItems: "center",
    padding: "9px 14px",
    borderTop: `1px solid ${theme.colors.border}`,
    fontSize: "9px",
  },

  timeframeName: {
    color: theme.colors.textMuted,
  },

  timeframeScore: {
    color: theme.colors.text,
    fontWeight: 700,
  },

  loading: {
    padding: "35px",
    textAlign: "center",
    color: theme.colors.textMuted,
    fontSize: "12px",
  },

  loadingPanel: {
    padding: "45px",
    textAlign: "center",
    color: theme.colors.textMuted,
    fontSize: "12px",
  },

  emptyData: {
    padding: "30px 14px",
    color: theme.colors.textFaint,
    textAlign: "center",
    fontSize: "10px",
  },

  errorBox: {
    padding: "11px 14px",
    marginBottom: "15px",
    borderRadius: "7px",
    backgroundColor: theme.colors.redMuted,
    color: theme.colors.red,
    fontSize: "11px",
  },
};

export default MarketIntelligence;
