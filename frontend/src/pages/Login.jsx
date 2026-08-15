import { useState } from "react";
import { API_BASE_URL } from "../api";

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

    console.log("LOGIN: Sending request...");
    console.log("LOGIN: Email:", email);

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

      console.log(
        "LOGIN: Status:",
        response.status
      );

      const data = await response.json();

      console.log(
        "LOGIN: Response:",
        data
      );

      // ---------------------------------------------
      // LOGIN FAILED
      // ---------------------------------------------

      if (!response.ok) {

        const message =
          typeof data.detail === "string"
            ? data.detail
            : "Invalid email or password";

        throw new Error(message);
      }

      // ---------------------------------------------
      // CHECK TOKEN
      // ---------------------------------------------

      if (!data.token) {

        throw new Error(
          "Login successful but token was not received."
        );
      }

      // ---------------------------------------------
      // CHECK USER
      // ---------------------------------------------

      if (!data.user) {

        throw new Error(
          "Login successful but user data was not received."
        );
      }

      console.log(
        "LOGIN: Login successful"
      );

      console.log(
        "LOGIN: User:",
        data.user
      );

      // ---------------------------------------------
      // SAVE TOKEN
      // ---------------------------------------------

      localStorage.setItem(
        "tradexa_token",
        data.token
      );

      // ---------------------------------------------
      // SAVE USER
      // ---------------------------------------------

      localStorage.setItem(
        "tradexa_user",
        JSON.stringify(data.user)
      );

      console.log(
        "LOGIN: Token saved"
      );

      console.log(
        "LOGIN: User saved"
      );

      // ---------------------------------------------
      // IMPORTANT
      // ---------------------------------------------

      console.log(
        "LOGIN: Calling onLoginSuccess..."
      );

      onLoginSuccess(data.user);

      console.log(
        "LOGIN: onLoginSuccess completed"
      );

    } catch (err) {

      console.error(
        "LOGIN ERROR:",
        err
      );

      setError(
        err.message || "Login failed"
      );

    } finally {

      setLoading(false);
    }
  };

  return (

    <div style={styles.container}>

      <div style={styles.card}>

        {/* LOGO */}

        <div style={styles.logo}>
          TX
        </div>

        <h1 style={styles.title}>
          Tradexa
        </h1>

        <p style={styles.subtitle}>
          Log in to your trading account
        </p>

        {/* FORM */}

        <form
          onSubmit={handleLogin}
          style={styles.form}
        >

          {/* EMAIL */}

          <div>

            <label style={styles.label}>
              Email
            </label>

            <input
              type="email"
              value={email}
              onChange={(e) =>
                setEmail(e.target.value)
              }
              placeholder="Enter your email"
              style={styles.input}
              required
            />

          </div>

          {/* PASSWORD */}

          <div>

            <label style={styles.label}>
              Password
            </label>

            <input
              type="password"
              value={password}
              onChange={(e) =>
                setPassword(e.target.value)
              }
              placeholder="Enter your password"
              style={styles.input}
              required
            />

          </div>

          {/* ERROR */}

          {error && (

            <div style={styles.error}>

              <span>
                ⚠
              </span>

              <span>
                {error}
              </span>

            </div>

          )}

          {/* LOGIN BUTTON */}

          <button
            type="submit"
            disabled={loading}
            style={{
              ...styles.button,
              opacity: loading ? 0.7 : 1
            }}
          >

            {loading
              ? "Logging in..."
              : "Log In"
            }

          </button>

        </form>

        {/* REGISTER */}

        <p style={styles.registerText}>

          Don't have an account?{" "}

          <span
            style={styles.registerLink}
            onClick={onSwitchToRegister}
          >
            Create account
          </span>

        </p>

      </div>

    </div>
  );
}


// ==================================================
// STYLES
// ==================================================

const styles = {

  container: {
    minHeight: "100vh",
    width: "100%",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#080a0f"
  },

  card: {
    width: "340px",
    padding: "40px",
    borderRadius: "16px",
    backgroundColor: "#11141b",
    border: "1px solid #252a35",
    boxShadow:
      "0 10px 40px rgba(0,0,0,0.5)"
  },

  logo: {
    width: "48px",
    height: "48px",
    margin: "0 auto 18px",
    borderRadius: "12px",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#635bff",
    color: "#ffffff",
    fontSize: "16px",
    fontWeight: "700"
  },

  title: {
    margin: 0,
    color: "#ffffff",
    fontSize: "30px",
    textAlign: "center",
    fontWeight: "700"
  },

  subtitle: {
    marginTop: "8px",
    marginBottom: "30px",
    color: "#8b93a5",
    textAlign: "center",
    fontSize: "14px"
  },

  form: {
    display: "flex",
    flexDirection: "column",
    gap: "18px"
  },

  label: {
    display: "block",
    marginBottom: "7px",
    color: "#cbd1dc",
    fontSize: "13px",
    fontWeight: "600"
  },

  input: {
    width: "100%",
    boxSizing: "border-box",
    padding: "13px",
    borderRadius: "8px",
    border: "1px solid #343a47",
    backgroundColor: "#0c0f14",
    color: "#ffffff",
    fontSize: "14px",
    outline: "none"
  },

  error: {
    display: "flex",
    gap: "8px",
    alignItems: "center",
    padding: "10px",
    borderRadius: "8px",
    backgroundColor: "#32161b",
    border: "1px solid #63232d",
    color: "#ff6b6b",
    fontSize: "13px"
  },

  button: {
    width: "100%",
    padding: "13px",
    border: "none",
    borderRadius: "8px",
    backgroundColor: "#5755e8",
    color: "#ffffff",
    fontSize: "15px",
    fontWeight: "700",
    cursor: "pointer"
  },

  registerText: {
    marginTop: "25px",
    textAlign: "center",
    color: "#858d9d",
    fontSize: "13px"
  },

  registerLink: {
    color: "#6674ff",
    fontWeight: "600",
    cursor: "pointer"
  }

};

export default Login;
