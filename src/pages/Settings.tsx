import React from "react";
import { usePageTitle } from "@components/layout/PageTitleContext";
import PageHeader from "@components/layout/PageHeader";
import SettingsCurrencyCard from "@components/settings/SettingsCurrencyCard";
import SettingsThemeCard from "@components/settings/SettingsThemeCard";
import { useSettingsPage } from "@hooks/pages/useSettingsPage";

const Settings: React.FC = () => {
  usePageTitle("Settings");
  const vm = useSettingsPage();

  return (
    <div className="app-page">
      <PageHeader
        title="Settings"
        subtitle="Currency, appearance, and other defaults."
      />

      {vm.loading && <p>Loading settings...</p>}
      {vm.error && <p style={{ color: "red" }}>{vm.error}</p>}

      {vm.profile && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "2rem",
            marginTop: "1rem",
          }}
        >
          <SettingsCurrencyCard
            currency={vm.profile.currency ?? "USD"}
            onChange={vm.actions.setCurrency}
          />
          <SettingsThemeCard
            theme={vm.theme}
            resolvedTheme={vm.resolvedTheme}
            onChange={vm.actions.setTheme}
          />
        </div>
      )}
    </div>
  );
};

export default Settings;
