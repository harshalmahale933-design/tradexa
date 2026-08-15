import { theme } from "../theme";

const NAV_ITEMS = [
  { key: "dashboard", label: "Dashboard", icon: "◆" },
  { key: "journal", label: "Trade Journal", icon: "▤" },
  { key: "market", label: "Market Intelligence", icon: "▲" },
  {
  key: "intelligence",
  label: "Tradexa Intelligence",
  icon: "◆",
},
   { key: "coach", label: "Tradexa Coach", icon: "✚" },
  { key: "performance", label: "Personal Performance", icon: "◈" },
  { key: "community", label: "Community", icon: "◉" },
   { key: "learning", label: "Learning", icon: "✦" },
  { key: "settings", label: "Settings", icon: "⚙" },
];

function Sidebar({ activePage, onNavigate, user, onLogout }) {
  return (
    <div style={styles.sidebar}>
      <div>
        <div style={styles.logoWrap}>
          <div style={styles.logoMark}>T</div>
          <span style={styles.logoText}>Tradexa</span>
        </div>

        <nav style={styles.nav}>
          {NAV_ITEMS.map((item) => {
            const isActive = activePage === item.key;
            return (
              <div
                key={item.key}
                onClick={() => onNavigate(item.key)}
                style={{
                  ...styles.navItem,
                  ...(isActive ? styles.navItemActive : {}),
                }}
              >
                <span style={styles.navIcon}>{item.icon}</span>
                {item.label}
              </div>
            );
          })}
        </nav>
      </div>

      <div style={styles.footer}>
        <div style={styles.userRow}>
          <div style={styles.avatar}>{user.name.charAt(0).toUpperCase()}</div>
          <div style={{ overflow: "hidden" }}>
            <p style={styles.userName}>{user.name}</p>
            <p style={styles.userEmail}>{user.email}</p>
          </div>
        </div>
        <button style={styles.logoutBtn} onClick={onLogout}>Log out</button>
      </div>
    </div>
  );
}

const styles = {
  sidebar: {
    width: "240px",
    minWidth: "240px",
    height: "100vh",
    backgroundColor: theme.colors.bgElevated,
    borderRight: `1px solid ${theme.colors.border}`,
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    position: "sticky",
    top: 0,
  },
  logoWrap: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    padding: "24px 20px",
  },
  logoMark: {
    width: "28px",
    height: "28px",
    borderRadius: "8px",
    background: `linear-gradient(135deg, ${theme.colors.primary}, #8a5bff)`,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#fff",
    fontWeight: 800,
    fontSize: "14px",
  },
  logoText: {
    color: theme.colors.text,
    fontWeight: 700,
    fontSize: "16px",
    letterSpacing: "-0.02em",
  },
  nav: {
    display: "flex",
    flexDirection: "column",
    gap: "2px",
    padding: "8px 12px",
  },
  navItem: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    padding: "10px 12px",
    borderRadius: theme.radius.sm,
    color: theme.colors.textMuted,
    fontSize: "13.5px",
    fontWeight: 500,
    cursor: "pointer",
    transition: "background-color 0.15s, color 0.15s",
  },
  navItemActive: {
    backgroundColor: theme.colors.primaryMuted,
    color: theme.colors.primary,
    fontWeight: 600,
  },
  navIcon: {
    fontSize: "13px",
    width: "16px",
    textAlign: "center",
    opacity: 0.85,
  },
  footer: {
    padding: "16px",
    borderTop: `1px solid ${theme.colors.border}`,
  },
  userRow: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    marginBottom: "12px",
  },
  avatar: {
    width: "32px",
    height: "32px",
    minWidth: "32px",
    borderRadius: "50%",
    backgroundColor: theme.colors.primaryMuted,
    color: theme.colors.primary,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 700,
    fontSize: "13px",
  },
  userName: {
    color: theme.colors.text,
    fontSize: "13px",
    fontWeight: 600,
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  userEmail: {
    color: theme.colors.textFaint,
    fontSize: "11px",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  logoutBtn: {
    width: "100%",
    padding: "8px",
    borderRadius: theme.radius.sm,
    border: `1px solid ${theme.colors.border}`,
    backgroundColor: "transparent",
    color: theme.colors.textMuted,
    fontSize: "12.5px",
    fontWeight: 500,
    cursor: "pointer",
  },
};

export default Sidebar;