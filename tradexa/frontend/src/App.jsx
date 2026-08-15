import { useState } from "react";

import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Journal from "./pages/Journal";
import Calendar from "./pages/Calendar";
import PersonalPerformance from "./pages/PersonalPerformance";
import CommunityPerformance from "./pages/CommunityPerformance";
import Settings from "./pages/Settings";
import Learning from "./pages/Learning";
import Coach from "./pages/Coach";
import MarketIntelligence from "./pages/MarketIntelligence";
import TradexaIntelligence from "./pages/TradexaIntelligence";

import "./App.css";

function App() {
  const [page, setPage] = useState("login");
  const [user, setUser] = useState(null);

  // ============================================
  // LOGIN SUCCESS
  // ============================================
  const handleLoginSuccess = (loginData) => {
    console.log("APP: Login successful");
    console.log("APP: loginData =", loginData);

    if (!loginData) {
      console.error("APP: Login data missing");
      return;
    }

    // Login.jsx currently sends the USER object directly.
    // This also supports { user, token } format.
    const loggedInUser = loginData.user
      ? loginData.user
      : loginData;

    const token =
      loginData.token ||
      localStorage.getItem("tradexa_token");

    if (!loggedInUser || !loggedInUser.id) {
      console.error("APP: User data missing");
      console.error("APP: received =", loginData);
      return;
    }

    console.log("APP: Logged in user =", loggedInUser);
    console.log(
      "APP: Account ID =",
      loggedInUser.account_id
    );

    // Save login information
    if (token) {
      localStorage.setItem("tradexa_token", token);
    }

    localStorage.setItem(
      "tradexa_user",
      JSON.stringify(loggedInUser)
    );

    // Update React state
    setUser(loggedInUser);
    setPage("dashboard");

    console.log("APP: User state updated");
    console.log("APP: Changing page to dashboard");
  };

  // ============================================
  // LOGOUT
  // ============================================
  const handleLogout = () => {
    console.log("APP: Logging out");

    localStorage.removeItem("tradexa_token");
    localStorage.removeItem("tradexa_user");

    setUser(null);
    setPage("login");
  };

  // ============================================
  // NAVIGATION
  // ============================================
  const navigate = (target) => {
    console.log("APP: Navigate →", target);
    setPage(target);
  };

  // ============================================
  // REGISTER
  // ============================================
  if (page === "register" && !user) {
    return (
      <Register
        onSwitchToLogin={() => setPage("login")}
      />
    );
  }

  // ============================================
  // LOGIN
  // ============================================
  if (page === "login" && !user) {
    return (
      <Login
        onSwitchToRegister={() => setPage("register")}
        onLoginSuccess={handleLoginSuccess}
      />
    );
  }

  // ============================================
  // SECURITY CHECK
  // ============================================
  if (!user) {
    return (
      <Login
        onSwitchToRegister={() => setPage("register")}
        onLoginSuccess={handleLoginSuccess}
      />
    );
  }

  // ============================================
  // TRADEXA INTELLIGENCE
  // ============================================
  if (page === "intelligence") {
    return (
      <TradexaIntelligence
        user={user}
        onLogout={handleLogout}
        onNavigate={navigate}
      />
    );
  }

  // ============================================
  // MARKET INTELLIGENCE
  // ============================================
  if (page === "market") {
    return (
      <MarketIntelligence
        user={user}
        onLogout={handleLogout}
        onNavigate={navigate}
      />
    );
  }

  // ============================================
  // COACH
  // ============================================
  if (page === "coach") {
    return (
      <Coach
        user={user}
        onLogout={handleLogout}
        onNavigate={navigate}
      />
    );
  }

  // ============================================
  // LEARNING
  // ============================================
  if (page === "learning") {
    return (
      <Learning
        user={user}
        onLogout={handleLogout}
        onNavigate={navigate}
      />
    );
  }

  // ============================================
  // SETTINGS
  // ============================================
  if (page === "settings") {
    return (
      <Settings
        user={user}
        onBack={() => setPage("dashboard")}
      />
    );
  }

  // ============================================
  // CALENDAR
  // ============================================
  if (page === "calendar") {
    return (
      <Calendar
        user={user}
        onLogout={handleLogout}
        onNavigate={navigate}
      />
    );
  }

  // ============================================
  // COMMUNITY PERFORMANCE
  // ============================================
  if (page === "community") {
    return (
      <CommunityPerformance
        onBack={() => setPage("performance")}
      />
    );
  }

  // ============================================
  // PERSONAL PERFORMANCE
  // ============================================
  if (page === "performance") {
    return (
      <PersonalPerformance
        user={user}
        onBack={() => setPage("dashboard")}
        onGoToCommunity={() => setPage("community")}
      />
    );
  }

  // ============================================
  // JOURNAL
  // ============================================
  if (page === "journal") {
    return (
      <Journal
        user={user}
        onLogout={handleLogout}
        onNavigate={navigate}
      />
    );
  }

  // ============================================
  // DASHBOARD
  // ============================================
  if (page === "dashboard") {
    return (
      <Dashboard
        user={user}
        onLogout={handleLogout}
        onNavigate={navigate}
      />
    );
  }

  // ============================================
  // FALLBACK
  // ============================================
  return (
    <Login
      onSwitchToRegister={() => setPage("register")}
      onLoginSuccess={handleLoginSuccess}
    />
  );
}

export default App;