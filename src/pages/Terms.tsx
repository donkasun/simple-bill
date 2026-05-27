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
        backgroundColor: "var(--brand-background)",
        color: "var(--brand-text-primary)",
      }}
    >
      <div style={{ width: "100%", maxWidth: 800 }}>
        <div
          style={{
            background: "var(--white)",
            padding: "3rem",
            borderRadius: "16px",
            border: "1px solid var(--brand-border)",
            boxShadow: "0 10px 25px rgba(0,0,0,0.02)",
          }}
        >
          <div style={{ marginBottom: "2rem" }}>
            <Link
              to="/login"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.5rem",
                color: "var(--brand-primary)",
                textDecoration: "none",
                fontWeight: 600,
                marginBottom: "2rem",
              }}
            >
              ← Back to Login
            </Link>
            <h1
              style={{
                fontFamily: "var(--font-heading)",
                fontSize: "2.5rem",
                lineHeight: "2.25rem",
                fontWeight: 700,
                marginBottom: "1rem",
                color: "var(--brand-text-primary)",
              }}
            >
              Terms of Service
            </h1>
            <p
              style={{
                fontSize: "0.9375rem",
                color: "var(--brand-text-muted)",
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
                  fontFamily: "var(--font-heading)",
                  fontSize: "1.5rem",
                  fontWeight: 700,
                  marginBottom: "1rem",
                  color: "var(--brand-text-primary)",
                }}
              >
                1. Acceptance of Terms
              </h2>
              <p
                style={{
                  marginBottom: "1rem",
                  color: "var(--brand-text-secondary)",
                }}
              >
                By using SimpleBill, you agree to these Terms. If you do not
                agree, do not use the app.
              </p>
            </section>

            <section style={{ marginBottom: "2rem" }}>
              <h2
                style={{
                  fontFamily: "var(--font-heading)",
                  fontSize: "1.5rem",
                  fontWeight: 700,
                  marginBottom: "1rem",
                  color: "var(--brand-text-primary)",
                }}
              >
                2. Description of Service
              </h2>
              <p
                style={{
                  marginBottom: "1rem",
                  color: "var(--brand-text-secondary)",
                }}
              >
                SimpleBill is a small invoicing tool for creating customers,
                items, invoices, and quotations. You can generate PDFs for your
                records and for sharing with customers.
              </p>
            </section>

            <section style={{ marginBottom: "2rem" }}>
              <h2
                style={{
                  fontFamily: "var(--font-heading)",
                  fontSize: "1.5rem",
                  fontWeight: 700,
                  marginBottom: "1rem",
                  color: "var(--brand-text-primary)",
                }}
              >
                3. Accounts and access
              </h2>
              <p
                style={{
                  marginBottom: "1rem",
                  color: "var(--brand-text-secondary)",
                }}
              >
                You are responsible for safeguarding access to your device and
                Google account. If you think someone has accessed your data
                without permission, stop using the app and review your account
                security settings.
              </p>
            </section>

            <section style={{ marginBottom: "2rem" }}>
              <h2
                style={{
                  fontFamily: "var(--font-heading)",
                  fontSize: "1.5rem",
                  fontWeight: 700,
                  marginBottom: "1rem",
                  color: "var(--brand-text-primary)",
                }}
              >
                4. Data and privacy
              </h2>
              <p
                style={{
                  marginBottom: "1rem",
                  color: "var(--brand-text-secondary)",
                }}
              >
                SimpleBill stores your data in Firebase/Firestore under your
                account. You control what you enter (customer details, item
                descriptions, document notes). We do not intentionally sell your
                data.
              </p>
              <p
                style={{
                  marginBottom: "1rem",
                  color: "var(--brand-text-secondary)",
                }}
              >
                This app is provided as-is and may change over time. Avoid
                storing sensitive information you would not want exposed (for
                example, passwords, payment card numbers, or government IDs).
              </p>
            </section>

            <section style={{ marginBottom: "2rem" }}>
              <h2
                style={{
                  fontFamily: "var(--font-heading)",
                  fontSize: "1.5rem",
                  fontWeight: 700,
                  marginBottom: "1rem",
                  color: "var(--brand-text-primary)",
                }}
              >
                5. Acceptable use
              </h2>
              <p
                style={{
                  marginBottom: "1rem",
                  color: "var(--brand-text-secondary)",
                }}
              >
                Do not use SimpleBill for unlawful activities or to create
                misleading or fraudulent documents. Do not attempt to interfere
                with the service or gain unauthorized access to other users’
                data.
              </p>
            </section>

            <section style={{ marginBottom: "2rem" }}>
              <h2
                style={{
                  fontFamily: "var(--font-heading)",
                  fontSize: "1.5rem",
                  fontWeight: 700,
                  marginBottom: "1rem",
                  color: "var(--brand-text-primary)",
                }}
              >
                6. No warranties and limitation of liability
              </h2>
              <p
                style={{
                  marginBottom: "1rem",
                  color: "var(--brand-text-secondary)",
                }}
              >
                SimpleBill is provided “as is” without warranties of any kind.
                To the maximum extent permitted by law, we are not liable for
                any indirect, incidental, special, consequential, or punitive
                damages, or any loss of data, profits, revenue, or business,
                arising from your use of SimpleBill.
              </p>
            </section>

            <section style={{ marginBottom: "2rem" }}>
              <h2
                style={{
                  fontFamily: "var(--font-heading)",
                  fontSize: "1.5rem",
                  fontWeight: 700,
                  marginBottom: "1rem",
                  color: "var(--brand-text-primary)",
                }}
              >
                7. Changes
              </h2>
              <p
                style={{
                  marginBottom: "1rem",
                  color: "var(--brand-text-secondary)",
                }}
              >
                We may update these Terms from time to time. Continued use of
                SimpleBill after changes means you accept the updated Terms.
              </p>
            </section>

            <section style={{ marginBottom: "2rem" }}>
              <h2
                style={{
                  fontFamily: "var(--font-heading)",
                  fontSize: "1.5rem",
                  fontWeight: 700,
                  marginBottom: "1rem",
                  color: "var(--brand-text-primary)",
                }}
              >
                8. Contact
              </h2>
              <p
                style={{
                  marginBottom: "1rem",
                  color: "var(--brand-text-secondary)",
                }}
              >
                For questions about these Terms, contact the repository owner.
              </p>
            </section>
          </div>

          <div
            style={{
              marginTop: "2rem",
              paddingTop: "2rem",
              borderTop: "1px solid var(--brand-border)",
            }}
          >
            <Link
              to="/login"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.5rem",
                color: "var(--brand-primary)",
                textDecoration: "none",
                fontWeight: 600,
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
