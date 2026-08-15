import { useState, useEffect } from "react";
import { API_BASE_URL } from "../api";

function PersonalPerformance({ user, onBack, onGoToCommunity }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);


  const fetchData = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/intelligence/personal-performance?account_id=${user.account_id}`);
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

  if (loading) return <div style={styles.centered}>Loading performance data...</div>;
  if (!data || data.total_trades === 0) {
    return (
      <div style={styles.page}>
        <button style={styles.backBtn} onClick={onBack}>← Back to Dashboard</button>
        <h1 style={styles.title}>Personal Performance</h1>
        <p style={styles.emptyText}>No closed trades yet. Log and close some trades in the Journal first.</p>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <button style={styles.backBtn} onClick={onBack}>← Back to Dashboard</button>
        <button style={styles.backBtn} onClick={onGoToCommunity}>View Community Performance →</button>
      </div>
      <h1 style={styles.title}>Personal Performance</h1>

      <div style={styles.grid}>
        <Card title="Total Trades" value={data.total_trades} color="#fbbf24" />
        <Card title="Win Rate" value={`${data.win_rate}%`} color="#4f7fff" />
        <Card title="Average RR" value={data.average_rr} color="#4f7fff" />
      </div>

      <h2 style={styles.sectionTitle}>Best & Worst</h2>
      <div style={styles.grid}>
        <Card title="Best Asset" value={data.best_asset ? `${data.best_asset.asset} ($${data.best_asset.pl})` : "—"} color="#4ade80" />
        <Card title="Worst Asset" value={data.worst_asset ? `${data.worst_asset.asset} ($${data.worst_asset.pl})` : "—"} color="#f87171" />
        <Card title="Best Strategy" value={data.best_strategy ? `${data.best_strategy.strategy} ($${data.best_strategy.pl})` : "—"} color="#4ade80" />
        <Card title="Best Setup" value={data.best_setup ? `${data.best_setup.setup} ($${data.best_setup.pl})` : "—"} color="#4ade80" />
      </div>

      <h2 style={styles.sectionTitle}>Buy vs Sell</h2>
      <div style={styles.grid}>
        <Card
          title="Buy Trades"
          value={data.buy_vs_sell.buy ? `${data.buy_vs_sell.buy.count} trades, ${data.buy_vs_sell.buy.win_rate}% WR, $${data.buy_vs_sell.buy.total_pl}` : "No buy trades"}
          color="#4f7fff"
        />
        <Card
          title="Sell Trades"
          value={data.buy_vs_sell.sell ? `${data.buy_vs_sell.sell.count} trades, ${data.buy_vs_sell.sell.win_rate}% WR, $${data.buy_vs_sell.sell.total_pl}` : "No sell trades"}
          color="#f87171"
        />
      </div>

      {data.emotion_breakdown.length > 0 && (
        <>
          <h2 style={styles.sectionTitle}>Emotion Analysis</h2>
          <div style={styles.grid}>
            {data.emotion_breakdown.map((e) => (
              <Card
                key={e.emotion}
                title={e.emotion}
                value={`${e.count} trades, ${e.win_rate}% WR, $${e.total_pl}`}
                color={e.total_pl >= 0 ? "#4ade80" : "#f87171"}
              />
            ))}
          </div>
        </>
      )}

      {data.top_mistakes.length > 0 && (
        <>
          <h2 style={styles.sectionTitle}>Top Mistakes</h2>
          <div style={styles.grid}>
            {data.top_mistakes.map((m) => (
              <Card key={m.mistake} title={m.mistake} value={`${m.count}x`} color="#f87171" />
            ))}
          </div>
        </>
      )}

      {data.monthly_performance.length > 0 && (
        <>
          <h2 style={styles.sectionTitle}>Monthly Performance</h2>
          <div style={styles.grid}>
            {data.monthly_performance.map((m) => (
              <Card key={m.month} title={m.month} value={`$${m.pl}`} color={m.pl >= 0 ? "#4ade80" : "#f87171"} />
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

export default PersonalPerformance;
