import { useEffect, useMemo, useState } from "react";
import { API_BASE_URL } from "../api";
import Sidebar from "../components/Sidebar";
import ConstellationBackground from "../components/ConstellationBackground";
import ScoreGauge from "../components/ScoreGauge";
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
  // LOAD INTELLIGENCE DATA FOR TOP SCORER CARDS
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
  // FILTER
  // =========================================================

  const filteredScores = useMemo(() => {
    return topScores.filter((asset) => {
      const matchesSearch =
        !search ||
        asset.asset?.toLowerCase().includes(search.toLowerCase()) ||
        asset.symbol?.toLowerCase().includes(search.toLowerCase());

      const matchesBias = biasFilter === "All" || getBias(asset) === biasFilter;

      return matchesSearch && matchesBias;
    });
  }, [topScores, search, biasFilter]);

  const selectedTopRow = topScores.find((a) => a.asset === selectedAsset);

  return (
    <div style={styles.layout}>
      <Sidebar activePage="market" onNavigate={onNavigate} user={user} onLogout={onLogout} />

      <div style={styles.main}>
        {/* AMBIENT CONSTELLATION BACKGROUND — page-wide, viewport anchored */}
        <div style={styles.bgLayer}>
          <ConstellationBackground density="light" />
        </div>
        <div className="glow-blob" style={styles.pageGlowMint} />
        <div className="glow-blob" style={{ ...styles.pageGlowRed, animationDelay: "-6s" }} />

        <div style={styles.content}>
          {/* ===================================================
              HEADER
          =================================================== */}

          <div style={styles.breadcrumb}>
            <strong>Tradexa</strong>
            <span>/</span>
            <span>Market Intelligence</span>
          </div>

          <div style={styles.header}>
            <div>
              <h1 style={styles.pageTitle}>Market Intelligence</h1>
              <p style={styles.pageSubtitle}>
                Multi-factor market scoring across technical, fundamental, sentiment and
                multi-timeframe data.
              </p>
            </div>

            <div style={styles.liveBadge}>
              <span className="live-dot" style={styles.liveDot} />
              LIVE MARKET DATA
            </div>
          </div>

          {error && <div style={styles.errorBox}>{error}</div>}

          {/* ===================================================
              FILTERS
          =================================================== */}

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

            <div style={styles.pillRow}>
              {["All", "Bullish", "Neutral", "Bearish"].map((b) => (
                <button
                  key={b}
                  onClick={() => setBiasFilter(b)}
                  style={{
                    ...styles.pillButton,
                    ...(biasFilter === b ? styles.pillButtonActive(b) : {}),
                  }}
                >
                  {b}
                </button>
              ))}
            </div>
          </div>

          {/* ===================================================
              FEATURED ASSET — hero gauge panel
          =================================================== */}

          <section className="glass-hover" style={styles.heroPanel}>
            <div style={styles.heroLeft}>
              <ScoreGauge
                score={intelligence?.overall_score ?? 0}
                max={intelligence?.overall_max ?? 15}
                size={230}
              />
            </div>

            <div style={styles.heroRight}>
              <div style={styles.heroTopRow}>
                <div>
                  <div style={styles.heroAssetName}>{selectedAsset}</div>
                  <div style={styles.heroPrice}>
                    {selectedTopRow?.current_price ?? intelligence?.daily_analysis?.current_price ?? "—"}
                  </div>
                </div>

                <div style={styles.analyzeRow}>
                  <select
                    value={selectedAsset}
                    onChange={(e) => loadIntelligence(e.target.value)}
                    style={styles.assetSelect}
                  >
                    {topScores.length > 0 ? (
                      topScores.map((asset) => (
                        <option key={asset.asset} value={asset.asset}>
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
                <div style={styles.heroLoading}>
                  Fetching live intelligence for <strong>{selectedAsset}</strong>...
                </div>
              ) : intelligence ? (
                <>
                  {(() => {
                    const heroBias = getBiasFromScore(
                      intelligence.overall_score,
                      intelligence.technical?.trend
                    );
                    return (
                      <span
                        style={{
                          ...styles.biasBadgeLg,
                          color: getBiasColor(heroBias),
                          backgroundColor: getBiasBackground(heroBias),
                        }}
                      >
                        ● {heroBias} ({formatSignedScore(intelligence.overall_score)}) Bias
                      </span>
                    );
                  })()}

                  <div style={styles.subRingRow}>
                    <RingMeter
                      value={intelligence.technical?.score}
                      max={intelligence.technical?.max ?? 5}
                      color={theme.colors.mint}
                      label="Technical"
                    />
                    <RingMeter
                      value={intelligence.fundamental?.score}
                      max={intelligence.fundamental?.max ?? 5}
                      color={theme.colors.amber}
                      label="Fundamental"
                    />
                    <RingMeter
                      value={intelligence.sentiment?.score}
                      max={intelligence.sentiment?.max ?? 5}
                      color={theme.colors.mint}
                      label="Sentiment"
                    />
                  </div>
                </>
              ) : (
                <div style={styles.heroLoading}>Select an asset to view intelligence.</div>
              )}
            </div>
          </section>

          {/* ===================================================
              TOP SCORER — card grid
          =================================================== */}

          <div style={styles.sectionHeaderRow}>
            <div>
              <h2 style={styles.sectionTitle}>Top Scorer</h2>
              <p style={styles.sectionSubtitle}>
                Ranked market opportunities based on Tradexa Intelligence scoring.
              </p>
            </div>
            <div style={styles.engineStatus}>
              <span style={styles.statusDot} />
              Market engine online
            </div>
          </div>

          {loadingTop ? (
            <div style={styles.loading}>Loading market data...</div>
          ) : filteredScores.length === 0 ? (
            <div style={styles.loading}>No market data available.</div>
          ) : (
            <div style={styles.cardGrid}>
              {filteredScores.map((asset, index) => (
                <AssetCard
                  key={`${asset.asset}-${index}`}
                  asset={asset}
                  data={assetData[asset.asset]}
                  selected={selectedAsset === asset.asset}
                  onClick={() => loadIntelligence(asset.asset)}
                />
              ))}
            </div>
          )}

          {/* ===================================================
              ASSET INTELLIGENCE BREAKDOWN
          =================================================== */}

          <div style={styles.sectionHeaderRow}>
            <div>
              <h2 style={styles.sectionTitle}>Asset Intelligence</h2>
              <p style={styles.sectionSubtitle}>Detailed breakdown for {selectedAsset}.</p>
            </div>
          </div>

          {intelligence && !loadingIntel && (
            <div style={styles.intelligenceGrid}>
              <TechnicalCard technical={intelligence.technical} />
              <FundamentalCard fundamental={intelligence.fundamental} />
              <SentimentCard sentiment={intelligence.sentiment} />
              <MultiTimeframeCard technical={intelligence.technical} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// RING METER (small circular sub-score)
// ============================================================

function RingMeter({ value, max = 5, color, label }) {
  const v = Number(value ?? 0);
  const pct = max > 0 ? Math.max(0, Math.min(1, v / max)) : 0;
  const circumference = 2 * Math.PI * 26;
  const offset = circumference * (1 - pct);

  return (
    <div style={styles.ringWrap}>
      <div style={{ position: "relative", width: 64, height: 64 }}>
        <svg viewBox="0 0 64 64" style={{ transform: "rotate(-90deg)" }}>
          <circle cx="32" cy="32" r="26" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="6" />
          <circle
            cx="32"
            cy="32"
            r="26"
            fill="none"
            stroke={color}
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            style={{ filter: `drop-shadow(0 0 4px ${color}88)`, transition: "stroke-dashoffset 1s ease" }}
          />
        </svg>
        <div style={styles.ringLabel}>{formatSignedScore(value)}</div>
      </div>
      <div style={styles.ringCaption}>{label}</div>
    </div>
  );
}

// ============================================================
// ASSET CARD (Top Scorer grid item)
// ============================================================

function AssetCard({ asset, data, selected, onClick }) {
  const bias = getBias(asset);
  const biasColor = getBiasColor(bias);

  return (
    <div
      className="stagger-in glass-hover tilt-card"
      onClick={onClick}
      style={{
        ...styles.assetCard,
        ...(selected ? styles.assetCardSelected : {}),
      }}
    >
      <div style={styles.assetCardTop}>
        <div>
          <div style={styles.assetCardSymbol}>{asset.symbol || getSymbol(asset.asset)}</div>
          <div style={styles.assetCardCategory}>{getCategory(asset.asset)}</div>
        </div>
        <span
          style={{
            ...styles.biasBadge,
            color: biasColor,
            backgroundColor: getBiasBackground(bias),
          }}
        >
          {bias}
        </span>
      </div>

      <div style={styles.assetCardBody}>
        <ScoreGauge score={asset.score ?? 0} max={asset.max_score ?? 15} size={92} compact />

        <div style={styles.assetCardStats}>
          <div style={styles.assetCardName}>{asset.asset}</div>
          <div style={styles.assetCardPrice}>{asset.current_price ?? "—"}</div>

          <MiniTrendLine label="1D" value={data?.technical?.daily} />
          <MiniTrendLine label="4H" value={data?.technical?.h4} />
        </div>
      </div>
    </div>
  );
}

function MiniTrendLine({ label, value }) {
  if (!value) {
    return (
      <div style={styles.miniTrendRow}>
        <span style={styles.miniTrendLabel}>{label}</span>
        <span style={styles.mutedDash}>—</span>
      </div>
    );
  }

  const bias = getBiasFromScore(value.score, value.trend || value.bias);
  const color = getBiasColor(bias);

  return (
    <div style={styles.miniTrendRow}>
      <span style={styles.miniTrendLabel}>{label}</span>
      <span style={{ ...styles.miniTrendValue, color }}>
        {bias} {value.score != null ? `(${formatSignedScore(value.score)})` : ""}
      </span>
    </div>
  );
}

// ============================================================
// TECHNICAL CARD
// ============================================================

function TechnicalCard({ technical }) {
  if (!technical) {
    return (
      <IntelligenceCard title="Technical Analysis" icon="⌁">
        <EmptyData />
      </IntelligenceCard>
    );
  }

  const daily = technical.daily;
  const h4 = technical.h4;
  const overallBias = getBiasFromScore(technical.score, technical.trend);
  const dailyBias = getBiasFromScore(daily?.score, daily?.trend);
  const h4Bias = getBiasFromScore(h4?.score, h4?.trend);

  return (
    <IntelligenceCard title="Technical Analysis" icon="⌁" accent={theme.colors.mint}>
      <div style={styles.cardTopValue}>
        <div>
          <span style={styles.smallLabel}>Overall Bias</span>
          <strong style={{ ...styles.bigValue, color: getBiasColor(overallBias) }}>
            {overallBias}
          </strong>
        </div>
        <div style={styles.cardScore}>
          {formatSignedScore(technical.score)}
          <span style={styles.cardScoreSpan}> / {technical.max ?? 10}</span>
        </div>
      </div>

      <div style={styles.indicatorList}>
        <IndicatorLine label="1 Day Trend" value={dailyBias} color={getBiasColor(dailyBias)} />
        <IndicatorLine
          label="1 Day Score"
          value={daily?.score != null ? `${formatSignedScore(daily.score)} / 5` : "—"}
        />
        <IndicatorLine label="4 Hour Trend" value={h4Bias} color={getBiasColor(h4Bias)} />
        <IndicatorLine
          label="4 Hour Score"
          value={h4?.score != null ? `${formatSignedScore(h4.score)} / 5` : "—"}
        />
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
      <IntelligenceCard title="Fundamental" icon="◆">
        <EmptyData />
      </IntelligenceCard>
    );
  }

  const bias = getBiasFromScore(fundamental.score, fundamental.bias);

  return (
    <IntelligenceCard title="Fundamental" icon="◆" accent={getBiasColor(bias)}>
      <div style={styles.cardTopValue}>
        <div>
          <span style={styles.smallLabel}>Bias</span>
          <strong style={{ ...styles.bigValue, color: getBiasColor(bias) }}>{bias}</strong>
        </div>
        <div style={styles.cardScore}>
          {formatSignedScore(fundamental.score)}
          <span style={styles.cardScoreSpan}> / {fundamental.max ?? 5}</span>
        </div>
      </div>

      <div style={styles.cardFooter}>
        <span style={styles.cardFooterSpan}>Note</span>
        <p style={styles.cardFooterP}>{fundamental.note || "No additional notes available."}</p>
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
      <IntelligenceCard title="News & Sentiment" icon="◉">
        <EmptyData />
      </IntelligenceCard>
    );
  }

  const score = Number(sentiment.score ?? 0);
  const max = Number(sentiment.max ?? 5);
  const percentage = Math.max(0, Math.min(100, (score / max) * 100));
  const label = score === 0 ? "Neutral" : score > 0 ? "Positive" : "Negative";

  return (
    <IntelligenceCard title="News & Sentiment" icon="◉" accent={getSentimentColor(score)}>
      <div style={styles.cardTopValue}>
        <div>
          <span style={styles.smallLabel}>Sentiment</span>
          <strong style={{ ...styles.bigValue, color: getSentimentColor(score) }}>{label}</strong>
        </div>
        <div style={styles.cardScore}>
          {formatSignedScore(score)}
          <span style={styles.cardScoreSpan}> / {max}</span>
        </div>
      </div>

      <div style={styles.sentimentVisual}>
        <div style={{ ...styles.sentimentCircle, borderColor: getSentimentColor(score) }}>
          <strong style={styles.sentimentCircleStrong}>{Math.round(percentage)}%</strong>
          <span style={styles.sentimentCircleSpan}>Positive</span>
        </div>

        <div style={styles.sentimentStats}>
          <div>
            <span style={{ ...styles.sentimentDot, backgroundColor: theme.colors.mint }} />
            Positive
          </div>
          <div>
            <span style={{ ...styles.sentimentDot, backgroundColor: theme.colors.amber }} />
            Neutral
          </div>
          <div>
            <span style={{ ...styles.sentimentDot, backgroundColor: theme.colors.red }} />
            Negative
          </div>
        </div>
      </div>

      <div style={styles.newsInfo}>
        <span>Articles Analyzed</span>
        <strong style={styles.newsInfoStrong}>{sentiment.articles ?? 0}</strong>
      </div>

      <div style={styles.cardFooter}>
        <span style={styles.cardFooterSpan}>News Sentiment</span>
        <p style={styles.cardFooterP}>{sentiment.note || "Latest available news and sentiment data."}</p>
      </div>
    </IntelligenceCard>
  );
}

// ============================================================
// MULTI TIMEFRAME CARD
// ============================================================

function MultiTimeframeCard({ technical }) {
  const timeframes = [
    { name: "1 Day", data: technical?.daily },
    { name: "4 Hour", data: technical?.h4 },
    { name: "1 Hour", data: technical?.h1 },
    { name: "30 Min", data: technical?.m30 },
    { name: "15 Min", data: technical?.m15 },
  ];

  return (
    <IntelligenceCard title="Multi-Timeframe Analysis" icon="◫" accent={theme.colors.amber}>
      <div style={styles.timeframeHeader}>
        <span>TIMEFRAME</span>
        <span>TREND</span>
        <span>BIAS</span>
        <span>SCORE</span>
      </div>

      <div>
        {timeframes.map((item) => {
          const score = item.data?.score;
          const hasData = item.data != null;
          const bias = hasData
            ? getBiasFromScore(score, item.data?.trend || item.data?.bias)
            : "—";
          const color = hasData ? getBiasColor(bias) : theme.colors.textFaint;
          const arrow = !hasData ? "—" : bias === "Bullish" ? "↑" : bias === "Bearish" ? "↓" : "→";

          return (
            <div key={item.name} style={styles.timeframeRow}>
              <span style={styles.timeframeName}>{item.name}</span>
              <span style={{ color, fontWeight: 800 }}>{arrow}</span>
              <span style={{ color, fontWeight: 700, fontSize: "11px" }}>{bias}</span>
              <span style={styles.timeframeScore}>
                {score != null ? `${formatSignedScore(score)} / 5` : "—"}
              </span>
            </div>
          );
        })}
      </div>

      <div style={styles.cardFooter}>
        <span style={styles.cardFooterSpan}>Overall Summary</span>
        <p style={styles.cardFooterP}>
          Stronger alignment across higher timeframes receives greater weight in the market
          intelligence score.
        </p>
      </div>
    </IntelligenceCard>
  );
}

// ============================================================
// SHARED CARD SHELL
// ============================================================

function IntelligenceCard({ title, icon, accent, children }) {
  return (
    <div
      className="glass-hover"
      style={{
        ...styles.intelligenceCard,
        borderTop: `2px solid ${accent || theme.colors.border}`,
      }}
    >
      <div style={styles.intelligenceCardHeader}>
        <div style={styles.intelligenceTitle}>
          <span style={{ ...styles.cardIcon, color: accent || theme.colors.mint }}>{icon}</span>
          {title}
        </div>
      </div>
      {children}
    </div>
  );
}

function IndicatorLine({ label, value, color }) {
  return (
    <div style={styles.indicatorLine}>
      <span>{label}</span>
      <strong style={{ color: color || theme.colors.text }}>{value || "—"}</strong>
    </div>
  );
}

function EmptyData() {
  return <div style={styles.emptyData}>No data available.</div>;
}

// ============================================================
// HELPERS
// ============================================================

function getBias(asset) {
  if (!asset) return "Neutral";
  if (asset.score !== undefined && asset.score !== null && asset.score !== "") {
    return getBiasFromScore(asset.score);
  }
  if (asset.trend) return normalizeBias(asset.trend);
  if (asset.bias) return normalizeBias(asset.bias);
  return "Neutral";
}

function normalizeBias(value) {
  if (!value) return "Neutral";
  const text = String(value).toLowerCase();
  if (text.includes("bullish")) return "Bullish";
  if (text.includes("bearish")) return "Bearish";
  return "Neutral";
}

// Score-based bias: 0 is always Neutral, positive is Bullish, negative is
// Bearish. Falls back to a text trend/bias field only when no numeric score
// is available at all.
function getBiasFromScore(score, fallbackText) {
  const num = Number(score);
  if (score !== undefined && score !== null && score !== "" && Number.isFinite(num)) {
    if (num === 0) return "Neutral";
    return num > 0 ? "Bullish" : "Bearish";
  }
  return normalizeBias(fallbackText);
}

// Signed score display: 0 -> "0", positive -> "+N", negative -> "-N".
function formatSignedScore(score) {
  const num = Number(score);
  if (score === undefined || score === null || score === "" || !Number.isFinite(num)) {
    return "—";
  }
  if (num > 0) return `+${num}`;
  return `${num}`;
}

function getBiasColor(bias) {
  if (bias === "Bullish") return theme.colors.mint;
  if (bias === "Bearish") return theme.colors.red;
  return theme.colors.amber;
}

function getBiasBackground(bias) {
  if (bias === "Bullish") return theme.colors.greenMuted;
  if (bias === "Bearish") return theme.colors.redMuted;
  return theme.colors.amberMuted;
}

function getBiasColorFromText(value) {
  if (!value) return theme.colors.textMuted;
  const text = String(value).toLowerCase();
  if (text.includes("bull")) return theme.colors.mint;
  if (text.includes("bear")) return theme.colors.red;
  return theme.colors.amber;
}

function getSentimentColor(score) {
  const num = Number(score);
  if (num === 0) return theme.colors.amber;
  return num > 0 ? theme.colors.mint : theme.colors.red;
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
  if (text.includes("gold") || text.includes("silver")) return "Metal";
  if (text.includes("bitcoin") || text.includes("ethereum") || text.includes("crypto")) return "Crypto";
  if (text.includes("pound") || text.includes("euro") || text.includes("yen") || text.includes("usd"))
    return "Forex";
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
    position: "relative",
    flex: 1,
    minWidth: 0,
    overflow: "hidden",
  },

  bgLayer: {
    position: "fixed",
    inset: 0,
    zIndex: 0,
    pointerEvents: "none",
  },

  pageGlowMint: {
    position: "fixed",
    top: "-10%",
    right: "10%",
    width: 420,
    height: 420,
    borderRadius: "50%",
    background: "radial-gradient(circle, rgba(0,229,160,0.10), transparent 70%)",
    zIndex: 0,
    pointerEvents: "none",
  },

  pageGlowRed: {
    position: "fixed",
    bottom: "5%",
    left: "5%",
    width: 380,
    height: 380,
    borderRadius: "50%",
    background: "radial-gradient(circle, rgba(255,77,106,0.08), transparent 70%)",
    zIndex: 0,
    pointerEvents: "none",
  },

  content: {
    position: "relative",
    zIndex: 1,
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
    flexWrap: "wrap",
    gap: "12px",
  },

  pageTitle: {
    fontFamily: theme.font.display,
    fontSize: "30px",
    fontWeight: 700,
    margin: 0,
    letterSpacing: "-0.03em",
    background: `linear-gradient(90deg, ${theme.colors.text}, ${theme.colors.mint})`,
    WebkitBackgroundClip: "text",
    backgroundClip: "text",
    WebkitTextFillColor: "transparent",
  },

  pageSubtitle: {
    color: theme.colors.textMuted,
    fontSize: "12.5px",
    marginTop: "6px",
    maxWidth: 520,
  },

  liveBadge: {
    display: "flex",
    alignItems: "center",
    gap: "7px",
    padding: "7px 12px",
    borderRadius: "7px",
    backgroundColor: theme.colors.greenMuted,
    color: theme.colors.mint,
    fontSize: "10px",
    fontWeight: 800,
    height: "fit-content",
  },

  liveDot: {
    width: "6px",
    height: "6px",
    borderRadius: "50%",
    backgroundColor: theme.colors.mint,
  },

  errorBox: {
    padding: "11px 14px",
    marginBottom: "15px",
    borderRadius: "7px",
    backgroundColor: theme.colors.redMuted,
    color: theme.colors.red,
    fontSize: "11px",
  },

  filterRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "12px",
    marginBottom: "22px",
    flexWrap: "wrap",
  },

  searchBox: {
    display: "flex",
    alignItems: "center",
    width: "250px",
    height: "38px",
    border: `1px solid ${theme.colors.border}`,
    borderRadius: "10px",
    backgroundColor: theme.colors.bgCard,
    backdropFilter: "blur(10px)",
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

  pillRow: {
    display: "flex",
    gap: "8px",
  },

  pillButton: {
    height: "38px",
    padding: "0 16px",
    borderRadius: "20px",
    border: `1px solid ${theme.colors.border}`,
    backgroundColor: theme.colors.bgCard,
    color: theme.colors.textMuted,
    fontSize: "11px",
    fontWeight: 700,
    cursor: "pointer",
    transition: "all 0.15s ease",
  },

  pillButtonActive: (b) => ({
    color:
      b === "Bullish" ? theme.colors.mint : b === "Bearish" ? theme.colors.red : b === "Neutral" ? theme.colors.amber : theme.colors.text,
    borderColor:
      b === "Bullish" ? theme.colors.mint : b === "Bearish" ? theme.colors.red : b === "Neutral" ? theme.colors.amber : theme.colors.borderLight,
    backgroundColor:
      b === "Bullish" ? theme.colors.greenMuted : b === "Bearish" ? theme.colors.redMuted : b === "Neutral" ? theme.colors.amberMuted : theme.colors.bgHover,
  }),

  heroPanel: {
    display: "flex",
    gap: "40px",
    alignItems: "center",
    flexWrap: "wrap",
    background: theme.glass.background,
    backdropFilter: theme.glass.backdropFilter,
    border: `1px solid ${theme.colors.border}`,
    borderRadius: theme.radius.lg,
    padding: "36px 40px",
    marginBottom: "34px",
    boxShadow: theme.shadow.elevated,
  },

  heroLeft: {
    flexShrink: 0,
  },

  heroRight: {
    flex: 1,
    minWidth: 260,
  },

  heroTopRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "16px",
    marginBottom: "14px",
    flexWrap: "wrap",
  },

  heroAssetName: {
    fontFamily: theme.font.display,
    fontSize: "24px",
    fontWeight: 700,
    color: theme.colors.text,
  },

  heroPrice: {
    fontFamily: theme.font.mono,
    fontSize: "14px",
    color: theme.colors.textMuted,
    marginTop: "4px",
  },

  heroLoading: {
    color: theme.colors.textMuted,
    fontSize: "12.5px",
    padding: "10px 0",
  },

  biasBadgeLg: {
    display: "inline-block",
    padding: "6px 14px",
    borderRadius: "20px",
    fontSize: "11px",
    fontWeight: 800,
    letterSpacing: "0.5px",
    marginBottom: "20px",
  },

  subRingRow: {
    display: "flex",
    gap: "22px",
    flexWrap: "wrap",
  },

  ringWrap: {
    textAlign: "center",
  },

  ringLabel: {
    position: "absolute",
    inset: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "13px",
    fontWeight: 700,
    color: theme.colors.text,
  },

  ringCaption: {
    marginTop: "6px",
    fontSize: "9px",
    color: theme.colors.textMuted,
    letterSpacing: "1px",
    textTransform: "uppercase",
  },

  analyzeRow: {
    display: "flex",
    gap: "9px",
  },

  assetSelect: {
    width: "180px",
    height: "37px",
    backgroundColor: theme.colors.bg,
    border: `1px solid ${theme.colors.border}`,
    borderRadius: "8px",
    color: theme.colors.text,
    padding: "0 11px",
    outline: "none",
    fontSize: "11px",
  },

  analyzeButton: {
    height: "37px",
    padding: "0 19px",
    border: "none",
    borderRadius: "8px",
    backgroundColor: theme.colors.mint,
    color: "#06070a",
    fontSize: "11px",
    fontWeight: 800,
    cursor: "pointer",
  },

  sectionHeaderRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "16px",
    flexWrap: "wrap",
    gap: "10px",
  },

  sectionTitle: {
    fontFamily: theme.font.display,
    color: theme.colors.text,
    fontSize: "18px",
    fontWeight: 700,
    margin: 0,
  },

  sectionSubtitle: {
    color: theme.colors.textMuted,
    fontSize: "11.5px",
    marginTop: "5px",
  },

  engineStatus: {
    display: "flex",
    alignItems: "center",
    gap: "7px",
    color: theme.colors.textMuted,
    fontSize: "10.5px",
  },

  statusDot: {
    width: "6px",
    height: "6px",
    borderRadius: "50%",
    backgroundColor: theme.colors.mint,
  },

  cardGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
    gap: "16px",
    marginBottom: "38px",
  },

  assetCard: {
    background: theme.glass.background,
    backdropFilter: theme.glass.backdropFilter,
    border: `1px solid ${theme.colors.border}`,
    borderRadius: theme.radius.md,
    padding: "18px",
    cursor: "pointer",
  },

  assetCardSelected: {
    borderColor: theme.colors.mint,
    boxShadow: theme.shadow.glowMint,
  },

  assetCardTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: "10px",
  },

  assetCardSymbol: {
    fontFamily: theme.font.mono,
    fontSize: "13px",
    fontWeight: 700,
    color: theme.colors.text,
  },

  assetCardCategory: {
    fontSize: "9.5px",
    color: theme.colors.textFaint,
    marginTop: "2px",
  },

  biasBadge: {
    display: "inline-block",
    padding: "4px 9px",
    borderRadius: "12px",
    fontSize: "9px",
    fontWeight: 800,
  },

  assetCardBody: {
    display: "flex",
    alignItems: "center",
    gap: "14px",
  },

  assetCardStats: {
    flex: 1,
    minWidth: 0,
  },

  assetCardName: {
    fontSize: "13px",
    fontWeight: 700,
    color: theme.colors.text,
    marginBottom: "2px",
  },

  assetCardPrice: {
    fontFamily: theme.font.mono,
    fontSize: "11px",
    color: theme.colors.textMuted,
    marginBottom: "8px",
  },

  miniTrendRow: {
    display: "flex",
    justifyContent: "space-between",
    fontSize: "9.5px",
    padding: "3px 0",
  },

  miniTrendLabel: {
    color: theme.colors.textFaint,
  },

  miniTrendValue: {
    fontWeight: 700,
  },

  mutedDash: {
    color: theme.colors.textFaint,
  },

  intelligenceGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
    gap: "16px",
  },

  intelligenceCard: {
    background: theme.glass.background,
    backdropFilter: theme.glass.backdropFilter,
    border: `1px solid ${theme.colors.border}`,
    borderRadius: theme.radius.md,
    overflow: "hidden",
  },

  intelligenceCardHeader: {
    padding: "14px 16px",
    borderBottom: `1px solid ${theme.colors.border}`,
    backgroundColor: theme.colors.bgHover,
  },

  intelligenceTitle: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    color: theme.colors.text,
    fontSize: "12.5px",
    fontWeight: 800,
  },

  cardIcon: {
    fontSize: "15px",
  },

  cardTopValue: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "16px",
  },

  smallLabel: {
    display: "block",
    color: theme.colors.textMuted,
    fontSize: "9.5px",
    marginBottom: "4px",
  },

  bigValue: {
    fontSize: "15px",
    fontWeight: 800,
  },

  cardScore: {
    color: theme.colors.text,
    fontSize: "20px",
    fontWeight: 900,
  },

  cardScoreSpan: {
    color: theme.colors.textFaint,
    fontSize: "10px",
    fontWeight: 500,
  },

  indicatorList: {
    padding: "0 16px 12px",
  },

  indicatorLine: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "8px",
    padding: "8px 0",
    borderBottom: `1px solid ${theme.colors.border}`,
    fontSize: "10.5px",
    color: theme.colors.textMuted,
  },

  cardFooter: {
    padding: "13px 16px",
    backgroundColor: theme.colors.bgHover,
    borderTop: `1px solid ${theme.colors.border}`,
  },

  cardFooterSpan: {
    color: theme.colors.textMuted,
    fontSize: "9.5px",
  },

  cardFooterP: {
    color: theme.colors.textMuted,
    fontSize: "9.5px",
    lineHeight: 1.6,
    margin: "6px 0 0",
  },

  sentimentVisual: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "18px",
    padding: "10px 16px 16px",
  },

  sentimentCircle: {
    width: "76px",
    height: "76px",
    borderRadius: "50%",
    border: "8px solid",
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
    gap: "8px",
    color: theme.colors.textMuted,
    fontSize: "9.5px",
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
    margin: "0 16px 10px",
    padding: "8px 0",
    borderTop: `1px solid ${theme.colors.border}`,
    color: theme.colors.textMuted,
    fontSize: "9.5px",
  },

  newsInfoStrong: {
    color: theme.colors.text,
  },

  timeframeHeader: {
    display: "grid",
    gridTemplateColumns: "1.2fr .7fr 1fr .9fr",
    gap: "5px",
    padding: "12px 16px 8px",
    color: theme.colors.textFaint,
    fontSize: "8.5px",
    fontWeight: 800,
    letterSpacing: "0.5px",
  },

  timeframeRow: {
    display: "grid",
    gridTemplateColumns: "1.2fr .7fr 1fr .9fr",
    gap: "5px",
    alignItems: "center",
    padding: "9px 16px",
    borderTop: `1px solid ${theme.colors.border}`,
    fontSize: "9.5px",
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
    background: theme.glass.background,
    borderRadius: theme.radius.md,
    border: `1px solid ${theme.colors.border}`,
    marginBottom: "38px",
  },

  emptyData: {
    padding: "30px 16px",
    color: theme.colors.textFaint,
    textAlign: "center",
    fontSize: "10px",
  },
};

export default MarketIntelligence;
