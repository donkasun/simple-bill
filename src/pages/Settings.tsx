import React from "react";
import { usePageTitle } from "@components/layout/PageTitleContext";
import useUserProfile from "../hooks/useUserProfile";
import StyledDropdown from "../components/core/StyledDropdown";
import { useTheme } from "../hooks/useTheme";

const currencies = ["USD", "EUR", "GBP", "JPY", "CAD", "AUD"];

const Settings: React.FC = () => {
  usePageTitle("Settings");
  const { profile, loading, error, updateUserProfile } = useUserProfile();
  const { theme, setTheme, resolvedTheme } = useTheme();

  const handleCurrencyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    updateUserProfile({ currency: e.target.value });
  };

  const handleThemeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setTheme(e.target.value as "light" | "dark" | "system");
  };

  return (
    <div style={{ padding: "1rem" }}>
      <div className="container-xl">
        <h2 className="page-title" style={{ margin: 0 }}>
          Settings
        </h2>

        {loading && <p>Loading settings...</p>}
        {error && <p style={{ color: "red" }}>{error}</p>}

        {profile && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "2rem",
              marginTop: "1rem",
            }}
          >
            {/* First Column - Currency Settings */}
            <div
              style={{
                padding: "1.5rem",
                backgroundColor: "var(--white)",
                borderRadius: "8px",
                border: "1px solid var(--brand-border)",
              }}
            >
              <h3
                style={{
                  margin: "0 0 1rem 0",
                  fontSize: "18px",
                  fontWeight: "600",
                }}
              >
                Currency Settings
              </h3>
              <div>
                <label
                  htmlFor="currency-select"
                  style={{
                    display: "block",
                    marginBottom: "0.5rem",
                    fontWeight: "500",
                  }}
                >
                  Global Currency:
                </label>
                <StyledDropdown
                  id="currency-select"
                  value={profile.currency}
                  onChange={handleCurrencyChange}
                  style={{ width: "100%" }}
                >
                  {currencies.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </StyledDropdown>
              </div>
            </div>

            {/* Second Column - Theme Settings */}
            <div
              style={{
                padding: "1.5rem",
                backgroundColor: "var(--white)",
                borderRadius: "8px",
                border: "1px solid var(--brand-border)",
              }}
            >
              <h3
                style={{
                  margin: "0 0 1rem 0",
                  fontSize: "18px",
                  fontWeight: "600",
                }}
              >
                Theme Settings
              </h3>
              <div>
                <label
                  htmlFor="theme-select"
                  style={{
                    display: "block",
                    marginBottom: "0.5rem",
                    fontWeight: "500",
                  }}
                >
                  Theme:
                </label>
                <StyledDropdown
                  id="theme-select"
                  value={theme}
                  onChange={handleThemeChange}
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
                  Current:{" "}
                  {theme === "system" ? `${resolvedTheme} (system)` : theme}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Settings;
