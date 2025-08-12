import React from "react";
import { useAuth } from "@auth/useAuth";

const Profile: React.FC = () => {
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
        <div>
          <strong>UID:</strong> {user?.uid ?? "—"}
        </div>
      </div>
    </div>
  );
};

export default Profile;
