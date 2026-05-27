import React from "react";
import { useTheme } from "../../hooks/useTheme";

const ThemeToggle: React.FC = () => {
  const { theme, setTheme, resolvedTheme } = useTheme();

  const getThemeIcon = () => {
    if (theme === "system") {
      return resolvedTheme === "dark" ? "🌙" : "☀️";
    }
    return theme === "dark" ? "🌙" : "☀️";
  };

  const getNextTheme = (): "light" | "dark" | "system" => {
    if (theme === "light") return "dark";
    if (theme === "dark") return "system";
    return "light";
  };

  const handleToggle = () => {
    setTheme(getNextTheme());
  };

  return (
    <button
      onClick={handleToggle}
      className="sidebar-link"
      aria-label={`Switch to ${getNextTheme()} theme`}
      title={`Current: ${theme} theme`}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        width: "100%",
        background: "transparent",
        border: "none",
        borderRadius: "8px",
        cursor: "pointer",
        fontSize: "1rem",
        transition: "all 0.2s ease",
        padding: "10px 12px",
        margin: "0",
        color: "var(--brand-text-primary)",
        fontWeight: "600",
      }}
    >
      <span>Theme</span>
      <span>{getThemeIcon()}</span>
    </button>
  );
};

export default ThemeToggle;
