import React from "react";
import { useAuth } from "@auth/useAuth";
import { usePageTitle } from "@components/layout/PageTitleContext";

const Profile: React.FC = () => {
  usePageTitle("Profile");
  const { user } = useAuth();
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
        </div>
      </div>
    </div>
  );
};

export default Profile;
