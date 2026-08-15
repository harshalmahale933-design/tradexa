import { useState, useEffect } from "react";
import { API_BASE_URL } from "../api";

function Settings({ user, onBack }) {
  const [profile, setProfile] = useState({ name: "", email: "", currency: "USD" });
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
 

  const [showNewAccount, setShowNewAccount] = useState(false);
  const [newAccount, setNewAccount] = useState({ account_name: "", account_type: "personal", starting_balance: "" });

  const fetchAll = async () => {
    try {
      const [profileRes, accountsRes] = await Promise.all([
        fetch(`${API_BASE_URL}/settings/profile?user_id=${user.id}`),
        fetch(`${API_BASE_URL}/accounts?user_id=${user.id}`),
      ]);
      const profileData = await profileRes.json();
      const accountsData = await accountsRes.json();
      setProfile(profileData);
      setAccounts(accountsData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const handleProfileSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage("");
    try {
      const res = await fetch(`${API_BASE_URL}/settings/profile`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: user.id, name: profile.name, currency: profile.currency }),
      });
      if (!res.ok) throw new Error("Failed to save");
      setMessage("Profile updated successfully.");
    } catch (err) {
      setMessage("Error saving profile.");
    } finally {
      setSaving(false);
    }
  };

  const handleCreateAccount = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE_URL}/trades/accounts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: user.id,
          account_name: newAccount.account_name,
          account_type: newAccount.account_type,
          starting_balance: parseFloat(newAccount.starting_balance) || 0,
        }),
      });
      if (!res.ok) throw new Error("Failed to create account");
      setNewAccount({ account_name: "", account_type: "personal", starting_balance: "" });
      setShowNewAccount(false);
      fetchAll();
    } catch (err) {
      alert("Error creating account: " + err.message);
    }
  };

  if (loading) return <div style={styles.centered}>Loading settings...</div>;

  return (
    <div style={styles.page}>
      <button style={styles.backBtn} onClick={onBack}>← Back to Dashboard</button>
      <h1 style={styles.title}>Settings</h1>

      <h2 style={styles.sectionTitle}>Profile</h2>
      <form onSubmit={handleProfileSave} style={styles.card}>
        <div style={styles.formRow}>
          <label style={styles.label}>Name</label>
          <input
            type="text"
            value={profile.name}
            onChange={(e) => setProfile({ ...profile, name: e.target.value })}
            style={styles.input}
          />
        </div>
        <div style={styles.formRow}>
          <label style={styles.label}>Email</label>
          <input type="email" value={profile.email} disabled style={{ ...styles.input, opacity: 0.5 }} />
        </div>
        <div style={styles.formRow}>
          <label style={styles.label}>Currency</label>
          <select
            value={profile.currency}
            onChange={(e) => setProfile({ ...profile, currency: e.target.value })}
            style={styles.input}
          >
            <option value="USD">USD</option>
            <option value="INR">INR</option>
          </select>
        </div>
        <button type="submit" style={styles.saveBtn} disabled={saving}>
          {saving ? "Saving..." : "Save Profile"}
        </button>
        {message && <p style={styles.message}>{message}</p>}
      </form>

      <div style={styles.sectionHeader}>
        <h2 style={styles.sectionTitle}>Accounts</h2>
        <button style={styles.addBtn} onClick={() => setShowNewAccount(!showNewAccount)}>
          {showNewAccount ? "Cancel" : "+ New Account"}
        </button>
      </div>

      {showNewAccount && (
        <form onSubmit={handleCreateAccount} style={styles.card}>
          <div style={styles.formRow}>
            <label style={styles.label}>Account Name</label>
            <input
              type="text"
              placeholder="e.g. Funded, Demo"
              value={newAccount.account_name}
              onChange={(e) => setNewAccount({ ...newAccount, account_name: e.target.value })}
              style={styles.input}
              required
            />
          </div>
          <div style={styles.formRow}>
            <label style={styles.label}>Account Type</label>
            <select
              value={newAccount.account_type}
              onChange={(e) => setNewAccount({ ...newAccount, account_type: e.target.value })}
              style={styles.input}
            >
              <option value="personal">Personal</option>
              <option value="funded">Funded</option>
              <option value="demo">Demo</option>
            </select>
          </div>
          <div style={styles.formRow}>
            <label style={styles.label}>Starting Balance</label>
            <input
              type="number"
              step="any"
              placeholder="0"
              value={newAccount.starting_balance}
              onChange={(e) => setNewAccount({ ...newAccount, starting_balance: e.target.value })}
              style={styles.input}
            />
          </div>
          <button type="submit" style={styles.saveBtn}>Create Account</button>
        </form>
      )}

      <div style={styles.accountsList}>
        {accounts.map((acc) => (
          <div key={acc.id} style={styles.accountCard}>
            <div>
              <p style={styles.accountName}>{acc.account_name}</p>
              <p style={styles.accountType}>{acc.account_type}</p>
            </div>
            <p style={styles.accountBalance}>${acc.current_balance}</p>
          </div>
        ))}
      </div>
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
    margin: "0 0 12px 0",
  },
  sectionHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: "28px",
  },
  card: {
    backgroundColor: "#1a1d24",
    padding: "20px",
    borderRadius: "12px",
    marginBottom: "12px",
    maxWidth: "400px",
  },
  formRow: {
    marginBottom: "14px",
  },
  label: {
    display: "block",
    color: "#9aa0aa",
    fontSize: "12px",
    marginBottom: "6px",
  },
  input: {
    width: "100%",
    padding: "10px",
    borderRadius: "6px",
    border: "1px solid #333",
    backgroundColor: "#0f1115",
    color: "#fff",
    fontSize: "14px",
    boxSizing: "border-box",
  },
  saveBtn: {
    padding: "10px 20px",
    borderRadius: "8px",
    border: "none",
    backgroundColor: "#4ade80",
    color: "#0f1115",
    fontWeight: "700",
    cursor: "pointer",
  },
  addBtn: {
    padding: "8px 16px",
    borderRadius: "6px",
    border: "1px solid #4f7fff",
    backgroundColor: "transparent",
    color: "#4f7fff",
    cursor: "pointer",
    fontSize: "13px",
  },
  message: {
    color: "#4ade80",
    fontSize: "13px",
    marginTop: "10px",
  },
  accountsList: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
    marginTop: "12px",
  },
  accountCard: {
    backgroundColor: "#1a1d24",
    padding: "16px 20px",
    borderRadius: "10px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    maxWidth: "400px",
  },
  accountName: {
    color: "#fff",
    fontSize: "14px",
    fontWeight: "600",
    margin: 0,
  },
  accountType: {
    color: "#9aa0aa",
    fontSize: "12px",
    textTransform: "capitalize",
    margin: "4px 0 0 0",
  },
  accountBalance: {
    color: "#4ade80",
    fontSize: "16px",
    fontWeight: "700",
    margin: 0,
  },
};

export default Settings;
