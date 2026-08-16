import { theme } from "../theme";

/**
 * Premium instrument-style score gauge.
 * Metallic bezel, glass face, gradient arc, tick marks, glowing swaying needle.
 *
 * score / max define the needle position (0..max mapped across the arc sweep).
 * size:    full  -> 220px (hero), compact -> 96px (card grid, no ticks/label)
 */
function ScoreGauge({
  score = 0,
  max = 15,
  size = 220,
  compact = false,
  label = "Composite Score",
}) {
  const clamped = Math.max(0, Math.min(max, Number(score) || 0));
  const pct = max > 0 ? clamped / max : 0;

  const startDeg = -220;
  const endDeg = 40;
  const needleDeg = startDeg + (endDeg - startDeg) * pct;

  const color =
    pct >= 0.6 ? theme.colors.mint : pct >= 0.4 ? theme.colors.amber : theme.colors.red;

  const cx = 140;
  const cy = 140;
  const rArc = 110;

  // Arc path (large sweep, ~260deg)
  const polar = (deg, r) => {
    const rad = (deg * Math.PI) / 180;
    return [cx + r * Math.cos(rad), cy + r * Math.sin(rad)];
  };
  const [x1, y1] = polar(startDeg, rArc);
  const [x2, y2] = polar(endDeg, rArc);
  const arcPath = `M ${x1} ${y1} A ${rArc} ${rArc} 0 1 1 ${x2} ${y2}`;

  const majorTicks = [];
  const minorTicks = [];
  if (!compact) {
    const majorCount = 8;
    for (let i = 0; i <= majorCount; i++) {
      const deg = startDeg + ((endDeg - startDeg) * i) / majorCount;
      const [ix1, iy1] = polar(deg, 100);
      const [ix2, iy2] = polar(deg, 112);
      majorTicks.push(
        <line key={`maj-${i}`} x1={ix1} y1={iy1} x2={ix2} y2={iy2} stroke="#aab2c4" strokeWidth="2" />
      );
    }
    for (let i = 0; i <= 40; i++) {
      const deg = startDeg + ((endDeg - startDeg) * i) / 40;
      const [ix1, iy1] = polar(deg, 105);
      const [ix2, iy2] = polar(deg, 112);
      minorTicks.push(
        <line key={`min-${i}`} x1={ix1} y1={iy1} x2={ix2} y2={iy2} stroke="#4a5163" strokeWidth="1" />
      );
    }
  }

  const gradId = `gaugeArc-${compact ? "c" : "f"}-${size}`;

  return (
    <div
      className="score-gauge"
      style={{
        position: "relative",
        width: size,
        height: size,
        flexShrink: 0,
      }}
    >
      {!compact && (
        <div className="gauge-orbit" style={{ position: "absolute", inset: -14 }}>
          <span className="gauge-particle gauge-particle-1" />
          <span className="gauge-particle gauge-particle-2" />
          <span className="gauge-particle gauge-particle-3" />
        </div>
      )}

      {/* metallic bezel */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: "50%",
          background:
            "conic-gradient(from 210deg, #4a5163, #d9dee7, #8a92a5, #eef1f5, #565d70, #c7cdd8, #4a5163)",
          boxShadow:
            "0 12px 28px rgba(0,0,0,0.55), inset 0 2px 4px rgba(255,255,255,0.5), inset 0 -3px 8px rgba(0,0,0,0.6)",
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: size * 0.035,
          borderRadius: "50%",
          background: "radial-gradient(circle at 35% 30%, #262b36, #0d1017 70%)",
          boxShadow: "inset 0 2px 6px rgba(0,0,0,0.8)",
        }}
      />

      {/* glass face */}
      <div
        className="gauge-face"
        style={{
          position: "absolute",
          inset: size * 0.085,
          borderRadius: "50%",
          background: `radial-gradient(circle at 40% 30%, ${color}14, transparent 60%),
                       radial-gradient(circle at 60% 75%, rgba(255,255,255,0.03), transparent 50%),
                       #0a0e17`,
          boxShadow: "inset 0 0 24px rgba(0,0,0,0.9), inset 0 0 2px rgba(255,255,255,0.15)",
          overflow: "hidden",
        }}
      >
        <div className="gauge-sheen" />
      </div>

      <svg viewBox="0 0 280 280" style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}>
        <defs>
          <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={theme.colors.red} />
            <stop offset="50%" stopColor={theme.colors.amber} />
            <stop offset="100%" stopColor={theme.colors.mint} />
          </linearGradient>
        </defs>
        <path
          d={arcPath}
          fill="none"
          stroke={`url(#${gradId})`}
          strokeWidth={compact ? 6 : 8}
          strokeLinecap="round"
          opacity="0.9"
          style={{ filter: `drop-shadow(0 0 6px ${color}66)` }}
        />
        <g>{majorTicks}</g>
        <g>{minorTicks}</g>
      </svg>

      {/* needle */}
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: "50%",
          transformOrigin: "50% 100%",
          transform: `translate(-50%, -100%) rotate(${needleDeg}deg)`,
          transition: "transform 1s cubic-bezier(.34,1.56,.64,1)",
        }}
      >
        <div
          className="gauge-needle"
          style={{
            width: compact ? 2.5 : 4,
            height: size * 0.34,
            background: `linear-gradient(180deg, ${color}, ${color}00)`,
            borderRadius: 4,
            boxShadow: `0 0 10px 2px ${color}e6, 0 0 24px 5px ${color}55`,
          }}
        >
          <div
            style={{
              position: "absolute",
              top: -3,
              left: "50%",
              transform: "translateX(-50%)",
              width: compact ? 5 : 8,
              height: compact ? 5 : 8,
              borderRadius: "50%",
              background: "#fff",
              boxShadow: `0 0 8px 3px ${color}`,
            }}
          />
        </div>
      </div>

      {/* hub */}
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: "50%",
          width: compact ? 10 : 20,
          height: compact ? 10 : 20,
          transform: "translate(-50%, -50%)",
          borderRadius: "50%",
          background: "radial-gradient(circle at 35% 30%, #e8ecf2, #6a7182 70%, #2b303c)",
          boxShadow: "0 0 0 3px rgba(0,0,0,0.4), 0 2px 5px rgba(0,0,0,0.6)",
        }}
      />

      {!compact && (
        <div
          style={{
            position: "absolute",
            left: "50%",
            bottom: "24%",
            transform: "translateX(-50%)",
            textAlign: "center",
          }}
        >
          <div
            style={{
              fontSize: size * 0.16,
              fontWeight: 700,
              color: "#fff",
              lineHeight: 1,
              textShadow: `0 0 18px ${color}88`,
              fontFamily: theme.font.display,
            }}
          >
            {clamped}
          </div>
          <div
            style={{
              fontSize: 10,
              letterSpacing: 2,
              color: theme.colors.textMuted,
              textTransform: "uppercase",
              marginTop: 4,
            }}
          >
            {label}
          </div>
        </div>
      )}

      {compact && (
        <div
          style={{
            position: "absolute",
            left: "50%",
            top: "62%",
            transform: "translate(-50%, -50%)",
            fontSize: size * 0.2,
            fontWeight: 800,
            color: "#fff",
          }}
        >
          {clamped}
        </div>
      )}
    </div>
  );
}

export default ScoreGauge;
