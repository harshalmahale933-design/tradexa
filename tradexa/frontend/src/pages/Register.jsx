import { useState } from "react";
import { API_BASE_URL } from "../api";
import Scene3DBackground from "../components/Scene3DBackground";
import { theme } from "../theme";

function Register({ onSwitchToLogin }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e) => {
    e.preventDefault();

    setError("");
    setLoading(true);

    try {
      const response = await fetch(
        `${API_BASE_URL}/auth/register`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: name.trim(),
            email: email.trim(),
            password: password,
          }),
        }
      );

      let data;
      try {
        data = await response.json();
      } catch {
        data = {};
      }

      if (!response.ok) {
        throw new Error(
          data?.detail || `Registration failed (${response.status})`
        );
      }

      alert("Account created successfully! You can now log in.");

      setName("");
      setEmail("");
      setPassword("");

      if (typeof onSwitchToLogin === "function") {
        onSwitchToLogin();
      }
    } catch (err) {
      if (
        err instanceof TypeError &&
        err.message.toLowerCase().includes("fetch")
      ) {
        setError("Cannot connect to the server. Please try again shortly.");
      } else {
        setError(err.message || "Registration failed");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <Scene3DBackground intensity="full" />

      <div style={styles.stage}>
        <div style={styles.card}>
          <div style={styles.logo}>TX</div>

          <h1 style={styles.title}>Tradexa</h1>
          <p style={styles.subtitle}>Create your trading account</p>

          <form onSubmit={handleRegister} style={styles.form}>
            <div style={styles.field}>
              <label style={styles.label}>Full Name</label>
              <input
                type="text"
                placeholder="Enter your full name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                style={styles.input}
                required
              />
            </div>

            <div style={styles.field}>
              <label style={styles.label}>Email</label>
              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={styles.input}
                required
              />
            </div>

            <div style={styles.field}>
              <label style={styles.label}>Password</label>
              <input
                type="password"
                placeholder="Create a password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={styles.input}
                required
                minLength={6}
              />
            </div>

            {error && (
              <div style={styles.error}>
                <span style={styles.errorIcon}>!</span>
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              style={{
                ...styles.button,
                ...(loading ? styles.buttonDisabled : {}),
              }}
              disabled={loading}
            >
              {loading ? "Creating account..." : "Create Account"}
            </button>
          </form>

          <div style={styles.divider}>
            <span style={styles.line}></span>
            <span style={styles.or}>OR</span>
            <span style={styles.line}></span>
          </div>

          <p style={styles.switchText}>
            Already have an account?{" "}
            <span style={styles.switchLink} onClick={onSwitchToLogin}>
              Log in
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: {
    position: "relative",
    minHeight: "100vh",
    width: "100%",
    overflow: "hidden",
    backgroundColor: theme.colors.bg,
  },

  stage: {
    position: "relative",
    zIndex: 2,
    minHeight: "100vh",
    width: "100%",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    padding: "20px",
    boxSizing: "border-box",
  },

  card: {
    width: "380px",
    maxWidth: "100%",
    background: "rgba(8,10,14,0.55)",
    backdropFilter: "blur(24px) saturate(140%)",
    WebkitBackdropFilter: "blur(24px) saturate(140%)",
    border: `1px solid ${theme.colors.border}`,
    borderRadius: theme.radius.lg,
    padding: "38px",
    boxSizing: "border-box",
    boxShadow: "0 40px 100px rgba(0,0,0,0.6), 0 0 0 1px rgba(0,229,160,0.06), inset 0 1px 0 rgba(255,255,255,0.06)",
  },

  logo: {
    width: "48px",
    height: "48px",
    borderRadius: "12px",
    background: `linear-gradient(135deg, ${theme.colors.mint}, ${theme.colors.mintDeep})`,
    color: "#04140d",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    margin: "0 auto 18px",
    fontSize: "16px",
    fontWeight: "700",
    fontFamily: theme.font.display,
    boxShadow: "0 0 30px rgba(0,229,160,0.55)",
  },

  title: {
    color: theme.colors.text,
    fontFamily: theme.font.display,
    fontSize: "28px",
    fontWeight: "600",
    letterSpacing: "-0.01em",
    textAlign: "center",
    margin: "0 0 6px",
  },

  subtitle: {
    color: theme.colors.textMuted,
    fontSize: "14px",
    fontFamily: theme.font.family,
    textAlign: "center",
    margin: "0 0 30px",
  },

  form: {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  },

  field: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },

  label: {
    color: "#b9c0cf",
    fontSize: "12.5px",
    fontWeight: "500",
    fontFamily: theme.font.family,
  },

  input: {
    width: "100%",
    height: "46px",
    padding: "0 14px",
    boxSizing: "border-box",
    borderRadius: theme.radius.sm,
    border: `1px solid ${theme.colors.border}`,
    background: "rgba(0,0,0,0.4)",
    color: theme.colors.text,
    fontSize: "14px",
    fontFamily: theme.font.family,
    outline: "none",
  },

  error: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    padding: "11px 12px",
    borderRadius: theme.radius.sm,
    border: "1px solid rgba(255,77,106,0.35)",
    background: "rgba(255,77,106,0.12)",
    color: theme.colors.red,
    fontSize: "13px",
    fontFamily: theme.font.family,
  },

  errorIcon: {
    width: "18px",
    height: "18px",
    borderRadius: "50%",
    background: theme.colors.red,
    color: "#ffffff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "700",
    flexShrink: 0,
  },

  button: {
    width: "100%",
    height: "46px",
    border: "none",
    borderRadius: theme.radius.sm,
    background: `linear-gradient(135deg, ${theme.colors.mint}, ${theme.colors.mintDeep})`,
    color: "#04140d",
    fontSize: "14.5px",
    fontWeight: "700",
    fontFamily: theme.font.family,
    cursor: "pointer",
    marginTop: "4px",
    boxShadow: "0 0 40px rgba(0,229,160,0.4)",
  },

  buttonDisabled: {
    opacity: 0.7,
    cursor: "not-allowed",
  },

  divider: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    margin: "26px 0 18px",
  },

  line: {
    flex: 1,
    height: "1px",
    background: theme.colors.border,
  },

  or: {
    color: theme.colors.textMuted,
    fontSize: "12px",
    fontFamily: theme.font.mono,
  },

  switchText: {
    color: theme.colors.textMuted,
    fontSize: "13px",
    fontFamily: theme.font.family,
    textAlign: "center",
    margin: 0,
  },

  switchLink: {
    color: theme.colors.mint,
    cursor: "pointer",
    fontWeight: "700",
  },
};

export default Register;
