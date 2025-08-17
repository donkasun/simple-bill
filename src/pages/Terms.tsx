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
                SimpleBill is a comprehensive business management platform
                designed to streamline financial document creation and customer
                relationship management. The service provides professional
                invoice and quotation generation, customer database management,
                product catalog maintenance, and document lifecycle tracking.
                Users can create, edit, finalize, and download business
                documents in PDF format with automated numbering and calculation
                features.
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
                Your business data and personal information are stored securely
                using industry-standard Firebase services with enterprise-grade
                security measures. We implement appropriate technical and
                organizational safeguards to protect your information. We do not
                sell, rent, or share your personal or business data with third
                parties except as required by applicable law, to comply with
                legal obligations, or as necessary to provide and improve our
                services. You retain full ownership and control of your data.
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
                You agree to use SimpleBill exclusively for legitimate business
                purposes and in strict compliance with these Terms of Service
                and all applicable laws and regulations. You are prohibited from
                using the service to create fraudulent, misleading, or
                counterfeit documents, engage in any illegal activities, or
                violate the rights of third parties. You must not attempt to
                gain unauthorized access to the service, interfere with its
                operation, or use it in any manner that could damage, disable,
                or impair the service or its infrastructure.
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
                SimpleBill is provided "as is" and "as available" without any
                warranties, express or implied, including but not limited to
                warranties of merchantability, fitness for a particular purpose,
                or non-infringement. To the maximum extent permitted by
                applicable law, we shall not be liable for any direct, indirect,
                incidental, special, consequential, or punitive damages arising
                from your use of or inability to use the service, including but
                not limited to loss of profits, data, or business opportunities.
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
                For questions, concerns, or support regarding these Terms of
                Service or the SimpleBill platform, please contact our support
                team through the application's built-in support features or
                through the contact information provided within the service
                interface.
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
