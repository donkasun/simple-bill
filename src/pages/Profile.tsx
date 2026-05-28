import React from "react";
import { useAuth } from "@auth/useAuth";
import { usePageTitle } from "@components/layout/PageTitleContext";
import PageHeader from "@components/layout/PageHeader";

const Profile: React.FC = () => {
  usePageTitle("Profile");
  const { user } = useAuth();

  return (
    <div className="app-page">
      <PageHeader
        title="Profile"
        subtitle="Your name and email from Google sign-in."
      />
      <div>
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
