import React from "react";

type ThemeValue = "light" | "dark" | "system";

type ThemeOption = {
  value: ThemeValue;
  label: string;
  icon: string;
  previewClass: string;
};

const THEME_OPTIONS: ThemeOption[] = [
  {
    value: "light",
    label: "Light",
    icon: "light_mode",
    previewClass: "is-light",
  },
  { value: "dark", label: "Dark", icon: "dark_mode", previewClass: "is-dark" },
  {
    value: "system",
    label: "Match device",
    icon: "brightness_auto",
    previewClass: "is-system",
  },
];

type SettingsThemePickerProps = {
  value: ThemeValue;
  resolvedTheme: "light" | "dark";
  onChange: (theme: ThemeValue) => void;
};

const SettingsThemePicker: React.FC<SettingsThemePickerProps> = ({
  value,
  resolvedTheme,
  onChange,
}) => {
  return (
    <div
      className="settings-theme-picker"
      role="radiogroup"
      aria-label="Appearance"
      data-resolved-theme={resolvedTheme}
    >
      {THEME_OPTIONS.map((opt) => {
        const selected = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={selected}
            className={`choice-tile settings-theme-option${selected ? " is-selected" : ""}`}
            onClick={() => onChange(opt.value)}
          >
            <span
              className={`settings-theme-option__preview ${opt.previewClass}`}
              aria-hidden
            >
              <span className="settings-theme-option__preview-bar" />
              <span className="settings-theme-option__preview-line" />
              <span className="settings-theme-option__preview-line settings-theme-option__preview-line--short" />
            </span>
            <span
              className="material-symbols-outlined settings-theme-option__icon"
              aria-hidden
            >
              {opt.icon}
            </span>
            <span className="settings-theme-option__label">{opt.label}</span>
          </button>
        );
      })}
    </div>
  );
};

export default SettingsThemePicker;
export type { ThemeValue };
