import { useState, useEffect } from "react";
import { API_BASE_URL } from "../api";

function CommunityPerformance({ onBack }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
 

  const fetchData = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/intelligence/community-performance`);
      const result = await res.json();
      setData(result);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) return <div style={styles.centered}>Loading community data...</div>;
  if (!data || data.total_trades === 0) {
    return (
      <div style={styles.page}>
        <button style={styles.backBtn} onClick={onBack}>← Back to Dashboard</button>
        <h1 style={styles.title}>Community Performance</h1>
        <p style={styles.emptyText}>No community trade data yet.</p>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <button style={styles.backBtn} onClick={onBack}>← Back to Dashboard</button>
      <h1 style={styles.title}>Community Performance</h1>
      <p style={styles.subtitle}>Anonymous data aggregated across all Tradexa users</p>

      <div style={styles.grid}>
        <Card title="Total Community Trades" value={data.total_trades} color="#fbbf24" />
        <Card title="Community Win Rate" value={`${data.community_win_rate}%`} color="#4f7fff" />
        <Card title="Community Avg RR" value={data.community_avg_rr} color="#4f7fff" />
      </div>

      <h2 style={styles.sectionTitle}>Top Performers</h2>
      <div style={styles.grid}>
        <Card
          title="Most Profitable Asset"
          value={data.most_profitable_asset ? `${data.most_profitable_asset.asset} ($${data.most_profitable_asset.pl})` : "—"}
          color="#4ade80"
        />
        <Card
          title="Best Strategy"
          value={data.best_strategy ? `${data.best_strategy.strategy} ($${data.best_strategy.pl})` : "—"}
          color="#4ade80"
        />
        <Card
          title="Best Setup"
          value={data.best_setup ? `${data.best_setup.setup} ($${data.best_setup.pl})` : "—"}
          color="#4ade80"
        />
      </div>

      <h2 style={styles.sectionTitle}>Buy vs Sell (Community)</h2>
      <div style={styles.grid}>
        <Card
          title="Buy Trades"
          value={data.buy_vs_sell.buy ? `${data.buy_vs_sell.buy.count} trades, ${data.buy_vs_sell.buy.win_rate}% WR` : "No data"}
          color="#4f7fff"
        />
        <Card
          title="Sell Trades"
          value={data.buy_vs_sell.sell ? `${data.buy_vs_sell.sell.count} trades, ${data.buy_vs_sell.sell.win_rate}% WR` : "No data"}
          color="#f87171"
        />
      </div>

      {data.emotion_stats.length > 0 && (
        <>
          <h2 style={styles.sectionTitle}>Emotion Statistics</h2>
          <div style={styles.grid}>
            {data.emotion_stats.map((e) => (
              <Card key={e.emotion} title={e.emotion} value={`${e.count} trades, ${e.win_rate}% WR`} color="#4f7fff" />
            ))}
          </div>
        </>
      )}

      {data.common_mistakes.length > 0 && (
        <>
          <h2 style={styles.sectionTitle}>Common Mistakes</h2>
          <div style={styles.grid}>
            {data.common_mistakes.map((m) => (
              <Card key={m.mistake} title={m.mistake} value={`${m.count}x reported`} color="#f87171" />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function Card({ title, value, color }) {
  return (
    <div style={styles.card}>
      <p style={styles.cardTitle}>{title}</p>
      <p style={{ ...styles.cardValue, color }}>{value}</p>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    backgroundColor: "#0f1115",
    padding: "24px 40px",
  },
  centered: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    height: "100vh",
    color: "#fff",
    backgroundColor: "#0f1115",
  },
  backBtn: {
    background: "none",
    border: "none",
    color: "#9aa0aa",
    cursor: "pointer",
    fontSize: "13px",
    padding: 0,
    marginBottom: "8px",
  },
  title: {
    color: "#fff",
    fontSize: "24px",
    marginBottom: "4px",
  },
  subtitle: {
    color: "#9aa0aa",
    fontSize: "13px",
    marginBottom: "24px",
  },
  sectionTitle: {
    color: "#fff",
    fontSize: "16px",
    margin: "28px 0 12px 0",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: "16px",
  },
  card: {
    backgroundColor: "#1a1d24",
    padding: "18px",
    borderRadius: "12px",
    border: "1px solid #262a33",
  },
  cardTitle: {
    color: "#9aa0aa",
    fontSize: "12px",
    marginBottom: "8px",
    textTransform: "capitalize",
  },
  cardValue: {
    fontSize: "16px",
    fontWeight: "700",
    margin: 0,
  },
  emptyText: {
    color: "#9aa0aa",
  },
};

export default CommunityPerformance;
