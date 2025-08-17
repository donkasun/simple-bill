import React from "react";
import { Link } from "react-router-dom";

const Terms: React.FC = () => {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100dvh",
        overflow: "auto",
        padding: "1rem",
        backgroundColor: "#FDFBF6",
        color: "#343a40",
      }}
    >
      <div style={{ width: "100%", maxWidth: 800 }}>
        <div
          style={{
            background: "#fff",
            padding: "2rem",
            borderRadius: "12px",
            border: "1px solid rgba(52,58,64,0.2)",
            boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
          }}
        >
          <div style={{ marginBottom: "2rem" }}>
            <Link
              to="/login"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.5rem",
                color: "#0d6efd",
                textDecoration: "none",
                fontWeight: 500,
                marginBottom: "1rem",
              }}
            >
              ← Back to Login
            </Link>
            <h1
              className="brand"
              style={{
                fontSize: "2rem",
                lineHeight: "2.25rem",
                fontWeight: 700,
                marginBottom: "1rem",
              }}
            >
              Terms of Service
            </h1>
            <p
              style={{
                fontSize: "0.875rem",
                color: "rgba(52,58,64,0.7)",
                marginBottom: "2rem",
              }}
            >
              Last updated: {new Date().toLocaleDateString()}
            </p>
          </div>

          <div style={{ lineHeight: "1.6" }}>
            <section style={{ marginBottom: "2rem" }}>
              <h2
                style={{
                  fontSize: "1.5rem",
                  fontWeight: 600,
                  marginBottom: "1rem",
                }}
              >
                1. Acceptance of Terms
              </h2>
              <p style={{ marginBottom: "1rem" }}>
                By accessing and using SimpleBill, you accept and agree to be
                bound by the terms and provision of this agreement.
              </p>
            </section>

            <section style={{ marginBottom: "2rem" }}>
              <h2
                style={{
                  fontSize: "1.5rem",
                  fontWeight: 600,
                  marginBottom: "1rem",
                }}
              >
                2. Description of Service
              </h2>
              <p style={{ marginBottom: "1rem" }}>
                SimpleBill is a web-based application that allows users to
                create, manage, and download invoices and quotations. The
                service includes document creation, customer management, and
                item cataloging features.
              </p>
            </section>

            <section style={{ marginBottom: "2rem" }}>
              <h2
                style={{
                  fontSize: "1.5rem",
                  fontWeight: 600,
                  marginBottom: "1rem",
                }}
              >
                3. User Accounts
              </h2>
              <p style={{ marginBottom: "1rem" }}>
                You are responsible for maintaining the confidentiality of your
                account and for all activities that occur under your account.
                You agree to notify us immediately of any unauthorized use of
                your account.
              </p>
            </section>

            <section style={{ marginBottom: "2rem" }}>
              <h2
                style={{
                  fontSize: "1.5rem",
                  fontWeight: 600,
                  marginBottom: "1rem",
                }}
              >
                4. Data and Privacy
              </h2>
              <p style={{ marginBottom: "1rem" }}>
                Your data is stored securely using Firebase services. We do not
                share your personal information with third parties except as
                required by law or as necessary to provide the service.
              </p>
            </section>

            <section style={{ marginBottom: "2rem" }}>
              <h2
                style={{
                  fontSize: "1.5rem",
                  fontWeight: 600,
                  marginBottom: "1rem",
                }}
              >
                5. Acceptable Use
              </h2>
              <p style={{ marginBottom: "1rem" }}>
                You agree to use SimpleBill only for lawful purposes and in
                accordance with these Terms. You may not use the service to
                create fraudulent documents or for any illegal activities.
              </p>
            </section>

            <section style={{ marginBottom: "2rem" }}>
              <h2
                style={{
                  fontSize: "1.5rem",
                  fontWeight: 600,
                  marginBottom: "1rem",
                }}
              >
                6. Limitation of Liability
              </h2>
              <p style={{ marginBottom: "1rem" }}>
                SimpleBill is provided "as is" without warranties of any kind.
                We are not liable for any damages arising from the use or
                inability to use the service.
              </p>
            </section>

            <section style={{ marginBottom: "2rem" }}>
              <h2
                style={{
                  fontSize: "1.5rem",
                  fontWeight: 600,
                  marginBottom: "1rem",
                }}
              >
                7. Changes to Terms
              </h2>
              <p style={{ marginBottom: "1rem" }}>
                We reserve the right to modify these terms at any time.
                Continued use of the service after changes constitutes
                acceptance of the new terms.
              </p>
            </section>

            <section style={{ marginBottom: "2rem" }}>
              <h2
                style={{
                  fontSize: "1.5rem",
                  fontWeight: 600,
                  marginBottom: "1rem",
                }}
              >
                8. Contact Information
              </h2>
              <p style={{ marginBottom: "1rem" }}>
                If you have any questions about these Terms of Service, please
                contact us through the application.
              </p>
            </section>
          </div>

          <div
            style={{
              marginTop: "2rem",
              paddingTop: "1rem",
              borderTop: "1px solid rgba(52,58,64,0.2)",
            }}
          >
            <Link
              to="/login"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.5rem",
                color: "#0d6efd",
                textDecoration: "none",
                fontWeight: 500,
              }}
            >
              ← Back to Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Terms;
