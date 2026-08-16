import { useState, useEffect } from "react";
import { API_BASE_URL } from "../api";
import Sidebar from "../components/Sidebar";
import { theme } from "../theme";

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

function Calendar({ user, onLogout, onNavigate }) {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth() + 1);
  const [daySummary, setDaySummary] = useState({});
  const [selectedDate, setSelectedDate] = useState(null);
  const [dayTrades, setDayTrades] = useState([]);
  const [loading, setLoading] = useState(true);
  

  const fetchMonthSummary = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `${API_BASE_URL}/trades/trades/calendar-summary?account_id=${user.account_id}&year=${year}&month=${month}`
      );
      setDaySummary(await res.json());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMonthSummary();
    setSelectedDate(null);
    setDayTrades([]);
  }, [year, month]);

  const handleDayClick = async (dateStr) => {
    setSelectedDate(dateStr);
    try {
      const res = await fetch(`${API_BASE_URL}/calendar/${dateStr}`);
      const data = await res.json();
      setDayTrades(data.filter((t) => t.account_id === user.account_id));
    } catch (err) {
      console.error(err);
    }
  };

  const goPrevMonth = () => {
    if (month === 1) { setMonth(12); setYear(year - 1); } else { setMonth(month - 1); }
  };
  const goNextMonth = () => {
    if (month === 12) { setMonth(1); setYear(year + 1); } else { setMonth(month + 1); }
  };

  const firstDayOfMonth = new Date(year, month - 1, 1).getDay();
  const daysInMonth = new Date(year, month, 0).getDate();
  const cells = [];
  for (let i = 0; i < firstDayOfMonth; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const formatDateStr = (day) => {
    const mm = String(month).padStart(2, "0");
    const dd = String(day).padStart(2, "0");
    return `${year}-${mm}-${dd}`;
  };

  const isToday = (day) => {
    return day === today.getDate() && month === today.getMonth() + 1 && year === today.getFullYear();
  };

  return (
    <div style={styles.layout}>
      <Sidebar activePage="journal" onNavigate={onNavigate} user={user} onLogout={onLogout} />

      <div style={styles.main}>
        <div style={styles.header}>
          <div>
            <h1 style={styles.pageTitle}>Trade Calendar</h1>
            <p style={styles.pageSubtitle}>Daily view of your trading activity</p>
          </div>
          <button style={styles.secondaryBtn} onClick={() => onNavigate("journal")}>← Back to Journal</button>
        </div>

        <div style={styles.calendarCard}>
          <div style={styles.monthNav}>
            <button style={styles.navBtn} onClick={goPrevMonth}>←</button>
            <h2 style={styles.monthLabel}>{MONTH_NAMES[month - 1]} {year}</h2>
            <button style={styles.navBtn} onClick={goNextMonth}>→</button>
          </div>

          <div style={styles.weekHeader}>
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
              <div key={d} style={styles.weekDay}>{d}</div>
            ))}
          </div>

          <div style={styles.grid}>
            {cells.map((day, idx) => {
              if (day === null) return <div key={idx} style={styles.emptyCell} />;
              const dateStr = formatDateStr(day);
              const summary = daySummary[dateStr];
              const isSelected = selectedDate === dateStr;

              return (
                <div
                  key={idx}
                  style={{
                    ...styles.dayCell,
                    ...(isToday(day) ? styles.dayCellToday : {}),
                    ...(summary ? styles.dayCellHasTrades : {}),
                    ...(isSelected ? styles.dayCellSelected : {}),
                  }}
                  onClick={() => handleDayClick(dateStr)}
                >
                  <span style={styles.dayNumber}>{day}</span>
                  {summary && (
                    <div style={styles.dayBadge}>
                      <span style={{
                        fontWeight: 700,
                        color: summary.total_pl >= 0 ? theme.colors.green : theme.colors.red,
                      }}>
                        ${summary.total_pl}
                      </span>
                      <span style={styles.dayCount}>{summary.count} trade{summary.count > 1 ? "s" : ""}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {selectedDate && (
          <div style={styles.detailPanel}>
            <h3 style={styles.detailTitle}>Trades on {selectedDate}</h3>
            {dayTrades.length === 0 ? (
              <p style={styles.emptyText}>No trades on this date.</p>
            ) : (
              <table style={styles.table}>
                <thead>
                  <tr>
                    {["Asset", "Direction", "Entry", "Exit", "RR", "P/L", "Result"].map((h) => (
                      <th key={h} style={styles.th}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {dayTrades.map((t) => (
                    <tr key={t.id}>
                      <td style={styles.td}>{t.asset}</td>
                      <td style={styles.td}>{t.direction}</td>
                      <td style={styles.td}>{t.entry_price}</td>
                      <td style={styles.td}>{t.exit_price ?? "—"}</td>
                      <td style={styles.td}>{t.realized_rr ?? "—"}</td>
                      <td style={{ ...styles.td, color: t.pl_amount > 0 ? theme.colors.green : t.pl_amount < 0 ? theme.colors.red : theme.colors.text, fontWeight: 700 }}>
                        {t.pl_amount != null ? `$${t.pl_amount}` : "—"}
                      </td>
                      <td style={styles.td}>{t.trade_result ?? "Open"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  layout: { display: "flex", backgroundColor: theme.colors.bg, minHeight: "100vh" },
  main: { flex: 1, padding: "32px 40px", maxWidth: "1200px" },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: "24px",
  },
  pageTitle: { color: theme.colors.text, fontSize: "22px", fontWeight: 700, letterSpacing: "-0.02em" },
  pageSubtitle: { color: theme.colors.textMuted, fontSize: "13.5px", marginTop: "4px" },
  secondaryBtn: {
    padding: "10px 18px",
    borderRadius: theme.radius.sm,
    border: `1px solid ${theme.colors.border}`,
    backgroundColor: "transparent",
    color: theme.colors.textMuted,
    fontWeight: 600,
    fontSize: "13px",
    cursor: "pointer",
  },
  calendarCard: {
    backgroundColor: theme.colors.bgCard,
    border: `1px solid ${theme.colors.border}`,
    borderRadius: theme.radius.md,
    padding: "24px",
  },
  monthNav: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "18px",
  },
  monthLabel: { color: theme.colors.text, fontSize: "16px", fontWeight: 700 },
  navBtn: {
    width: "32px",
    height: "32px",
    borderRadius: theme.radius.sm,
    border: `1px solid ${theme.colors.border}`,
    backgroundColor: "transparent",
    color: theme.colors.text,
    cursor: "pointer",
    fontSize: "14px",
  },
  weekHeader: {
    display: "grid",
    gridTemplateColumns: "repeat(7, 1fr)",
    marginBottom: "8px",
  },
  weekDay: {
    textAlign: "center",
    color: theme.colors.textFaint,
    fontSize: "11px",
    fontWeight: 600,
    textTransform: "uppercase",
    padding: "6px",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(7, 1fr)",
    gap: "6px",
  },
  emptyCell: { minHeight: "76px" },
  dayCell: {
    minHeight: "76px",
    backgroundColor: theme.colors.bg,
    borderRadius: theme.radius.sm,
    border: `1px solid ${theme.colors.border}`,
    padding: "8px",
    cursor: "pointer",
    transition: "border-color 0.15s",
  },
  dayCellToday: {
    border: `1px solid ${theme.colors.primary}`,
  },
  dayCellHasTrades: {
    backgroundColor: theme.colors.bgHover,
  },
  dayCellSelected: {
    border: `1px solid ${theme.colors.primary}`,
    backgroundColor: theme.colors.primaryMuted,
  },
  dayNumber: { color: theme.colors.text, fontSize: "12.5px", fontWeight: 500 },
  dayBadge: { display: "flex", flexDirection: "column", marginTop: "6px", fontSize: "11px" },
  dayCount: { color: theme.colors.textFaint, fontSize: "10px", marginTop: "2px" },
  detailPanel: {
    marginTop: "20px",
    backgroundColor: theme.colors.bgCard,
    border: `1px solid ${theme.colors.border}`,
    borderRadius: theme.radius.md,
    padding: "22px",
  },
  detailTitle: { color: theme.colors.text, fontSize: "15px", fontWeight: 700, marginBottom: "14px" },
  table: { width: "100%", borderCollapse: "collapse" },
  th: {
    textAlign: "left",
    padding: "10px 12px",
    color: theme.colors.textFaint,
    fontSize: "11px",
    fontWeight: 600,
    textTransform: "uppercase",
    borderBottom: `1px solid ${theme.colors.border}`,
  },
  td: {
    padding: "10px 12px",
    color: theme.colors.text,
    fontSize: "13px",
    borderBottom: `1px solid ${theme.colors.border}`,
  },
  emptyText: { color: theme.colors.textMuted, fontSize: "13px" },
};

export default Calendar;
