import { useState } from "react";
import { API_BASE_URL } from "../api";

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

    console.log("REGISTER: Sending request...");
    console.log("REGISTER: Email:", email);

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

      console.log("REGISTER: Status:", response.status);

      let data;

      try {
        data = await response.json();
      } catch {
        data = {};
      }

      console.log("REGISTER: Response:", data);

      if (!response.ok) {
        throw new Error(
          data?.detail ||
            `Registration failed (${response.status})`
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
      console.error("REGISTER ERROR:", err);

      if (
        err instanceof TypeError &&
        err.message.toLowerCase().includes("fetch")
      ) {
        setError(
          "Cannot connect to backend. Make sure FastAPI is running on port 8000."
        );
      } else {
        setError(err.message || "Registration failed");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.logo}>TX</div>

        <h1 style={styles.title}>Tradexa</h1>

        <p style={styles.subtitle}>
          Create your trading account
        </p>

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
              placeholder="Enter your email"
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
          <span
            style={styles.switchLink}
            onClick={onSwitchToLogin}
          >
            Log in
          </span>
        </p>
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: "100vh",
    width: "100%",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    background:
      "radial-gradient(circle at top, #12182b 0%, #080a0f 45%, #050608 100%)",
    padding: "20px",
    boxSizing: "border-box",
  },

  card: {
    width: "380px",
    maxWidth: "100%",
    background: "#11141b",
    border: "1px solid #292e3a",
    borderRadius: "16px",
    padding: "38px",
    boxSizing: "border-box",
    boxShadow: "0 20px 60px rgba(0,0,0,0.45)",
  },

  logo: {
    width: "48px",
    height: "48px",
    borderRadius: "12px",
    background: "linear-gradient(135deg, #5865f2, #7048ff)",
    color: "#ffffff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    margin: "0 auto 18px",
    fontSize: "17px",
    fontWeight: "800",
  },

  title: {
    color: "#ffffff",
    fontSize: "30px",
    fontWeight: "700",
    textAlign: "center",
    margin: "0 0 6px",
  },

  subtitle: {
    color: "#8c94a6",
    fontSize: "14px",
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
    fontSize: "13px",
    fontWeight: "600",
  },

  input: {
    width: "100%",
    height: "46px",
    padding: "0 14px",
    boxSizing: "border-box",
    borderRadius: "8px",
    border: "1px solid #343a48",
    background: "#0c0f14",
    color: "#ffffff",
    fontSize: "14px",
    outline: "none",
  },

  error: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    padding: "11px 12px",
    borderRadius: "8px",
    border: "1px solid #7d2932",
    background: "#32161b",
    color: "#ff737d",
    fontSize: "13px",
  },

  errorIcon: {
    width: "18px",
    height: "18px",
    borderRadius: "50%",
    background: "#ff4d5a",
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
    borderRadius: "8px",
    background: "linear-gradient(135deg, #5665f2, #6948ee)",
    color: "#ffffff",
    fontSize: "14px",
    fontWeight: "700",
    cursor: "pointer",
    marginTop: "4px",
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
    background: "#292e38",
  },

  or: {
    color: "#8c94a6",
    fontSize: "12px",
  },

  switchText: {
    color: "#858d9e",
    fontSize: "13px",
    textAlign: "center",
    margin: 0,
  },

  switchLink: {
    color: "#6677ff",
    cursor: "pointer",
    fontWeight: "700",
  },
};

export default Register;
