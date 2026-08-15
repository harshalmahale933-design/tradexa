import { useState } from "react";
import { API_BASE_URL } from "../api";
import Sidebar from "../components/Sidebar";
import { theme } from "../theme";

function Coach({ user, onLogout, onNavigate }) {
  const [form, setForm] = useState({ asset: "", setup: "", strategy: "", emotion: "" });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);


  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch(`${API_BASE_URL}/coach/score-trade`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ account_id: user.account_id, ...form }),
      });
      if (!res.ok) throw new Error("Failed to score trade");
      setResult(await res.json());
    } catch (err) {
      alert("Error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const recColor = (rec) => {
    if (rec === "Highly Recommended") return theme.colors.green;
    if (rec === "Recommended") return theme.colors.primary;
    if (rec === "Proceed with Caution") return theme.colors.amber;
    return theme.colors.red;
  };

  return (
    <div style={styles.layout}>
      <Sidebar activePage="coach" onNavigate={onNavigate} user={user} onLogout={onLogout} />

      <div style={styles.main}>
        <div style={styles.header}>
          <h1 style={styles.pageTitle}>Tradexa Coach</h1>
          <p style={styles.pageSubtitle}>Score a trade before you take it, based on your history</p>
        </div>

        <form onSubmit={handleSubmit} style={styles.formCard}>
          <div style={styles.formGrid}>
            <Field label="Asset">
              <input type="text" name="asset" placeholder="e.g. Gold" value={form.asset} onChange={handleChange} style={styles.input} required />
            </Field>
            <Field label="Setup">
              <input type="text" name="setup" placeholder="e.g. Order Block" value={form.setup} onChange={handleChange} style={styles.input} required />
            </Field>
            <Field label="Strategy">
              <input type="text" name="strategy" placeholder="e.g. Liquidity Sweep" value={form.strategy} onChange={handleChange} style={styles.input} required />
            </Field>
            <Field label="Current Emotion">
              <input type="text" name="emotion" placeholder="e.g. Confident" value={form.emotion} onChange={handleChange} style={styles.input} required />
            </Field>
          </div>
          <button type="submit" style={styles.primaryBtn} disabled={loading}>
            {loading ? "Scoring..." : "Score This Trade"}
          </button>
        </form>

        {result && (
          <div style={styles.resultCard}>
            <div style={styles.resultHeader}>
              <div>
                <p style={styles.resultAsset}>{result.asset}</p>
                <p style={{ ...styles.resultRec, color: recColor(result.recommendation) }}>
                  {result.recommendation}
                </p>
                {result.live_market_decision && (
                  <span style={{
                    ...styles.liveDecisionBadge,
                    color: result.live_market_decision === "BUY" ? theme.colors.green : result.live_market_decision === "SELL" ? theme.colors.red : theme.colors.amber,
                    backgroundColor: result.live_market_decision === "BUY" ? theme.colors.greenMuted : result.live_market_decision === "SELL" ? theme.colors.redMuted : theme.colors.amberMuted,
                  }}>
                    Live Market: {result.live_market_decision}
                  </span>
                )}
              </div>
              <div style={styles.scoreCircle}>
                <span style={styles.scoreNumber}>{result.total_score}</span>
                <span style={styles.scoreMax}>/{result.max_score}</span>
              </div>
            </div>

            {!result.market_intelligence_available && result.market_note && (
              <p style={styles.marketNote}>⚠ {result.market_note}</p>
            )}

            <div style={styles.riskRow}>
              <span style={styles.riskLabel}>Risk Level</span>
              <span style={{
                ...styles.riskBadge,
                color: result.risk === "Low" ? theme.colors.green : result.risk === "Medium" ? theme.colors.amber : theme.colors.red,
                backgroundColor: result.risk === "Low" ? theme.colors.greenMuted : result.risk === "Medium" ? theme.colors.amberMuted : theme.colors.redMuted,
              }}>
                {result.risk}
              </span>
            </div>

            <div style={styles.winRateRow}>
              <div style={styles.winRateBox}>
                <p style={styles.winRateLabel}>Your Win Rate ({result.asset})</p>
                <p style={styles.winRateValue}>{result.your_win_rate != null ? `${result.your_win_rate}%` : "No history yet"}</p>
              </div>
              <div style={styles.winRateBox}>
                <p style={styles.winRateLabel}>Community Win Rate (this setup)</p>
                <p style={styles.winRateValue}>{result.community_win_rate != null ? `${result.community_win_rate}%` : "No data yet"}</p>
              </div>
            </div>

            <h3 style={styles.breakdownTitle}>Score Breakdown</h3>
            <div style={styles.breakdownGrid}>
              {Object.entries(result.breakdown).map(([key, val]) => (
                <div key={key} style={styles.breakdownItem}>
                  <p style={styles.breakdownLabel}>{key.replace(/_/g, " ")}</p>
                  <p style={styles.breakdownScore}>{val.score} / {val.max}</p>
                  {val.note && <p style={styles.breakdownNote}>{val.note}</p>}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <label style={styles.fieldLabel}>{label}</label>
      {children}
    </div>
  );
}

const styles = {
  layout: { display: "flex", backgroundColor: theme.colors.bg, minHeight: "100vh" },
  main: { flex: 1, padding: "32px 40px", maxWidth: "1000px" },
  header: { marginBottom: "24px" },
  pageTitle: { color: theme.colors.text, fontSize: "22px", fontWeight: 700, letterSpacing: "-0.02em" },
  pageSubtitle: { color: theme.colors.textMuted, fontSize: "13.5px", marginTop: "4px" },
  formCard: {
    backgroundColor: theme.colors.bgCard,
    border: `1px solid ${theme.colors.border}`,
    borderRadius: theme.radius.md,
    padding: "24px",
    marginBottom: "20px",
  },
  formGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: "14px",
    marginBottom: "18px",
  },
  fieldLabel: {
    display: "block",
    color: theme.colors.textMuted,
    fontSize: "11.5px",
    fontWeight: 500,
    marginBottom: "6px",
  },
  input: {
    width: "100%",
    padding: "10px 12px",
    borderRadius: theme.radius.sm,
    border: `1px solid ${theme.colors.borderLight}`,
    backgroundColor: theme.colors.bg,
    color: theme.colors.text,
    fontSize: "13.5px",
    boxSizing: "border-box",
  },
  primaryBtn: {
    padding: "10px 22px",
    borderRadius: theme.radius.sm,
    border: "none",
    backgroundColor: theme.colors.primary,
    color: "#fff",
    fontWeight: 700,
    fontSize: "13px",
    cursor: "pointer",
  },
  resultCard: {
    backgroundColor: theme.colors.bgCard,
    border: `1px solid ${theme.colors.border}`,
    borderRadius: theme.radius.md,
    padding: "26px",
  },
  resultHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "20px",
  },
  resultAsset: { color: theme.colors.text, fontSize: "18px", fontWeight: 700 },
 resultRec: { fontSize: "13.5px", fontWeight: 600, marginTop: "4px" },
  liveDecisionBadge: {
    display: "inline-block",
    marginTop: "8px",
    padding: "4px 10px",
    borderRadius: "6px",
    fontSize: "11px",
    fontWeight: 700,
  },
  marketNote: {
    color: theme.colors.amber,
    fontSize: "12px",
    marginBottom: "16px",
  },
  scoreCircle: {
    width: "76px",
    height: "76px",
    borderRadius: "50%",
    border: `3px solid ${theme.colors.primary}`,
    display: "flex",
    alignItems: "baseline",
    justifyContent: "center",
    gap: "1px",
  },
  scoreNumber: { color: theme.colors.text, fontSize: "22px", fontWeight: 800 },
  scoreMax: { color: theme.colors.textFaint, fontSize: "12px", fontWeight: 600 },
  riskRow: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    marginBottom: "18px",
    paddingBottom: "18px",
    borderBottom: `1px solid ${theme.colors.border}`,
  },
  riskLabel: { color: theme.colors.textMuted, fontSize: "13px" },
  riskBadge: {
    padding: "4px 12px",
    borderRadius: "6px",
    fontSize: "12px",
    fontWeight: 700,
  },
  winRateRow: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "14px",
    marginBottom: "22px",
  },
  winRateBox: {
    backgroundColor: theme.colors.bg,
    borderRadius: theme.radius.sm,
    padding: "14px 16px",
  },
  winRateLabel: { color: theme.colors.textMuted, fontSize: "11.5px", marginBottom: "6px" },
  winRateValue: { color: theme.colors.text, fontSize: "17px", fontWeight: 700 },
  breakdownTitle: { color: theme.colors.text, fontSize: "14px", fontWeight: 700, marginBottom: "12px" },
  breakdownGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
    gap: "10px",
  },
  breakdownItem: {
    backgroundColor: theme.colors.bg,
    borderRadius: theme.radius.sm,
    padding: "12px 14px",
  },
  breakdownLabel: {
    color: theme.colors.textMuted,
    fontSize: "11px",
    textTransform: "capitalize",
    marginBottom: "6px",
  },
  breakdownScore: { color: theme.colors.text, fontSize: "15px", fontWeight: 700 },
  breakdownNote: { color: theme.colors.textFaint, fontSize: "10.5px", marginTop: "4px", fontStyle: "italic" },
};

export default Coach;
