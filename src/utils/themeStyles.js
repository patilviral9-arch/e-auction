/**
 * useThemeStyles — returns theme-aware style helpers.
 * Exports all aliases used across components (t.L, t.bg, t.bgSec,
 * t.bgCard, t.bgCardGrad, t.bgInput, t.border, t.borderMd,
 * t.shadow, t.shadowCard, t.textPri, t.textSec, t.textMut, t.textFaint).
 */

import { useTheme } from "../context/ThemeContext";

export function useThemeStyles() {
  const { theme } = useTheme();
  const L = theme === "light"; // L = isLight — used directly in components as t.L

  return {
    // ── Light flag (used as t.L throughout components) ──────────────────────
    L,
    isLight: L,
    theme,

    // ── Backgrounds ──────────────────────────────────────────────────────────
    bg:          L ? "#f1f5f9"                    : "#080e1a",
    bgSec:       L ? "#ffffff"                    : "#0f172a",
    bgCard:      L ? "#ffffff"                    : "rgba(255,255,255,0.03)",
    bgCardGrad:  L ? "#ffffff"                    : "rgba(255,255,255,0.03)",
    bgCardHover: L ? "#f8fafc"                    : "rgba(255,255,255,0.06)",
    bgInput:     L ? "#f8fafc"                    : "rgba(255,255,255,0.05)",
    bgNav:       L ? "rgba(255,255,255,0.97)"     : "rgba(15,23,42,0.97)",
    bgHover:     L ? "rgba(0,0,0,0.04)"           : "rgba(255,255,255,0.06)",

    // ── Borders ──────────────────────────────────────────────────────────────
    border:      L ? "rgba(0,0,0,0.08)"           : "rgba(255,255,255,0.07)",
    borderMd:    L ? "rgba(0,0,0,0.12)"           : "rgba(255,255,255,0.1)",
    borderInput: L ? "rgba(0,0,0,0.12)"           : "rgba(255,255,255,0.1)",

    // ── Text ─────────────────────────────────────────────────────────────────
    textPri:       L ? "#0f172a"  : "#ffffff",
    textSec:       L ? "#334155"  : "#94a3b8",
    textMut:       L ? "#64748b"  : "#64748b",
    textFaint:     L ? "#94a3b8"  : "#475569",

    // Long-form aliases (same values, for any component using the full name)
    textPrimary:   L ? "#0f172a"  : "#ffffff",
    textSecondary: L ? "#334155"  : "#94a3b8",
    textMuted:     L ? "#64748b"  : "#64748b",

    // ── Shadows ──────────────────────────────────────────────────────────────
    shadow:     L ? "rgba(0,0,0,0.1)"  : "rgba(0,0,0,0.4)",
    shadowCard: L ? "0 2px 12px rgba(0,0,0,0.06)" : "none",

    // ── Accents ──────────────────────────────────────────────────────────────
    accentBlue:   L ? "#0284c7"  : "#38bdf8",
    accentIndigo: L ? "#6366f1"  : "#818cf8",
    accentGreen:  L ? "#059669"  : "#34d399",
    accentRed:    L ? "#e11d48"  : "#f43f5e",
    accentYellow: L ? "#d97706"  : "#f59e0b",

    // ── Composite helpers ─────────────────────────────────────────────────────
    card: {
      background:   L ? "#ffffff" : "rgba(255,255,255,0.03)",
      border:       `1px solid ${L ? "rgba(0,0,0,0.08)" : "rgba(255,255,255,0.07)"}`,
      borderRadius: "16px",
      padding:      "20px",
      boxShadow:    L ? "0 2px 12px rgba(0,0,0,0.06)" : "none",
    },

    input: {
      background:  L ? "#f8fafc" : "rgba(255,255,255,0.05)",
      border:      `1px solid ${L ? "rgba(0,0,0,0.12)" : "rgba(255,255,255,0.1)"}`,
      color:       L ? "#0f172a" : "#ffffff",
      borderRadius: "10px",
      padding:     "11px 14px",
      fontSize:    "14px",
      outline:     "none",
      width:       "100%",
      boxSizing:   "border-box",
    },
  };
}
