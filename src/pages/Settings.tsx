import React from "react";
import { usePageTitle } from "@components/layout/PageTitleContext";
import useUserProfile from "../hooks/useUserProfile";
import StyledDropdown from "../components/core/StyledDropdown";

const currencies = ["USD", "EUR", "GBP", "JPY", "CAD", "AUD"];

const Settings: React.FC = () => {
  usePageTitle("Settings");
  const { profile, loading, error, updateUserProfile } = useUserProfile();

  const handleCurrencyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    updateUserProfile({ currency: e.target.value });
  };

  return (
    <div style={{ padding: "1rem" }}>
      <div className="container-xl">
        <h2 style={{ margin: 0, fontSize: 24, fontWeight: 700 }}>Settings</h2>

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
                backgroundColor: "#f8f9fa",
                borderRadius: "8px",
                border: "1px solid #e9ecef",
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

            {/* Second Column - Future Settings */}
            <div
              style={{
                padding: "1.5rem",
                backgroundColor: "#f8f9fa",
                borderRadius: "8px",
                border: "1px solid #e9ecef",
              }}
            >
              <h3
                style={{
                  margin: "0 0 1rem 0",
                  fontSize: "18px",
                  fontWeight: "600",
                }}
              >
                Additional Settings
              </h3>
              <p style={{ color: "#6c757d", margin: 0 }}>
                More settings will be available here in the future.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Settings;
