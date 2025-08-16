import React from "react";
import { useAuth } from "@auth/useAuth";
import { usePageTitle } from "@components/layout/PageTitleContext";
import useUserProfile from "../hooks/useUserProfile";
import StyledDropdown from "../components/core/StyledDropdown";

const currencies = ["USD", "EUR", "GBP", "JPY", "CAD", "AUD"];

const Profile: React.FC = () => {
  usePageTitle("Profile");
  const { user } = useAuth();
  const { profile, loading, error, updateUserProfile } = useUserProfile();

  const handleCurrencyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    updateUserProfile({ currency: e.target.value });
  };

  return (
    <div style={{ padding: "1rem" }}>
      <div className="container-xl">
        <h2 style={{ margin: 0, fontSize: 24, fontWeight: 700 }}>Profile</h2>
        <div style={{ marginTop: 12 }}>
          <div>
            <strong>Name:</strong> {user?.displayName ?? "—"}
          </div>
          <div>
            <strong>Email:</strong> {user?.email ?? "—"}
          </div>
          {loading && <p>Loading profile...</p>}
          {error && <p>{error}</p>}
          {profile && (
            <div style={{ marginTop: "1rem" }}>
              <label
                htmlFor="currency-select"
                style={{ marginRight: "0.5rem" }}
              >
                <strong>Default Currency:</strong>
              </label>
              <StyledDropdown
                id="currency-select"
                value={profile.currency}
                onChange={handleCurrencyChange}
              >
                {currencies.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </StyledDropdown>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;
