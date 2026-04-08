import React, { createContext, useContext, useState, useEffect, useCallback } from "react";

export const themes = {
  dark: {
    "--bg-primary":       "#080e1a",
    "--bg-secondary":     "#0f172a",
    "--bg-card":          "rgba(255,255,255,0.03)",
    "--bg-card-hover":    "rgba(255,255,255,0.06)",
    "--bg-input":         "rgba(255,255,255,0.05)",
    "--bg-nav":           "rgba(15,23,42,0.97)",
    "--border":           "rgba(255,255,255,0.07)",
    "--border-input":     "rgba(255,255,255,0.1)",
    "--text-primary":     "#ffffff",
    "--text-secondary":   "#94a3b8",
    "--text-muted":       "#64748b",
    "--text-faint":       "#475569",
    "--accent-blue":      "#38bdf8",
    "--accent-indigo":    "#818cf8",
    "--accent-green":     "#34d399",
    "--accent-red":       "#f43f5e",
    "--accent-yellow":    "#f59e0b",
    "--shadow":           "rgba(0,0,0,0.4)",
  },
  light: {
    "--bg-primary":       "#f1f5f9",
    "--bg-secondary":     "#ffffff",
    "--bg-card":          "#ffffff",
    "--bg-card-hover":    "#f8fafc",
    "--bg-input":         "#f8fafc",
    "--bg-nav":           "rgba(255,255,255,0.97)",
    "--border":           "rgba(0,0,0,0.08)",
    "--border-input":     "rgba(0,0,0,0.12)",
    "--text-primary":     "#0f172a",
    "--text-secondary":   "#334155",
    "--text-muted":       "#64748b",
    "--text-faint":       "#94a3b8",
    "--accent-blue":      "#0284c7",
    "--accent-indigo":    "#6366f1",
    "--accent-green":     "#059669",
    "--accent-red":       "#e11d48",
    "--accent-yellow":    "#d97706",
    "--shadow":           "rgba(0,0,0,0.1)",
  },
};

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => localStorage.getItem("theme") || "dark");

  useEffect(() => {
    const vars = themes[theme];
    Object.entries(vars).forEach(([k, v]) => {
      document.documentElement.style.setProperty(k, v);
    });
    document.documentElement.setAttribute("data-theme", theme);
    // Dark mode: body must be dark so it doesn't bleed white into dark components.
    // Light mode: keep white so existing page layouts look unchanged.
    document.body.style.background = theme === "dark" ? "#080e1a" : "#ffffff";
    document.body.style.color = vars["--text-primary"];
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = useCallback((t) => {
    setTheme(t || ((prev) => (prev === "dark" ? "light" : "dark")));
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be inside <ThemeProvider>");
  return ctx;
}
