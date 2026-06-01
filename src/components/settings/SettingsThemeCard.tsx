import React from "react";
import SettingsThemePicker, {
  type ThemeValue,
} from "@components/settings/SettingsThemePicker";

type SettingsThemeCardProps = {
  theme: string;
  resolvedTheme: string;
  onChange: (theme: ThemeValue) => void;
};

const SettingsThemeCard: React.FC<SettingsThemeCardProps> = ({
  theme,
  resolvedTheme,
  onChange,
}) => {
  const themeValue = (
    ["light", "dark", "system"].includes(theme) ? theme : "system"
  ) as ThemeValue;

  const resolved =
    resolvedTheme === "dark" ? "dark" : ("light" as "light" | "dark");

  const resolvedHint =
    themeValue === "system"
      ? `You're using ${resolved} because your device is set to ${resolved}.`
      : null;

  return (
    <section
      className="settings-card"
      aria-labelledby="settings-appearance-title"
    >
      <h2 id="settings-appearance-title" className="page-card-title">
        Appearance
      </h2>
      <p className="settings-card__helper">
        How SimpleBill looks on this phone or computer.
      </p>

      <SettingsThemePicker
        value={themeValue}
        resolvedTheme={resolved}
        onChange={onChange}
      />

      {resolvedHint ? (
        <p className="settings-card__hint">{resolvedHint}</p>
      ) : null}
    </section>
  );
};

export default SettingsThemeCard;
