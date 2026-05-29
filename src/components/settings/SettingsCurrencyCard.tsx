import React from "react";
import StyledDropdown from "@components/core/StyledDropdown";
import { SUPPORTED_CURRENCIES } from "@utils/currency";

type SettingsCurrencyCardProps = {
  currency: string;
  onChange: (currency: string) => void;
};

const SettingsCurrencyCard: React.FC<SettingsCurrencyCardProps> = ({
  currency,
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
      <h2 className="page-card-title">Currency</h2>
      <div>
        <label
          htmlFor="currency-select"
          style={{
            display: "block",
            marginBottom: "0.5rem",
            fontWeight: 500,
          }}
        >
          Global Currency:
        </label>
        <StyledDropdown
          id="currency-select"
          value={currency}
          onChange={(e) => onChange(e.target.value)}
          style={{ width: "100%" }}
        >
          {SUPPORTED_CURRENCIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </StyledDropdown>
      </div>
    </div>
  );
};

export default SettingsCurrencyCard;
