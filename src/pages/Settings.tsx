import React from "react";
import { usePageTitle } from "@components/layout/PageTitleContext";

const Settings: React.FC = () => {
  usePageTitle("Settings");
  return (
    <div style={{ maxWidth: 640 }}>
      <h2>Settings</h2>
      <p style={{ marginTop: 12 }}>Coming soon.</p>
    </div>
  );
};

export default Settings;
