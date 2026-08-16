import { useState, useEffect, useRef } from "react";
import { API_BASE_URL } from "../api";
import Sidebar from "../components/Sidebar";
import Scene3DBackground from "../components/Scene3DBackground";
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

      const [summaryRes, statsRes] = await Promise.all([
        fetch(
          `${API_BASE_URL}/dashboard/summary?account_id=${accountId}`
        ),
        fetch(
          `${API_BASE_URL}/dashboard/statistics?account_id=${accountId}`
        ),
      ]);

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
        {/* AMBIENT PAGE GLOW */}
        <div className="glow-blob" style={styles.pageGlowMint} />
        <div className="glow-blob" style={{ ...styles.pageGlowRed, animationDelay: "-6s" }} />

        {/* HERO with full 3D scene */}
        <div style={styles.heroWrap}>
          <Scene3DBackground intensity="full" />
          <div style={styles.heroOverlay} />

          <div style={styles.header}>
            <div style={styles.liveBadge}>
              <span className="live-dot" style={styles.liveDot} />
              MARKET OPEN
            </div>

            <h1 style={styles.pageTitle}>Dashboard</h1>

            <p style={styles.pageSubtitle}>
              Welcome back, <span style={styles.pageSubtitleName}>{firstName}</span> — here's how your trading is going.
            </p>
          </div>
        </div>

        <div style={styles.body}>
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
                  icon={IconTrendUp}
                  label="Total Profit"
                  value={`$${summary?.total_profit ?? 0}`}
                  accent={theme.colors.mint}
                />

                <StatCard
                  icon={IconTrendDown}
                  label="Total Loss"
                  value={`$${summary?.total_loss ?? 0}`}
                  accent={theme.colors.red}
                />

                <StatCard
                  icon={IconTarget}
                  label="Win Rate"
                  value={`${summary?.win_rate ?? 0}%`}
                  accent={theme.colors.mint}
                />

                <StatCard
                  icon={IconStack}
                  label="Total Trades"
                  value={summary?.total_trades ?? 0}
                  accent={theme.colors.amber}
                />
              </div>

              {/* PERFORMANCE */}
              <SectionLabel text="Performance Statistics" />

              <div style={styles.statRow}>
                <StatCard
                  icon={IconGauge}
                  label="Average RR"
                  value={stats?.average_rr ?? 0}
                  accent={theme.colors.mint}
                />

                <StatCard
                  icon={IconBolt}
                  label="Profit Factor"
                  value={stats?.profit_factor ?? 0}
                  accent={theme.colors.mint}
                />

                <StatCard
                  icon={IconCalendarUp}
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
                  accent={theme.colors.mint}
                />

                <StatCard
                  icon={IconCalendarDown}
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
                  icon={IconPencil}
                  title="Log a Trade"
                  desc="Add a new trade to your journal"
                  accent={theme.colors.mint}
                  onClick={() => onNavigate("journal")}
                />

                <ActionCard
                  icon={IconChart}
                  title="View Performance"
                  desc="See your trading patterns & stats"
                  accent={theme.colors.amber}
                  onClick={() => onNavigate("performance")}
                />

                <ActionCard
                  icon={IconUsers}
                  title="Community Insights"
                  desc="Compare against other traders"
                  accent={theme.colors.red}
                  onClick={() => onNavigate("community")}
                />
              </div>
            </>
          )}
        </div>
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
      <span style={styles.sectionLabelLine} />
      {text}
    </h2>
  );
}

/* =========================
   STAT CARD (tilt on hover)
========================= */

function StatCard({ icon: Icon, label, value, sub, accent }) {
  const ref = useRef(null);

  const handleMouseMove = (e) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    el.style.transform = `perspective(600px) rotateY(${x * 8}deg) rotateX(${-y * 8}deg) translateY(-2px)`;
  };

  const handleMouseLeave = () => {
    const el = ref.current;
    if (!el) return;
    el.style.transform = "perspective(600px) rotateY(0) rotateX(0) translateY(0)";
  };

  return (
    <div
      ref={ref}
      className="stagger-in tilt-card"
      style={styles.statCard}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <div
        style={{
          ...styles.statTopLine,
          background: `linear-gradient(90deg, ${accent}, transparent)`,
        }}
      />

      <div style={styles.statHeaderRow}>
        <p style={styles.statLabel}>{label}</p>
        <div
          style={{
            ...styles.statIconBadge,
            backgroundColor: `${accent}1f`,
            color: accent,
            boxShadow: `0 0 16px ${accent}40`,
          }}
        >
          <Icon size={15} />
        </div>
      </div>

      <p style={styles.statValue}>{value}</p>

      {sub && (
        <p style={{ ...styles.statSub, color: accent }}>{sub}</p>
      )}
    </div>
  );
}

/* =========================
   ACTION CARD
========================= */

function ActionCard({ icon: Icon, title, desc, accent, onClick }) {
  return (
    <div
      className="stagger-in glass-hover"
      style={styles.actionCard}
      onClick={onClick}
    >
      <div
        style={{
          ...styles.actionIconBadge,
          backgroundColor: `${accent}1f`,
          color: accent,
          boxShadow: `0 0 16px ${accent}40`,
        }}
      >
        <Icon size={17} />
      </div>

      <p style={styles.actionTitle}>{title}</p>
      <p style={styles.actionDesc}>{desc}</p>

      <span style={{ ...styles.actionArrow, color: accent }}>→</span>
    </div>
  );
}

/* =========================
   ICONS (inline SVG, no deps)
========================= */

function IconTrendUp({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 17 9 11 13 15 21 6" />
      <polyline points="14 6 21 6 21 13" />
    </svg>
  );
}
function IconTrendDown({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 7 9 13 13 9 21 18" />
      <polyline points="14 18 21 18 21 11" />
    </svg>
  );
}
function IconTarget({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
      <circle cx="12" cy="12" r="8" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="12" cy="12" r="0.7" fill="currentColor" />
    </svg>
  );
}
function IconStack({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 21 7 12 12 3 7 12 2" />
      <polyline points="3 12 12 17 21 12" />
      <polyline points="3 17 12 22 21 17" />
    </svg>
  );
}
function IconGauge({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" />
      <path d="M4.9 19a9 9 0 1 1 14.2 0" />
      <path d="M12 12l3-2" />
    </svg>
  );
}
function IconBolt({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="13 2 4 14 12 14 11 22 20 10 12 10 13 2" />
    </svg>
  );
}
function IconCalendarUp({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="17" rx="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
      <polyline points="8 17 11.5 13.5 14 16 17 12" />
    </svg>
  );
}
function IconCalendarDown({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="17" rx="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
      <polyline points="8 13 11.5 16.5 14 14 17 18" />
    </svg>
  );
}
function IconPencil({ size = 17 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
    </svg>
  );
}
function IconChart({ size = 17 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" />
    </svg>
  );
}
function IconUsers({ size = 17 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
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
    position: "relative",
    overflow: "hidden",
  },

  pageGlowMint: {
    position: "absolute",
    top: "-120px",
    right: "-100px",
    width: "420px",
    height: "420px",
    borderRadius: "50%",
    background: "radial-gradient(circle, rgba(0,229,160,0.10), transparent 70%)",
    filter: "blur(60px)",
    pointerEvents: "none",
    zIndex: 0,
  },

  pageGlowRed: {
    position: "absolute",
    top: "420px",
    left: "-140px",
    width: "380px",
    height: "380px",
    borderRadius: "50%",
    background: "radial-gradient(circle, rgba(255,77,106,0.08), transparent 70%)",
    filter: "blur(60px)",
    pointerEvents: "none",
    zIndex: 0,
  },

  heroWrap: {
    position: "relative",
    overflow: "hidden",
    minHeight: "300px",
    display: "flex",
    alignItems: "flex-end",
    padding: "40px 40px 36px",
    borderBottom: `1px solid ${theme.colors.border}`,
    zIndex: 1,
  },

  heroOverlay: {
    position: "absolute",
    inset: 0,
    background: "linear-gradient(180deg, transparent 0%, rgba(6,7,10,0.55) 65%, rgba(6,7,10,0.95) 100%)",
    zIndex: 1,
    pointerEvents: "none",
  },

  header: {
    position: "relative",
    zIndex: 2,
  },

  liveBadge: {
    display: "inline-flex",
    alignItems: "center",
    gap: "7px",
    padding: "5px 12px 5px 9px",
    borderRadius: "999px",
    border: `1px solid ${theme.colors.border}`,
    background: "rgba(0,0,0,0.4)",
    backdropFilter: "blur(10px)",
    color: theme.colors.textMuted,
    fontFamily: theme.font.mono,
    fontSize: "10.5px",
    fontWeight: 600,
    letterSpacing: "0.08em",
    marginBottom: "16px",
  },

  liveDot: {
    width: "6px",
    height: "6px",
    borderRadius: "50%",
    backgroundColor: theme.colors.mint,
    boxShadow: `0 0 8px ${theme.colors.mint}`,
    display: "inline-block",
  },

  pageTitle: {
    color: theme.colors.text,
    background: `linear-gradient(135deg, #ffffff 30%, ${theme.colors.mint} 100%)`,
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    backgroundClip: "text",
    fontFamily: theme.font.display,
    fontSize: "38px",
    fontWeight: 700,
    letterSpacing: "-0.02em",
    margin: 0,
    lineHeight: 1.1,
  },

  pageSubtitle: {
    color: theme.colors.textMuted,
    fontFamily: theme.font.family,
    fontSize: "14.5px",
    marginTop: "10px",
  },

  pageSubtitleName: {
    color: theme.colors.text,
    fontWeight: 600,
  },

  body: {
    position: "relative",
    zIndex: 1,
    padding: "0 40px 40px",
    maxWidth: "1200px",
  },

  sectionLabel: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    color: theme.colors.textMuted,
    fontFamily: theme.font.mono,
    fontSize: "11.5px",
    fontWeight: 600,
    textTransform: "uppercase",
    letterSpacing: "0.1em",
    margin: "36px 0 16px 0",
  },

  sectionLabelLine: {
    width: "16px",
    height: "1px",
    background: theme.colors.border,
    display: "inline-block",
  },

  statRow: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: "14px",
  },

  statCard: {
    background: theme.glass.background,
    backdropFilter: theme.glass.backdropFilter,
    WebkitBackdropFilter: theme.glass.backdropFilter,
    border: `1px solid ${theme.colors.border}`,
    borderRadius: theme.radius.md,
    padding: "18px 20px 20px",
    position: "relative",
    overflow: "hidden",
    cursor: "default",
  },

  statTopLine: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: "2px",
  },

  statHeaderRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: "14px",
  },

  statIconBadge: {
    width: "28px",
    height: "28px",
    borderRadius: "8px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },

  statLabel: {
    color: theme.colors.textMuted,
    fontFamily: theme.font.family,
    fontSize: "12.5px",
    fontWeight: 500,
    margin: 0,
  },

  statValue: {
    color: theme.colors.text,
    fontFamily: theme.font.mono,
    fontSize: "25px",
    fontWeight: 600,
    letterSpacing: "-0.01em",
    margin: 0,
  },

  statSub: {
    fontFamily: theme.font.mono,
    fontSize: "12px",
    fontWeight: 600,
    marginTop: "5px",
  },

  actionRow: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
    gap: "14px",
  },

  actionCard: {
    background: theme.glass.background,
    backdropFilter: theme.glass.backdropFilter,
    WebkitBackdropFilter: theme.glass.backdropFilter,
    border: `1px solid ${theme.colors.border}`,
    borderRadius: theme.radius.md,
    padding: "22px 20px",
    cursor: "pointer",
    position: "relative",
  },

  actionIconBadge: {
    width: "36px",
    height: "36px",
    borderRadius: "10px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: "14px",
  },

  actionTitle: {
    color: theme.colors.text,
    fontFamily: theme.font.family,
    fontSize: "14.5px",
    fontWeight: 600,
    marginBottom: "6px",
  },

  actionDesc: {
    color: theme.colors.textMuted,
    fontFamily: theme.font.family,
    fontSize: "12.5px",
    lineHeight: 1.4,
  },

  actionArrow: {
    position: "absolute",
    top: "22px",
    right: "20px",
    fontSize: "17px",
  },

  errorBox: {
    backgroundColor: theme.colors.redDim,
    border: "1px solid rgba(255,77,106,0.35)",
    borderRadius: theme.radius.sm,
    padding: "16px",
    marginBottom: "20px",
    color: theme.colors.red,
    fontFamily: theme.font.family,
  },

  retryButton: {
    marginTop: "10px",
    padding: "8px 16px",
    border: "none",
    borderRadius: theme.radius.sm,
    background: `linear-gradient(135deg, ${theme.colors.mint}, ${theme.colors.mintDeep})`,
    color: "#04140d",
    cursor: "pointer",
    fontWeight: 700,
    fontFamily: theme.font.family,
  },

  skeletonRow: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: "14px",
  },

  skeleton: {
    height: "94px",
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.bgCard,
    border: `1px solid ${theme.colors.border}`,
    animation: "pulse 1.5s ease-in-out infinite",
  },
};

export default Dashboard;
