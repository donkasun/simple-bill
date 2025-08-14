import React from "react";
import { useAuth } from "@auth/useAuth";
import { usePageTitle } from "@components/layout/PageTitleContext";

const Profile: React.FC = () => {
  usePageTitle("Profile");
  const { user } = useAuth();
  return (
    <div style={{ maxWidth: 640 }}>
      <h2>Profile</h2>
      <div style={{ marginTop: 12 }}>
        <div>
          <strong>Name:</strong> {user?.displayName ?? "—"}
        </div>
        <div>
          <strong>Email:</strong> {user?.email ?? "—"}
        </div>
      </div>
    </div>
  );
};

export default Profile;
