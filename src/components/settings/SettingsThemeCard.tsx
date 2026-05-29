import React from "react";
import StyledDropdown from "@components/core/StyledDropdown";

type SettingsThemeCardProps = {
  theme: string;
  resolvedTheme: string;
  onChange: (theme: "light" | "dark" | "system") => void;
};

const SettingsThemeCard: React.FC<SettingsThemeCardProps> = ({
  theme,
  resolvedTheme,
  onChange,
}) => {
  const cardStyle = {
    padding: "1.5rem",
    backgroundColor: "var(--white)",
    borderRadius: "8px",
    border: "1px solid var(--brand-border)",
  } as const;

  return (
    <div style={cardStyle}>
      <h2 className="page-card-title">Appearance</h2>
      <div>
        <label
          htmlFor="theme-select"
          style={{
            display: "block",
            marginBottom: "0.5rem",
            fontWeight: 500,
          }}
        >
          Theme:
        </label>
        <StyledDropdown
          id="theme-select"
          value={theme}
          onChange={(e) =>
            onChange(e.target.value as "light" | "dark" | "system")
          }
          style={{ width: "100%" }}
        >
          <option value="light">Light</option>
          <option value="dark">Dark</option>
          <option value="system">System</option>
        </StyledDropdown>
        <p
          style={{
            color: "var(--brand-text-secondary)",
            margin: "0.5rem 0 0 0",
            fontSize: "0.875rem",
          }}
        >
          Current: {theme === "system" ? `${resolvedTheme} (system)` : theme}
        </p>
      </div>
    </div>
  );
};

export default SettingsThemeCard;
