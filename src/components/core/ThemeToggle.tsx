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
      className="theme-toggle"
      aria-label={`Switch to ${getNextTheme()} theme`}
      title={`Current: ${theme} theme`}
      style={{
        background: "transparent",
        border: "1px solid var(--brand-border)",
        borderRadius: "8px",
        width: "var(--round-button-size)",
        height: "var(--round-button-size)",
        cursor: "pointer",
        display: "grid",
        placeItems: "center",
        fontSize: "1.2rem",
        transition: "all 0.2s ease",
      }}
    >
      {getThemeIcon()}
    </button>
  );
};

export default ThemeToggle;
