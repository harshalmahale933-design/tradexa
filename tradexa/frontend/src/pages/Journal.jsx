import { useState, useEffect } from "react";
import { API_BASE_URL } from "../api";
import Sidebar from "../components/Sidebar";
import { theme } from "../theme";

const EMOTIONS = [
  "Confident",
  "Neutral",
  "Fear",
  "Greed",
  "Revenge",
  "Tired",
];

const SETUP_TAGS = [
  "Liquidity Sweep",
  "MSS",
  "FVG",
  "Order Block",
  "BOS",
  "CHOCH",
  "Breakout",
  "Trend Continuation",
];

const MISTAKE_TAGS = [
  "FOMO",
  "Early Entry",
  "Overtrading",
  "Ignored HTF",
  "Poor RR",
  "Revenge Trade",
  "Late Entry",
  "Moved Stop Loss",
];

const emptyForm = {
  trade_date: "",
  asset: "",
  direction: "buy",
  trading_session: "London",
  strategy: "",
  entry_price: "",
  stop_loss: "",
  take_profit: "",
  exit_price: "",
  position_size: "",
  risk_amount: "",
  pl_amount: "",
  execution_rating: 0,
  emotion: "",
  setup_tags: [],
  mistake_tags: [],
  trade_notes: "",
  screenshot: null,
};

function Journal({ user, onLogout, onNavigate }) {
  const [trades, setTrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
 

  const [form, setForm] = useState(emptyForm);

  const fetchTrades = async () => {
    try {
      const res = await fetch(
        `${API_BASE_URL}/trades?account_id=${user.account_id}`
      );

      if (!res.ok) {
        throw new Error("Failed to fetch trades");
      }

      setTrades(await res.json());
    } catch (err) {
      console.error("Error fetching trades:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrades();
  }, [user.account_id]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const toggleTag = (field, tag) => {
    setForm((prev) => {
      const currentTags = prev[field];

      if (currentTags.includes(tag)) {
        return {
          ...prev,
          [field]: currentTags.filter((item) => item !== tag),
        };
      }

      return {
        ...prev,
        [field]: [...currentTags, tag],
      };
    });
  };

  const plannedRR = (() => {
    const entry = parseFloat(form.entry_price);
    const stop = parseFloat(form.stop_loss);
    const target = parseFloat(form.take_profit);

    if (
      !Number.isFinite(entry) ||
      !Number.isFinite(stop) ||
      !Number.isFinite(target)
    ) {
      return null;
    }

    const risk = Math.abs(entry - stop);
    const reward = Math.abs(target - entry);

    if (risk === 0) {
      return null;
    }

    return reward / risk;
  })();

  const realizedR = (() => {
    const pl = parseFloat(form.pl_amount);
    const risk = parseFloat(form.risk_amount);

    if (!Number.isFinite(pl) || !Number.isFinite(risk) || risk === 0) {
      return null;
    }

    return pl / risk;
  })();

  const tradeResult = (() => {
    const pl = parseFloat(form.pl_amount);

    if (!Number.isFinite(pl)) {
      return "BREAKEVEN";
    }

    if (pl > 0) return "WIN";
    if (pl < 0) return "LOSS";

    return "BREAKEVEN";
  })();

  const resetForm = () => {
    setForm({
      ...emptyForm,
      setup_tags: [],
      mistake_tags: [],
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (saving) return;

    try {
      setSaving(true);

      const payload = {
        account_id: user.account_id,
        trade_date: form.trade_date,
        asset: form.asset,
        direction: form.direction,
        entry_price: parseFloat(form.entry_price),
        stop_loss: parseFloat(form.stop_loss),
        take_profit: parseFloat(form.take_profit),
        position_size: parseFloat(form.position_size),
        risk_amount: parseFloat(form.risk_amount),

        trading_session: form.trading_session,
        strategy: form.strategy || null,

        // Keep existing backend "setup" field.
        // Store the selected setup tags here as a readable string.
        setup: form.setup_tags.length
          ? form.setup_tags.join(", ")
          : null,

        emotion: form.emotion || null,

        setup_tags: form.setup_tags.length
          ? form.setup_tags.join(", ")
          : null,

        mistake_tags: form.mistake_tags.length
          ? form.mistake_tags.join(", ")
          : null,

        trade_notes: form.trade_notes || null,
      };

      const res = await fetch(`${API_BASE_URL}/trades`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText || "Failed to add trade");
      }

      resetForm();
      setShowForm(false);
      await fetchTrades();
    } catch (err) {
      console.error(err);
      alert("Error adding trade: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleClose = async (tradeId) => {
    const exitPrice = prompt("Enter exit price:");

    if (!exitPrice) return;

    const parsedExitPrice = parseFloat(exitPrice);

    if (!Number.isFinite(parsedExitPrice)) {
      alert("Please enter a valid exit price.");
      return;
    }

    try {
      const res = await fetch(
        `${API_BASE_URL}/trades/${tradeId}/close`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            exit_price: parsedExitPrice,
          }),
        }
      );

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText || "Failed to close trade");
      }

      fetchTrades();
    } catch (err) {
      alert("Error closing trade: " + err.message);
    }
  };

  return (
    <div style={styles.layout}>
      <Sidebar
        activePage="journal"
        onNavigate={onNavigate}
        user={user}
        onLogout={onLogout}
      />

      <div style={styles.main}>
        {/* HEADER */}
        <div style={styles.header}>
          <div>
            <h1 style={styles.pageTitle}>Trade Journal</h1>
            <p style={styles.pageSubtitle}>
              Log, track, and review every trade
            </p>
          </div>

          <div style={styles.headerButtons}>
            <button
              style={styles.secondaryBtn}
              onClick={() => onNavigate("calendar")}
            >
              Calendar View
            </button>

            <button
              style={styles.primaryBtn}
              onClick={() => setShowForm((prev) => !prev)}
            >
              {showForm ? "Cancel" : "+ Add Trade"}
            </button>
          </div>
        </div>

        {/* ADD TRADE FORM */}
        {showForm && (
          <form onSubmit={handleSubmit} style={styles.formCard}>
            <div style={styles.formTitleRow}>
              <div>
                <h2 style={styles.formTitle}>Add New Trade</h2>
                <p style={styles.formSubtitle}>
                  Record your trade setup, execution, risk and review.
                </p>
              </div>
            </div>

            {/* 1. TRADE SETUP */}
            <FormSection
              number="1"
              title="Trade Setup"
              subtitle="Basic information about the trade."
            >
              <div style={styles.formGrid}>
                <Field label="Trade Date">
                  <input
                    type="date"
                    name="trade_date"
                    value={form.trade_date}
                    onChange={handleChange}
                    style={styles.input}
                    required
                  />
                </Field>

                <Field label="Account">
                  <input
                    type="text"
                    value="Current Trading Account"
                    style={styles.input}
                    disabled
                  />
                </Field>

                <Field label="Pair / Symbol">
                  <input
                    type="text"
                    name="asset"
                    placeholder="e.g. XAUUSD"
                    value={form.asset}
                    onChange={handleChange}
                    style={styles.input}
                    required
                  />
                </Field>

                <Field label="Direction">
                  <select
                    name="direction"
                    value={form.direction}
                    onChange={handleChange}
                    style={styles.input}
                  >
                    <option value="buy">Buy</option>
                    <option value="sell">Sell</option>
                  </select>
                </Field>

                <Field label="Trading Session">
                  <select
                    name="trading_session"
                    value={form.trading_session}
                    onChange={handleChange}
                    style={styles.input}
                  >
                    <option value="London">London</option>
                    <option value="New York">New York</option>
                    <option value="Asian">Asian</option>
                    <option value="London + New York">
                      London + New York
                    </option>
                    <option value="Other">Other</option>
                  </select>
                </Field>

                <Field label="Strategy">
                  <input
                    type="text"
                    name="strategy"
                    placeholder="e.g. Liquidity Sweep + MSS"
                    value={form.strategy}
                    onChange={handleChange}
                    style={styles.input}
                  />
                </Field>
              </div>
            </FormSection>

            {/* 2. TRADE LEVELS */}
            <FormSection
              number="2"
              title="Trade Levels"
              subtitle="Enter the prices used for the trade."
            >
              <div style={styles.formGrid}>
                <Field
                  label="Entry Price"
                  help="Price where you entered."
                >
                  <input
                    type="number"
                    step="any"
                    name="entry_price"
                    placeholder="e.g. 2350.50"
                    value={form.entry_price}
                    onChange={handleChange}
                    style={styles.input}
                    required
                  />
                </Field>

                <Field
                  label="Stop Loss"
                  help="Your invalidation / stop-loss price."
                >
                  <input
                    type="number"
                    step="any"
                    name="stop_loss"
                    placeholder="e.g. 2345.00"
                    value={form.stop_loss}
                    onChange={handleChange}
                    style={styles.input}
                    required
                  />
                </Field>

                <Field
                  label="Take Profit"
                  help="Your planned target price."
                >
                  <input
                    type="number"
                    step="any"
                    name="take_profit"
                    placeholder="e.g. 2361.50"
                    value={form.take_profit}
                    onChange={handleChange}
                    style={styles.input}
                    required
                  />
                </Field>

                <Field
                  label="Exit Price"
                  help="Actual price where the trade closed."
                >
                  <input
                    type="number"
                    step="any"
                    name="exit_price"
                    placeholder="e.g. 2360.80"
                    value={form.exit_price}
                    onChange={handleChange}
                    style={styles.input}
                  />
                </Field>

                <Field label="Position Size" help="Lots / quantity.">
                  <input
                    type="number"
                    step="any"
                    name="position_size"
                    placeholder="e.g. 0.50"
                    value={form.position_size}
                    onChange={handleChange}
                    style={styles.input}
                    required
                  />
                </Field>

                <Field
                  label="Risk Amount ($)"
                  help="Money risked on the trade. Enter manually."
                >
                  <input
                    type="number"
                    step="any"
                    min="0"
                    name="risk_amount"
                    placeholder="e.g. 25"
                    value={form.risk_amount}
                    onChange={handleChange}
                    style={styles.input}
                    required
                  />
                </Field>
              </div>

              <div style={styles.calculationGrid}>
                <CalculationCard
                  label="Planned Risk : Reward"
                  value={
                    plannedRR !== null
                      ? `1:${plannedRR.toFixed(2)}`
                      : "—"
                  }
                  description="Based on Entry, SL and TP."
                />

                <CalculationCard
                  label="Realized R"
                  value={
                    realizedR !== null
                      ? `${realizedR >= 0 ? "+" : ""}${realizedR.toFixed(2)}R`
                      : "+0.00R"
                  }
                  description="P/L divided by risk."
                />

                <CalculationCard
                  label="Trade Result"
                  value={tradeResult}
                  description="Based on recorded P/L."
                  result={tradeResult}
                />
              </div>
            </FormSection>

            {/* 3. TRADE RESULT */}
            <FormSection
              number="3"
              title="Trade Result"
              subtitle="Record the final result after closing the trade."
            >
              <div style={styles.singleField}>
                <Field
                  label="Realized Profit / Loss ($)"
                  help="Final realized result of the trade."
                >
                  <input
                    type="number"
                    step="any"
                    name="pl_amount"
                    placeholder="e.g. 50 or -25"
                    value={form.pl_amount}
                    onChange={handleChange}
                    style={styles.input}
                  />
                </Field>
              </div>
            </FormSection>

            {/* 4. SCREENSHOT */}
            <FormSection
              number="4"
              title="Chart Screenshot"
              subtitle="Save the chart setup with your journal entry."
            >
              <div style={styles.uploadBox}>
                <label style={styles.uploadLabel}>
                  <span style={styles.uploadTitle}>Trade Screenshot</span>

                  <input
                    type="file"
                    name="screenshot"
                    accept="image/*"
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        screenshot: e.target.files?.[0] || null,
                      }))
                    }
                    style={styles.fileInput}
                  />

                  {form.screenshot ? (
                    <span style={styles.fileName}>
                      {form.screenshot.name}
                    </span>
                  ) : (
                    <span style={styles.fileName}>No file chosen</span>
                  )}
                </label>

                <p style={styles.warningText}>
                  Screenshot upload storage will be connected separately.
                </p>
              </div>
            </FormSection>

            {/* 5. RATING */}
            <FormSection
              number="5"
              title="Execution Rating"
              subtitle="How well did you execute the plan?"
            >
              <div style={styles.ratingBox}>
                {[1, 2, 3, 4, 5].map((rating) => (
                  <button
                    key={rating}
                    type="button"
                    onClick={() =>
                      setForm((prev) => ({
                        ...prev,
                        execution_rating: rating,
                      }))
                    }
                    style={{
                      ...styles.starButton,
                      color:
                        rating <= form.execution_rating
                          ? theme.colors.primary
                          : theme.colors.textFaint,
                    }}
                  >
                    ★
                  </button>
                ))}

                <span style={styles.ratingText}>
                  {form.execution_rating
                    ? `${form.execution_rating}/5`
                    : "Not rated"}
                </span>
              </div>
            </FormSection>

            {/* 6. EMOTION */}
            <FormSection
              number="6"
              title="Emotion"
              subtitle="How did you feel during the trade?"
            >
              <div style={styles.optionWrap}>
                {EMOTIONS.map((emotion) => (
                  <button
                    key={emotion}
                    type="button"
                    onClick={() =>
                      setForm((prev) => ({
                        ...prev,
                        emotion,
                      }))
                    }
                    style={{
                      ...styles.optionButton,
                      ...(form.emotion === emotion
                        ? styles.optionButtonActive
                        : {}),
                    }}
                  >
                    {emotion}
                  </button>
                ))}
              </div>
            </FormSection>

            {/* 7. SETUP TAGS */}
            <FormSection
              number="7"
              title="Setup Tags"
              subtitle="Select the setup confirmations used for this trade."
            >
              <div style={styles.optionWrap}>
                {SETUP_TAGS.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleTag("setup_tags", tag)}
                    style={{
                      ...styles.optionButton,
                      ...(form.setup_tags.includes(tag)
                        ? styles.optionButtonActive
                        : {}),
                    }}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </FormSection>

            {/* 8. MISTAKE TAGS */}
            <FormSection
              number="8"
              title="Mistake Tags"
              subtitle="Select any mistakes made during execution."
            >
              <div style={styles.optionWrap}>
                {MISTAKE_TAGS.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleTag("mistake_tags", tag)}
                    style={{
                      ...styles.optionButton,
                      ...(form.mistake_tags.includes(tag)
                        ? styles.mistakeButtonActive
                        : {}),
                    }}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </FormSection>

            {/* 9. NOTES */}
            <FormSection
              number="9"
              title="Trade Notes"
              subtitle="Record your reasoning, execution review and lesson learned."
            >
              <textarea
                name="trade_notes"
                value={form.trade_notes}
                onChange={handleChange}
                placeholder="Why did you take this trade? What happened? What did you learn?"
                style={styles.textarea}
                rows={6}
              />
            </FormSection>

            {/* SAVE */}
            <div style={styles.formFooter}>
              <button
                type="button"
                style={styles.cancelBtn}
                onClick={() => {
                  resetForm();
                  setShowForm(false);
                }}
              >
                Cancel
              </button>

              <button
                type="submit"
                style={styles.saveBtn}
                disabled={saving}
              >
                {saving ? "Saving Trade..." : "Save Trade"}
              </button>
            </div>
          </form>
        )}

        {/* TRADES TABLE */}
        {loading ? (
          <p style={styles.emptyText}>Loading trades...</p>
        ) : trades.length === 0 ? (
          <div style={styles.emptyState}>
            <p style={styles.emptyTitle}>No trades yet</p>
            <p style={styles.emptyText}>
              Click "+ Add Trade" to log your first one.
            </p>
          </div>
        ) : (
          <div style={styles.tableWrap}>
            <table style={styles.table}>
              <thead>
                <tr>
                  {[
                    "Date",
                    "Asset",
                    "Direction",
                    "Entry",
                    "Exit",
                    "RR",
                    "P/L",
                    "Result",
                    "",
                  ].map((h) => (
                    <th key={h} style={styles.th}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {trades.map((t) => (
                  <tr key={t.id} style={styles.tr}>
                    <td style={styles.td}>{t.trade_date}</td>

                    <td
                      style={{
                        ...styles.td,
                        fontWeight: 600,
                      }}
                    >
                      {t.asset}
                    </td>

                    <td style={styles.td}>
                      <span
                        style={{
                          ...styles.dirBadge,
                          color:
                            t.direction === "buy"
                              ? theme.colors.green
                              : theme.colors.red,
                          backgroundColor:
                            t.direction === "buy"
                              ? theme.colors.greenMuted
                              : theme.colors.redMuted,
                        }}
                      >
                        {t.direction}
                      </span>
                    </td>

                    <td style={styles.td}>{t.entry_price}</td>

                    <td style={styles.td}>
                      {t.exit_price ?? "—"}
                    </td>

                    <td style={styles.td}>
                      {t.realized_rr != null
                        ? `${Number(t.realized_rr).toFixed(2)}R`
                        : "—"}
                    </td>

                    <td
                      style={{
                        ...styles.td,
                        fontWeight: 700,
                        color:
                          Number(t.pl_amount) > 0
                            ? theme.colors.green
                            : Number(t.pl_amount) < 0
                            ? theme.colors.red
                            : theme.colors.text,
                      }}
                    >
                      {t.pl_amount != null
                        ? `$${Number(t.pl_amount).toFixed(2)}`
                        : "—"}
                    </td>

                    <td style={styles.td}>
                      <span
                        style={{
                          ...styles.resultBadge,
                          color:
                            t.trade_result === "win"
                              ? theme.colors.green
                              : t.trade_result === "loss"
                              ? theme.colors.red
                              : theme.colors.textMuted,
                          backgroundColor:
                            t.trade_result === "win"
                              ? theme.colors.greenMuted
                              : t.trade_result === "loss"
                              ? theme.colors.redMuted
                              : theme.colors.bgHover,
                        }}
                      >
                        {t.trade_result ?? "Open"}
                      </span>
                    </td>

                    <td style={styles.td}>
                      {!t.exit_price && (
                        <button
                          type="button"
                          style={styles.closeBtn}
                          onClick={() => handleClose(t.id)}
                        >
                          Close
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function FormSection({ number, title, subtitle, children }) {
  return (
    <section style={styles.section}>
      <div style={styles.sectionHeader}>
        <div style={styles.sectionNumber}>{number}</div>

        <div>
          <h3 style={styles.sectionTitle}>{title}</h3>
          <p style={styles.sectionSubtitle}>{subtitle}</p>
        </div>
      </div>

      {children}
    </section>
  );
}

function CalculationCard({ label, value, description, result }) {
  return (
    <div style={styles.calculationCard}>
      <span style={styles.calculationLabel}>{label}</span>

      <strong
        style={{
          ...styles.calculationValue,
          color:
            result === "WIN"
              ? theme.colors.green
              : result === "LOSS"
              ? theme.colors.red
              : theme.colors.text,
        }}
      >
        {value}
      </strong>

      <span style={styles.calculationDescription}>
        {description}
      </span>
    </div>
  );
}

function Field({ label, help, children }) {
  return (
    <div>
      <label style={styles.fieldLabel}>{label}</label>

      {children}

      {help && <p style={styles.helpText}>{help}</p>}
    </div>
  );
}

const styles = {
  layout: {
    display: "flex",
    backgroundColor: theme.colors.bg,
    minHeight: "100vh",
  },

  main: {
    flex: 1,
    padding: "32px 40px",
    maxWidth: "1200px",
    margin: "0 auto",
    width: "100%",
    boxSizing: "border-box",
  },

  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: "24px",
  },

  pageTitle: {
    color: theme.colors.text,
    fontSize: "22px",
    fontWeight: 700,
    letterSpacing: "-0.02em",
    margin: 0,
  },

  pageSubtitle: {
    color: theme.colors.textMuted,
    fontSize: "13.5px",
    marginTop: "4px",
  },

  headerButtons: {
    display: "flex",
    gap: "10px",
  },

  primaryBtn: {
    padding: "10px 18px",
    borderRadius: theme.radius.sm,
    border: "none",
    backgroundColor: theme.colors.primary,
    color: "#fff",
    fontWeight: 600,
    fontSize: "13px",
    cursor: "pointer",
  },

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

  formCard: {
    backgroundColor: theme.colors.bgCard,
    border: `1px solid ${theme.colors.border}`,
    borderRadius: theme.radius.md,
    padding: "26px",
    marginBottom: "24px",
  },

  formTitleRow: {
    marginBottom: "26px",
  },

  formTitle: {
    margin: 0,
    color: theme.colors.text,
    fontSize: "20px",
    fontWeight: 700,
  },

  formSubtitle: {
    color: theme.colors.textMuted,
    fontSize: "13px",
    marginTop: "5px",
  },

  section: {
    borderTop: `1px solid ${theme.colors.border}`,
    paddingTop: "24px",
    marginTop: "24px",
  },

  sectionHeader: {
    display: "flex",
    alignItems: "flex-start",
    gap: "12px",
    marginBottom: "18px",
  },

  sectionNumber: {
    width: "26px",
    height: "26px",
    borderRadius: "50%",
    backgroundColor: theme.colors.primary,
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "12px",
    fontWeight: 700,
    flexShrink: 0,
  },

  sectionTitle: {
    margin: 0,
    color: theme.colors.text,
    fontSize: "15px",
    fontWeight: 700,
  },

  sectionSubtitle: {
    margin: "4px 0 0",
    color: theme.colors.textMuted,
    fontSize: "12px",
  },

  formGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: "16px",
  },

  singleField: {
    maxWidth: "400px",
  },

  fieldLabel: {
    display: "block",
    color: theme.colors.textMuted,
    fontSize: "11.5px",
    fontWeight: 600,
    marginBottom: "6px",
  },

  input: {
    width: "100%",
    padding: "10px 12px",
    borderRadius: theme.radius.sm,
    border: `1px solid ${theme.colors.borderLight}`,
    backgroundColor: theme.colors.bg,
    color: theme.colors.text,
    fontSize: "13.5px",
    boxSizing: "border-box",
    outline: "none",
  },

  helpText: {
    color: theme.colors.textFaint,
    fontSize: "10.5px",
    margin: "5px 0 0",
  },

  calculationGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: "12px",
    marginTop: "20px",
  },

  calculationCard: {
    backgroundColor: theme.colors.bg,
    border: `1px solid ${theme.colors.border}`,
    borderRadius: theme.radius.sm,
    padding: "14px",
  },

  calculationLabel: {
    display: "block",
    color: theme.colors.textMuted,
    fontSize: "11px",
    fontWeight: 600,
    marginBottom: "8px",
  },

  calculationValue: {
    display: "block",
    color: theme.colors.text,
    fontSize: "18px",
    fontWeight: 700,
  },

  calculationDescription: {
    display: "block",
    color: theme.colors.textFaint,
    fontSize: "10.5px",
    marginTop: "5px",
  },

  uploadBox: {
    border: `1px dashed ${theme.colors.borderLight}`,
    borderRadius: theme.radius.sm,
    padding: "18px",
  },

  uploadLabel: {
    display: "flex",
    alignItems: "center",
    gap: "14px",
    flexWrap: "wrap",
    cursor: "pointer",
  },

  uploadTitle: {
    color: theme.colors.text,
    fontSize: "13px",
    fontWeight: 600,
  },

  fileInput: {
    color: theme.colors.textMuted,
    fontSize: "12px",
  },

  fileName: {
    color: theme.colors.textMuted,
    fontSize: "12px",
  },

  warningText: {
    color: theme.colors.textFaint,
    fontSize: "10.5px",
    margin: "10px 0 0",
  },

  ratingBox: {
    display: "flex",
    alignItems: "center",
    gap: "3px",
  },

  starButton: {
    border: "none",
    background: "transparent",
    fontSize: "26px",
    cursor: "pointer",
    padding: "2px",
  },

  ratingText: {
    color: theme.colors.textMuted,
    fontSize: "12px",
    marginLeft: "10px",
  },

  optionWrap: {
    display: "flex",
    flexWrap: "wrap",
    gap: "8px",
  },

  optionButton: {
    padding: "8px 13px",
    borderRadius: "20px",
    border: `1px solid ${theme.colors.borderLight}`,
    backgroundColor: theme.colors.bg,
    color: theme.colors.textMuted,
    fontSize: "12px",
    cursor: "pointer",
    transition: "all 0.15s ease",
  },

  optionButtonActive: {
    border: `1px solid ${theme.colors.primary}`,
    backgroundColor: theme.colors.primary,
    color: "#fff",
  },

  mistakeButtonActive: {
    border: `1px solid ${theme.colors.red}`,
    backgroundColor: theme.colors.redMuted,
    color: theme.colors.red,
  },

  textarea: {
    width: "100%",
    resize: "vertical",
    padding: "12px",
    borderRadius: theme.radius.sm,
    border: `1px solid ${theme.colors.borderLight}`,
    backgroundColor: theme.colors.bg,
    color: theme.colors.text,
    fontSize: "13px",
    boxSizing: "border-box",
    fontFamily: "inherit",
    outline: "none",
  },

  formFooter: {
    display: "flex",
    justifyContent: "flex-end",
    gap: "10px",
    borderTop: `1px solid ${theme.colors.border}`,
    paddingTop: "20px",
    marginTop: "26px",
  },

  cancelBtn: {
    padding: "10px 20px",
    borderRadius: theme.radius.sm,
    border: `1px solid ${theme.colors.border}`,
    backgroundColor: "transparent",
    color: theme.colors.textMuted,
    fontWeight: 600,
    fontSize: "13px",
    cursor: "pointer",
  },

  saveBtn: {
    padding: "10px 22px",
    borderRadius: theme.radius.sm,
    border: "none",
    backgroundColor: theme.colors.green,
    color: "#08120c",
    fontWeight: 700,
    fontSize: "13px",
    cursor: "pointer",
  },

  tableWrap: {
    backgroundColor: theme.colors.bgCard,
    border: `1px solid ${theme.colors.border}`,
    borderRadius: theme.radius.md,
    overflow: "auto",
  },

  table: {
    width: "100%",
    borderCollapse: "collapse",
  },

  th: {
    textAlign: "left",
    padding: "12px 16px",
    color: theme.colors.textFaint,
    fontSize: "11px",
    fontWeight: 600,
    textTransform: "uppercase",
    letterSpacing: "0.04em",
    borderBottom: `1px solid ${theme.colors.border}`,
    whiteSpace: "nowrap",
  },

  tr: {},

  td: {
    padding: "13px 16px",
    color: theme.colors.text,
    fontSize: "13.5px",
    borderBottom: `1px solid ${theme.colors.border}`,
    whiteSpace: "nowrap",
  },

  dirBadge: {
    padding: "3px 10px",
    borderRadius: "6px",
    fontSize: "11.5px",
    fontWeight: 600,
    textTransform: "capitalize",
  },

  resultBadge: {
    padding: "3px 10px",
    borderRadius: "6px",
    fontSize: "11.5px",
    fontWeight: 600,
    textTransform: "capitalize",
  },

  closeBtn: {
    padding: "6px 12px",
    borderRadius: theme.radius.sm,
    border: `1px solid ${theme.colors.primary}`,
    backgroundColor: "transparent",
    color: theme.colors.primary,
    cursor: "pointer",
    fontSize: "12px",
    fontWeight: 600,
  },

  emptyState: {
    backgroundColor: theme.colors.bgCard,
    border: `1px solid ${theme.colors.border}`,
    borderRadius: theme.radius.md,
    padding: "48px",
    textAlign: "center",
  },

  emptyTitle: {
    color: theme.colors.text,
    fontSize: "15px",
    fontWeight: 600,
    marginBottom: "6px",
  },

  emptyText: {
    color: theme.colors.textMuted,
    fontSize: "13px",
  },
};

export default Journal;
