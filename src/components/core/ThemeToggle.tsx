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
      className="theme-toggle sidebar-link"
      aria-label={`Switch to ${getNextTheme()} theme`}
      title={`Current: ${theme} theme`}
      style={{
        background: "transparent",
        border: "none",
        borderRadius: "8px",
        width: "32px",
        height: "32px",
        cursor: "pointer",
        display: "grid",
        placeItems: "center",
        fontSize: "1rem",
        transition: "all 0.2s ease",
        padding: "0",
        margin: "0",
        color: "var(--brand-text-primary)",
      }}
    >
      {getThemeIcon()}
    </button>
  );
};

export default ThemeToggle;
