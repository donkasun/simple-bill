import React from "react";
import {
  CURRENCY_DISPLAY_NAMES,
  CURRENCY_PICKER_ORDER,
  CURRENCY_SAMPLE_AMOUNT,
  formatCurrency,
  isSupportedCurrency,
} from "@utils/currency";

type SettingsCurrencyCardProps = {
  currency: string;
  onChange: (currency: string) => void;
};

const SettingsCurrencyCard: React.FC<SettingsCurrencyCardProps> = ({
  currency,
  onChange,
}) => {
  const selected = isSupportedCurrency(currency) ? currency : "USD";

  return (
    <section
      className="settings-card"
      aria-labelledby="settings-currency-title"
    >
      <h2 id="settings-currency-title" className="page-card-title">
        Default currency
      </h2>
      <p className="settings-card__helper">
        New invoices and quotes start in this currency. You can still change it
        on each document. Does not change invoices you have already saved.
      </p>

      <div
        className="settings-currency-grid"
        role="radiogroup"
        aria-labelledby="settings-currency-title"
      >
        {CURRENCY_PICKER_ORDER.map((code) => {
          const isSelected = code === selected;
          return (
            <button
              key={code}
              type="button"
              role="radio"
              aria-checked={isSelected}
              className={`settings-currency-option${isSelected ? " is-selected" : ""}`}
              onClick={() => onChange(code)}
            >
              <span className="settings-currency-option__name">
                {CURRENCY_DISPLAY_NAMES[code]}
              </span>
              <span className="settings-currency-option__code">{code}</span>
              <span className="settings-currency-option__sample">
                {formatCurrency(CURRENCY_SAMPLE_AMOUNT, code)}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
};

export default SettingsCurrencyCard;
