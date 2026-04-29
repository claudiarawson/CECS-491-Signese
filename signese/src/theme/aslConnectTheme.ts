/**
 * ASL Connect–inspired dark gradient + glass UI (maroon base → purple, neon pink CTAs).
 */

export const asl = {
  gradient: ["#0B0107", "#2D0A4A", "#4C0D28", "#120108"] as const,
  gradientLocations: [0, 0.45, 1] as const,
  gradientAlt: ["#0B0107", "#4A1A6B", "#5C0A1E", "#150208"] as const,
  welcome: ["#0B0107", "#1A0A2E", "#3D0F4A", "#1A0508"] as const,

  /** Light mode: warm yellow → orange → sky blue → pink blush */
  gradientLight: ["#FFFBEB", "#FED7AA", "#BFDBFE", "#FBCFE8"] as const,
  welcomeLight: ["#FEF9C3", "#FDBA74", "#93C5FD", "#F9A8D4"] as const,

  primaryButton: ["#F472B6", "#EC4899", "#DB2777", "#BE185D"] as const,
  accentBlue: "#38BDF8",
  accentCyan: "#22D3EE",
  linkPink: "#F472B6",
  surfaceLight: "#FFFFFF",

  text: {
    primary: "#FFFFFF",
    secondary: "rgba(255,255,255,0.7)",
    muted: "rgba(255,255,255,0.48)",
  },

  glass: {
    bg: "rgba(255,255,255,0.08)",
    border: "rgba(255,255,255,0.14)",
    strong: "rgba(255,255,255,0.12)",
  },

  tabBar: {
    bg: "rgba(12, 6, 24, 0.92)",
    border: "rgba(255,255,255,0.08)",
    active: "#FB7185",
    inactive: "rgba(255,255,255,0.45)",
  },

  radius: { sm: 12, md: 16, lg: 20, xl: 24 },

  shadow: {
    card: {
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.35,
      shadowRadius: 16,
      elevation: 12,
    },
    glow: {
      shadowColor: "#EC4899",
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.55,
      shadowRadius: 18,
      elevation: 8,
    },
  },
} as const;
