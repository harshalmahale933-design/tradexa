import { useState, useEffect } from "react";
import { API_BASE_URL } from "../api";
import Sidebar from "../components/Sidebar";
import { theme } from "../theme";

function Dashboard({ user, onLogout, onNavigate }) {
  const [summary, setSummary] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Safely get user information
  const userName = user?.name || "Trader";
  const firstName = userName.split(" ")[0];
  const accountId = user?.account_id;

  const fetchDashboardData = async () => {
    if (!accountId) {
      console.error("DASHBOARD: Account ID is missing");
      setError("Account information is missing. Please log in again.");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError("");

      console.log("DASHBOARD: Fetching data...");
      console.log("DASHBOARD: Account ID:", accountId);

      const [summaryRes, statsRes] = await Promise.all([
        fetch(
          `${API_BASE_URL}/dashboard/summary?account_id=${accountId}`
        ),
        fetch(
          `${API_BASE_URL}/dashboard/statistics?account_id=${accountId}`
        ),
      ]);

      console.log("DASHBOARD: Summary status:", summaryRes.status);
      console.log("DASHBOARD: Statistics status:", statsRes.status);

      if (!summaryRes.ok) {
        throw new Error(
          `Dashboard summary request failed: ${summaryRes.status}`
        );
      }

      if (!statsRes.ok) {
        throw new Error(
          `Dashboard statistics request failed: ${statsRes.status}`
        );
      }

      const summaryData = await summaryRes.json();
      const statsData = await statsRes.json();

      console.log("DASHBOARD: Summary:", summaryData);
      console.log("DASHBOARD: Stats:", statsData);

      setSummary(summaryData);
      setStats(statsData);
    } catch (err) {
      console.error("DASHBOARD ERROR:", err);
      setError(err.message || "Failed to load dashboard data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [accountId]);

  return (
    <div style={styles.layout}>
      <Sidebar
        activePage="dashboard"
        onNavigate={onNavigate}
        user={user}
        onLogout={onLogout}
      />

      <div style={styles.main}>
        {/* HEADER */}
        <div style={styles.header}>
          <div>
            <h1 style={styles.pageTitle}>Dashboard</h1>

            <p style={styles.pageSubtitle}>
              Welcome back, {firstName}
            </p>
          </div>
        </div>

        {/* ERROR */}
        {error && (
          <div style={styles.errorBox}>
            <strong>Unable to load dashboard</strong>
            <p>{error}</p>

            <button
              style={styles.retryButton}
              onClick={fetchDashboardData}
            >
              Retry
            </button>
          </div>
        )}

        {/* LOADING */}
        {loading ? (
          <div style={styles.skeletonRow}>
            {[1, 2, 3, 4].map((i) => (
              <div key={i} style={styles.skeleton} />
            ))}
          </div>
        ) : (
          <>
            {/* MAIN STATISTICS */}
            <div style={styles.statRow}>
              <StatCard
                label="Total Profit"
                value={`$${summary?.total_profit ?? 0}`}
                trend="up"
                accent={theme.colors.green}
              />

              <StatCard
                label="Total Loss"
                value={`$${summary?.total_loss ?? 0}`}
                trend="down"
                accent={theme.colors.red}
              />

              <StatCard
                label="Win Rate"
                value={`${summary?.win_rate ?? 0}%`}
                accent={theme.colors.primary}
              />

              <StatCard
                label="Total Trades"
                value={summary?.total_trades ?? 0}
                accent={theme.colors.amber}
              />
            </div>

            {/* PERFORMANCE */}
            <SectionLabel text="Performance Statistics" />

            <div style={styles.statRow}>
              <StatCard
                label="Average RR"
                value={stats?.average_rr ?? 0}
                accent={theme.colors.primary}
              />

              <StatCard
                label="Profit Factor"
                value={stats?.profit_factor ?? 0}
                accent={theme.colors.green}
              />

              <StatCard
                label="Best Month"
                value={
                  stats?.best_month
                    ? stats.best_month.month
                    : "—"
                }
                sub={
                  stats?.best_month
                    ? `$${stats.best_month.pl}`
                    : null
                }
                accent={theme.colors.green}
              />

              <StatCard
                label="Worst Month"
                value={
                  stats?.worst_month
                    ? stats.worst_month.month
                    : "—"
                }
                sub={
                  stats?.worst_month
                    ? `$${stats.worst_month.pl}`
                    : null
                }
                accent={theme.colors.red}
              />
            </div>

            {/* QUICK ACTIONS */}
            <SectionLabel text="Quick Actions" />

            <div style={styles.actionRow}>
              <ActionCard
                title="Log a Trade"
                desc="Add a new trade to your journal"
                onClick={() => onNavigate("journal")}
              />

              <ActionCard
                title="View Performance"
                desc="See your trading patterns & stats"
                onClick={() => onNavigate("performance")}
              />

              <ActionCard
                title="Community Insights"
                desc="Compare against other traders"
                onClick={() => onNavigate("community")}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/* =========================
   SECTION LABEL
========================= */

function SectionLabel({ text }) {
  return (
    <h2 style={styles.sectionLabel}>
      {text}
    </h2>
  );
}

/* =========================
   STAT CARD
========================= */

function StatCard({
  label,
  value,
  sub,
  accent,
}) {
  return (
    <div style={styles.statCard}>
      <div
        style={{
          ...styles.statAccent,
          backgroundColor: accent,
        }}
      />

      <p style={styles.statLabel}>
        {label}
      </p>

      <p style={styles.statValue}>
        {value}
      </p>

      {sub && (
        <p
          style={{
            ...styles.statSub,
            color: accent,
          }}
        >
          {sub}
        </p>
      )}
    </div>
  );
}

/* =========================
   ACTION CARD
========================= */

function ActionCard({
  title,
  desc,
  onClick,
}) {
  return (
    <div
      style={styles.actionCard}
      onClick={onClick}
    >
      <p style={styles.actionTitle}>
        {title}
      </p>

      <p style={styles.actionDesc}>
        {desc}
      </p>

      <span style={styles.actionArrow}>
        →
      </span>
    </div>
  );
}

/* =========================
   STYLES
========================= */

const styles = {
  layout: {
    display: "flex",
    backgroundColor: theme.colors.bg,
    minHeight: "100vh",
  },

  main: {
    flex: 1,
    padding: "32px 40px",
    maxWidth: "1200px",
  },

  header: {
    marginBottom: "28px",
  },

  pageTitle: {
    color: theme.colors.text,
    fontSize: "22px",
    fontWeight: 700,
    letterSpacing: "-0.02em",
    margin: 0,
  },

  pageSubtitle: {
    color: theme.colors.textMuted,
    fontSize: "13.5px",
    marginTop: "4px",
  },

  sectionLabel: {
    color: theme.colors.textMuted,
    fontSize: "12px",
    fontWeight: 600,
    textTransform: "uppercase",
    letterSpacing: "0.06em",
    margin: "32px 0 14px 0",
  },

  statRow: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(220px, 1fr))",
    gap: "14px",
  },

  statCard: {
    backgroundColor: theme.colors.bgCard,
    border: `1px solid ${theme.colors.border}`,
    borderRadius: theme.radius.md,
    padding: "18px 20px",
    position: "relative",
    overflow: "hidden",
  },

  statAccent: {
    position: "absolute",
    top: 0,
    left: 0,
    width: "3px",
    height: "100%",
  },

  statLabel: {
    color: theme.colors.textMuted,
    fontSize: "12.5px",
    fontWeight: 500,
    marginBottom: "8px",
  },

  statValue: {
    color: theme.colors.text,
    fontSize: "24px",
    fontWeight: 700,
    letterSpacing: "-0.02em",
  },

  statSub: {
    fontSize: "12px",
    fontWeight: 600,
    marginTop: "4px",
  },

  actionRow: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(220px, 1fr))",
    gap: "14px",
  },

  actionCard: {
    backgroundColor: theme.colors.bgCard,
    border: `1px solid ${theme.colors.border}`,
    borderRadius: theme.radius.md,
    padding: "20px",
    cursor: "pointer",
    position: "relative",
    transition:
      "border-color 0.15s, background-color 0.15s",
  },

  actionTitle: {
    color: theme.colors.text,
    fontSize: "14.5px",
    fontWeight: 600,
    marginBottom: "6px",
  },

  actionDesc: {
    color: theme.colors.textMuted,
    fontSize: "12.5px",
    lineHeight: 1.4,
  },

  actionArrow: {
    position: "absolute",
    top: "20px",
    right: "20px",
    color: theme.colors.primary,
    fontSize: "16px",
  },

  skeletonRow: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(220px, 1fr))",
    gap: "14px",
  },

  skeleton: {
    height: "88px",
    backgroundColor: theme.colors.bgCard,
    borderRadius: theme.radius.md,
    animation:
      "pulse 1.5s ease-in-out infinite",
  },

  errorBox: {
    backgroundColor: "#35151a",
    border: "1px solid #6b252d",
    borderRadius: "10px",
    padding: "16px",
    marginBottom: "20px",
    color: "#ff8b94",
  },

  retryButton: {
    marginTop: "10px",
    padding: "8px 16px",
    border: "none",
    borderRadius: "6px",
    backgroundColor: theme.colors.primary,
    color: "#fff",
    cursor: "pointer",
    fontWeight: 600,
  },
};

export default Dashboard;
