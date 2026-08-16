import { useState } from "react";
import { API_BASE_URL } from "../api";
import Scene3DBackground from "../components/Scene3DBackground";
import { theme } from "../theme";

function Login({
  onSwitchToRegister,
  onLoginSuccess
}) {

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {

    e.preventDefault();

    setError("");
    setLoading(true);

    try {

      const response = await fetch(
        `${API_BASE_URL}/auth/login`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            email: email.trim(),
            password: password
          })
        }
      );

      const data = await response.json();

      if (!response.ok) {
        const message =
          typeof data.detail === "string"
            ? data.detail
            : "Invalid email or password";
        throw new Error(message);
      }

      if (!data.token) {
        throw new Error("Login successful but token was not received.");
      }

      if (!data.user) {
        throw new Error("Login successful but user data was not received.");
      }

      localStorage.setItem("tradexa_token", data.token);
      localStorage.setItem("tradexa_user", JSON.stringify(data.user));

      onLoginSuccess(data.user);

    } catch (err) {
      setError(err.message || "Login failed");
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
          <p style={styles.subtitle}>Log in to your trading account</p>

          <form onSubmit={handleLogin} style={styles.form}>

            <div>
              <label style={styles.label}>Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                style={styles.input}
                required
              />
            </div>

            <div>
              <label style={styles.label}>Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                style={styles.input}
                required
              />
            </div>

            {error && (
              <div style={styles.error}>
                <span>⚠</span>
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{ ...styles.button, opacity: loading ? 0.7 : 1 }}
            >
              {loading ? "Logging in..." : "Log In"}
            </button>

          </form>

          <p style={styles.registerText}>
            Don't have an account?{" "}
            <span style={styles.registerLink} onClick={onSwitchToRegister}>
              Create account
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
    padding: "24px",
  },

  card: {
    width: "380px",
    maxWidth: "100%",
    padding: "44px 40px",
    borderRadius: theme.radius.lg,
    background: "rgba(8,10,14,0.55)",
    backdropFilter: "blur(24px) saturate(140%)",
    WebkitBackdropFilter: "blur(24px) saturate(140%)",
    border: `1px solid ${theme.colors.border}`,
    boxShadow: "0 40px 100px rgba(0,0,0,0.6), 0 0 0 1px rgba(0,229,160,0.06), inset 0 1px 0 rgba(255,255,255,0.06)",
  },

  logo: {
    width: "44px",
    height: "44px",
    margin: "0 auto 20px",
    borderRadius: "12px",
    background: `linear-gradient(135deg, ${theme.colors.mint}, ${theme.colors.mintDeep})`,
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    fontFamily: theme.font.display,
    fontWeight: "700",
    fontSize: "15px",
    color: "#04140d",
    boxShadow: "0 0 30px rgba(0,229,160,0.55)",
  },

  title: {
    margin: 0,
    color: theme.colors.text,
    fontFamily: theme.font.display,
    fontSize: "26px",
    textAlign: "center",
    fontWeight: "600",
    letterSpacing: "-0.01em",
  },

  subtitle: {
    marginTop: "8px",
    marginBottom: "30px",
    color: theme.colors.textMuted,
    textAlign: "center",
    fontSize: "13.5px",
    fontFamily: theme.font.family,
  },

  form: {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  },

  label: {
    display: "block",
    marginBottom: "7px",
    color: "#b7bdc9",
    fontSize: "12.5px",
    fontWeight: "500",
    fontFamily: theme.font.family,
  },

  input: {
    width: "100%",
    boxSizing: "border-box",
    padding: "12px 14px",
    borderRadius: theme.radius.sm,
    border: `1px solid ${theme.colors.border}`,
    backgroundColor: "rgba(0,0,0,0.4)",
    color: theme.colors.text,
    fontSize: "14px",
    fontFamily: theme.font.family,
    outline: "none",
  },

  error: {
    display: "flex",
    gap: "8px",
    alignItems: "center",
    padding: "10px",
    borderRadius: theme.radius.sm,
    backgroundColor: "rgba(255,77,106,0.12)",
    border: "1px solid rgba(255,77,106,0.35)",
    color: theme.colors.red,
    fontSize: "13px",
    fontFamily: theme.font.family,
  },

  button: {
    marginTop: "6px",
    width: "100%",
    padding: "13px",
    border: "none",
    borderRadius: theme.radius.sm,
    background: `linear-gradient(135deg, ${theme.colors.mint}, ${theme.colors.mintDeep})`,
    color: "#04140d",
    fontSize: "14.5px",
    fontWeight: "700",
    fontFamily: theme.font.family,
    cursor: "pointer",
    boxShadow: "0 0 40px rgba(0,229,160,0.4)",
  },

  registerText: {
    marginTop: "22px",
    textAlign: "center",
    color: theme.colors.textMuted,
    fontSize: "12.5px",
    fontFamily: theme.font.family,
  },

  registerLink: {
    color: theme.colors.mint,
    fontWeight: "600",
    cursor: "pointer",
  },
};

export default Login;
