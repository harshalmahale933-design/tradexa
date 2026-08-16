export const theme = {
  colors: {
    bg: "#06070a",
    bgElevated: "#0b0d12",
    bgCard: "rgba(255,255,255,0.045)",
    bgCardSolid: "#0d0f14",
    bgHover: "rgba(255,255,255,0.07)",
    border: "rgba(255,255,255,0.09)",
    borderLight: "rgba(255,255,255,0.14)",

    text: "#eef1f6",
    textMuted: "#8b93a5",
    textFaint: "#5c6070",

    mint: "#00e5a0",
    mintDim: "rgba(0,229,160,0.14)",
    mintDeep: "#00b378",

    red: "#ff4d6a",
    redDim: "rgba(255,77,106,0.14)",

    amber: "#f5a623",
    amberDim: "rgba(245,166,35,0.14)",

    // Back-compat aliases (existing pages reference these)
    primary: "#00e5a0",
    primaryHover: "#33ecb3",
    primaryMuted: "rgba(0,229,160,0.14)",
    green: "#00e5a0",
    greenMuted: "rgba(0,229,160,0.14)",
    amberMuted: "rgba(245,166,35,0.14)",
    redMuted: "rgba(255,77,106,0.14)",
  },
  radius: {
    sm: "10px",
    md: "14px",
    lg: "20px",
  },
  shadow: {
    card: "0 1px 3px rgba(0,0,0,0.3)",
    elevated: "0 30px 80px rgba(0,0,0,0.55)",
    glowMint: "0 0 30px rgba(0,229,160,0.35)",
    glowRed: "0 0 30px rgba(255,77,106,0.3)",
  },
  font: {
    display: "'Space Grotesk', 'Inter', sans-serif",
    family: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    mono: "'JetBrains Mono', monospace",
  },
  glass: {
    background: "linear-gradient(160deg, rgba(255,255,255,0.045), rgba(255,255,255,0.015))",
    backdropFilter: "blur(20px) saturate(140%)",
  },
};
