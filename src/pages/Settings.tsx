import React from "react";
import { usePageTitle } from "@components/layout/PageTitleContext";

const Settings: React.FC = () => {
  usePageTitle("Settings");
  return (
    <div style={{ padding: "1rem" }}>
      <div className="container-xl">
        <h2 style={{ margin: 0, fontSize: 24, fontWeight: 700 }}>Settings</h2>
        <p style={{ marginTop: 12 }}>Coming soon.</p>
      </div>
    </div>
  );
};

export default Settings;
