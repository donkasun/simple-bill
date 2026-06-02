import React from "react";
import { usePageTitle } from "@components/layout/PageTitleContext";
import PageHeader from "@components/layout/PageHeader";
import SettingsCurrencyCard from "@components/settings/SettingsCurrencyCard";
import SettingsThemeCard from "@components/settings/SettingsThemeCard";
import SettingsBusinessCard from "@components/settings/SettingsBusinessCard";
import { useSettingsPage } from "@hooks/pages/useSettingsPage";

const Settings: React.FC = () => {
  usePageTitle("Settings");
  const vm = useSettingsPage();

  return (
    <div className="app-page settings-page">
      <PageHeader
        title="Settings"
        subtitle="Your usual currency and how the app looks."
      />

      {vm.loading && <p className="settings-page__status">Loading settings…</p>}
      {vm.error && (
        <p className="settings-page__error" role="alert">
          {vm.error}
        </p>
      )}

      {vm.profile && (
        <div className="settings-sections">
          <SettingsBusinessCard
            business={vm.profile.business ?? {}}
            onSave={vm.actions.setBusinessInfo}
          />
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
