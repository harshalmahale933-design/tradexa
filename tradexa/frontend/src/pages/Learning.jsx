import { useState, useEffect } from "react";
import { API_BASE_URL } from "../api";
import Sidebar from "../components/Sidebar";
import { theme } from "../theme";

const CATEGORIES = [
  "All", "Risk Management", "Trading Psychology", "Smart Money Concepts",
  "Technical Analysis", "Fundamental Analysis", "Indian Market"
];

function Learning({ user, onLogout, onNavigate }) {
  const [lessons, setLessons] = useState([]);
  const [recommended, setRecommended] = useState(null);
  const [activeCategory, setActiveCategory] = useState("All");
  const [loading, setLoading] = useState(true);
  

  const fetchData = async (category) => {
    try {
      const url = category === "All"
        ? `${API_BASE_URL}/learning/lessons`
        : `${API_BASE_URL}/learning/lessons?category=${encodeURIComponent(category)}`;
      const res = await fetch(url);
      setLessons(await res.json());
    } catch (err) {
      console.error(err);
    }
  };

  const fetchRecommended = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/learning/recommended?account_id=${user.account_id}`);
      setRecommended(await res.json());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecommended();
  }, []);

  useEffect(() => {
    fetchData(activeCategory);
  }, [activeCategory]);

  return (
    <div style={styles.layout}>
      <Sidebar activePage="learning" onNavigate={onNavigate} user={user} onLogout={onLogout} />

      <div style={styles.main}>
        <div style={styles.header}>
          <h1 style={styles.pageTitle}>Tradexa Learning</h1>
          <p style={styles.pageSubtitle}>Personalized lessons based on your trading patterns</p>
        </div>

        {!loading && recommended && (
          <>
            <h2 style={styles.sectionLabel}>
              {recommended.based_on_mistakes ? "Recommended Based on Your Mistakes" : "Recommended for You"}
            </h2>
            <div style={styles.grid}>
              {recommended.recommendations.map((l) => (
                <LessonCard key={l.id} lesson={l} highlight />
              ))}
            </div>
          </>
        )}

        <h2 style={styles.sectionLabel}>Browse All Lessons</h2>
        <div style={styles.categoryRow}>
          {CATEGORIES.map((c) => (
            <button
              key={c}
              onClick={() => setActiveCategory(c)}
              style={{
                ...styles.categoryBtn,
                ...(activeCategory === c ? styles.categoryBtnActive : {}),
              }}
            >
              {c}
            </button>
          ))}
        </div>

        <div style={styles.grid}>
          {lessons.map((l) => (
            <LessonCard key={l.id} lesson={l} />
          ))}
        </div>
      </div>
    </div>
  );
}

function LessonCard({ lesson, highlight }) {
  return (
    <div style={{ ...styles.lessonCard, ...(highlight ? styles.lessonCardHighlight : {}) }}>
      <p style={styles.lessonCategory}>{lesson.category}</p>
      <p style={styles.lessonTitle}>{lesson.title}</p>
      <p style={styles.lessonDesc}>{lesson.description}</p>
      <div style={styles.lessonFooter}>
        <span style={styles.lessonTime}>{lesson.duration_minutes} min</span>
      </div>
      {lesson.recommended_because && (
        <p style={styles.lessonReason}>{lesson.recommended_because}</p>
      )}
    </div>
  );
}

const styles = {
  layout: { display: "flex", backgroundColor: theme.colors.bg, minHeight: "100vh" },
  main: { flex: 1, padding: "32px 40px", maxWidth: "1200px" },
  header: { marginBottom: "24px" },
  pageTitle: { color: theme.colors.text, fontSize: "22px", fontWeight: 700, letterSpacing: "-0.02em" },
  pageSubtitle: { color: theme.colors.textMuted, fontSize: "13.5px", marginTop: "4px" },
  sectionLabel: {
    color: theme.colors.textMuted,
    fontSize: "12px",
    fontWeight: 600,
    textTransform: "uppercase",
    letterSpacing: "0.06em",
    margin: "28px 0 14px 0",
  },
  categoryRow: {
    display: "flex",
    flexWrap: "wrap",
    gap: "8px",
    marginBottom: "18px",
  },
  categoryBtn: {
    padding: "7px 14px",
    borderRadius: "20px",
    border: `1px solid ${theme.colors.border}`,
    backgroundColor: "transparent",
    color: theme.colors.textMuted,
    fontSize: "12.5px",
    fontWeight: 500,
    cursor: "pointer",
  },
  categoryBtnActive: {
    backgroundColor: theme.colors.primaryMuted,
    borderColor: theme.colors.primary,
    color: theme.colors.primary,
    fontWeight: 600,
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
    gap: "14px",
  },
  lessonCard: {
    backgroundColor: theme.colors.bgCard,
    border: `1px solid ${theme.colors.border}`,
    borderRadius: theme.radius.md,
    padding: "18px 20px",
  },
  lessonCardHighlight: {
    border: `1px solid ${theme.colors.primary}`,
  },
  lessonCategory: {
    color: theme.colors.primary,
    fontSize: "11px",
    fontWeight: 600,
    textTransform: "uppercase",
    letterSpacing: "0.04em",
    marginBottom: "8px",
  },
  lessonTitle: {
    color: theme.colors.text,
    fontSize: "14.5px",
    fontWeight: 700,
    marginBottom: "6px",
  },
  lessonDesc: {
    color: theme.colors.textMuted,
    fontSize: "12.5px",
    lineHeight: 1.5,
    marginBottom: "12px",
  },
  lessonFooter: {
    display: "flex",
    justifyContent: "space-between",
  },
  lessonTime: {
    color: theme.colors.textFaint,
    fontSize: "11.5px",
    fontWeight: 500,
  },
  lessonReason: {
    color: theme.colors.amber,
    fontSize: "11px",
    fontWeight: 500,
    marginTop: "10px",
    fontStyle: "italic",
  },
};

export default Learning;
