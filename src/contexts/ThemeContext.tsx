import React, { useEffect, useState, useCallback } from "react";
import type { Theme, ThemeContextType } from "../types/theme";
import { ThemeContext } from "./ThemeContext";

interface ThemeProviderProps {
  children: React.ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [theme, setTheme] = useState<Theme>("system");
  const [resolvedTheme, setResolvedTheme] = useState<"light" | "dark">("light");

  // Get system preference
  const getSystemTheme = (): "light" | "dark" => {
    if (typeof window !== "undefined" && window.matchMedia) {
      return window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light";
    }
    return "light";
  };

  // Update resolved theme based on current theme setting
  const updateResolvedTheme = useCallback((newTheme: Theme) => {
    if (newTheme === "system") {
      setResolvedTheme(getSystemTheme());
    } else {
      setResolvedTheme(newTheme);
    }
  }, []);

  // Initialize theme from localStorage or default to system
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") as Theme;

    // Priority: localStorage > system
    const initialTheme = savedTheme || "system";

    if (["light", "dark", "system"].includes(initialTheme)) {
      setTheme(initialTheme);
      updateResolvedTheme(initialTheme);
    } else {
      updateResolvedTheme("system");
    }
  }, [updateResolvedTheme]);

  // Listen for system theme changes
  useEffect(() => {
    if (theme === "system") {
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
      const handleChange = () => updateResolvedTheme("system");

      mediaQuery.addEventListener("change", handleChange);
      return () => mediaQuery.removeEventListener("change", handleChange);
    }
  }, [theme, updateResolvedTheme]);

  // Apply theme to document
  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute("data-theme", resolvedTheme);
  }, [resolvedTheme]);

  const handleSetTheme = (newTheme: Theme) => {
    setTheme(newTheme);
    updateResolvedTheme(newTheme);
    localStorage.setItem("theme", newTheme);
  };

  const value: ThemeContextType = {
    theme,
    setTheme: handleSetTheme,
    resolvedTheme,
  };

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
};
