import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { useAuth } from "@auth/useAuth";

const GoogleIcon = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      fill="currentColor"
    />
    <path
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      fill="currentColor"
    />
    <path
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      fill="currentColor"
    />
    <path
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      fill="currentColor"
    />
  </svg>
);

/* Reusable button styles */
const ctaBtnStyle = (size: "sm" | "md" | "lg"): React.CSSProperties => ({
  display: "inline-flex",
  alignItems: "center",
  gap: "0.5rem",
  padding: size === "lg" ? "0 2rem" : size === "md" ? "0 1.75rem" : "0 1.25rem",
  height: size === "lg" ? "52px" : size === "md" ? "48px" : "40px",
  borderRadius: "9999px",
  backgroundColor: "var(--md-primary-container)",
  color: "#ffffff",
  fontWeight: 700,
  fontSize: size === "sm" ? "var(--text-sm)" : "var(--text-base)",
  border: "none",
  cursor: "pointer",
  textDecoration: "none",
  whiteSpace: "nowrap" as const,
});

const outlineBtnStyle = (size: "md" | "lg"): React.CSSProperties => ({
  display: "inline-flex",
  alignItems: "center",
  padding: size === "lg" ? "0 2rem" : "0 1.75rem",
  height: size === "lg" ? "52px" : "48px",
  borderRadius: "9999px",
  backgroundColor: "transparent",
  color: "var(--md-on-surface)",
  fontWeight: 600,
  fontSize: "var(--text-base)",
  textDecoration: "none",
  border: "1px solid var(--md-outline-variant)",
  cursor: "pointer",
  whiteSpace: "nowrap" as const,
});

const Landing = () => {
  const { user, signInWithGoogle } = useAuth();
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    if (user) navigate("/dashboard", { replace: true });
  }, [user, navigate]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div
      style={{
        minHeight: "100dvh",
        backgroundColor: "var(--md-surface)",
        color: "var(--md-on-surface)",
        fontFamily: "var(--font-body)",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* ── Nav ─────────────────────────────────────── */}
      <nav
        style={{
          position: "sticky",
          top: 0,
          zIndex: 100,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 2rem",
          height: "64px",
          backgroundColor: scrolled ? "rgba(248,249,250,0.88)" : "transparent",
          backdropFilter: scrolled ? "blur(12px)" : "none",
          WebkitBackdropFilter: scrolled ? "blur(12px)" : "none",
          borderBottom: scrolled
            ? "1px solid var(--md-outline-variant)"
            : "1px solid transparent",
          transition:
            "background-color 0.25s ease, border-color 0.25s ease, backdrop-filter 0.25s ease",
        }}
      >
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <span
            className="material-symbols-outlined filled"
            style={{ fontSize: "24px", color: "var(--md-primary-container)" }}
          >
            account_balance_wallet
          </span>
          <span
            style={{
              fontFamily: "var(--font-heading)",
              fontWeight: 800,
              fontSize: "var(--text-lg)",
              color: "var(--md-primary-container)",
              letterSpacing: "-0.01em",
            }}
          >
            SimpleBill
          </span>
        </div>

        {/* Centre nav links */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
          {[
            { label: "Features", href: "#features" },
            { label: "How it works", href: "#how-it-works" },
            { label: "Showcase", href: "#showcase" },
          ].map(({ label, href }, i) => (
            <a
              key={href}
              href={href}
              style={{
                padding: "0.375rem 0.875rem",
                fontSize: "var(--text-base)",
                fontWeight: i === 0 ? 700 : 400,
                color:
                  i === 0
                    ? "var(--md-primary-container)"
                    : "var(--md-on-surface-variant)",
                textDecoration: "none",
                borderBottom:
                  i === 0
                    ? "2px solid var(--md-primary-container)"
                    : "2px solid transparent",
                lineHeight: "1.5",
              }}
            >
              {label}
            </a>
          ))}
        </div>

        {/* Right CTA */}
        <div>
          {user ? (
            <Link to="/dashboard" style={ctaBtnStyle("sm")}>
              Go to app
            </Link>
          ) : (
            <button onClick={signInWithGoogle} style={ctaBtnStyle("sm")}>
              <GoogleIcon />
              Sign in with Google
            </button>
          )}
        </div>
      </nav>

      {/* ── Hero ────────────────────────────────────── */}
      <main
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "5rem 1.5rem",
          textAlign: "center",
          gap: "1.75rem",
          maxWidth: "760px",
          margin: "0 auto",
          width: "100%",
        }}
      >
        {/* Eyebrow */}
        <p
          style={{
            margin: 0,
            fontSize: "var(--text-sm)",
            fontWeight: 500,
            color: "var(--md-on-surface-variant)",
            letterSpacing: "0.04em",
            textTransform: "uppercase",
          }}
        >
          Originally built for my dad, who'd never call himself a "computer
          person."
        </p>

        <h1
          style={{
            fontFamily: "var(--font-heading)",
            fontSize: "clamp(2.25rem, 6vw, 3.75rem)",
            fontWeight: 800,
            lineHeight: 1.1,
            margin: 0,
            color: "var(--md-on-surface)",
          }}
        >
          Make an invoice.{" "}
          <span style={{ color: "var(--md-primary-container)" }}>
            Then forget about it.
          </span>
        </h1>

        <p
          style={{
            fontSize: "var(--text-lg)",
            color: "var(--md-on-surface-variant)",
            maxWidth: "540px",
            lineHeight: 1.65,
            margin: 0,
          }}
        >
          SimpleBill helps you bill your regular clients in a few calm taps.
          Create an invoice or quote, add your items, send a clean PDF.
        </p>

        <div
          style={{
            display: "flex",
            gap: "0.75rem",
            flexWrap: "wrap",
            justifyContent: "center",
          }}
        >
          {user ? (
            <Link to="/dashboard" style={ctaBtnStyle("md")}>
              Go to app
            </Link>
          ) : (
            <button onClick={signInWithGoogle} style={ctaBtnStyle("md")}>
              <GoogleIcon />
              Sign in with Google
            </button>
          )}
          <a href="#how-it-works" style={outlineBtnStyle("md")}>
            See how it works
          </a>
        </div>
      </main>

      {/* ── Marquee placeholder ───────────────────── */}
      <section
        style={{
          padding: "1.25rem 2rem",
          backgroundColor: "var(--md-primary)",
          textAlign: "center",
        }}
      >
        <p
          style={{
            color: "var(--md-on-primary)",
            fontSize: "var(--text-sm)",
            margin: 0,
            opacity: 0.8,
          }}
        >
          Invoices · Quotations · Multi-currency · One-tap PDF · Repeat clients
          · LKR · USD · EUR · GBP
        </p>
      </section>

      {/* ── Features bento grid ──────────────────── */}
      <section
        id="features"
        style={{ padding: "5rem 1.5rem", backgroundColor: "var(--md-surface)" }}
      >
        <style>{`
          .bento-grid {
            display: grid;
            grid-template-columns: repeat(12, 1fr);
            gap: 1rem;
          }
          .bento-card-wide { grid-column: span 8; }
          .bento-card-narrow { grid-column: span 4; }
          @media (max-width: 768px) {
            .bento-card-wide, .bento-card-narrow { grid-column: span 12; }
          }
        `}</style>

        <div style={{ maxWidth: "1100px", margin: "0 auto", width: "100%" }}>
          {/* Section header */}
          <div style={{ textAlign: "center", marginBottom: "3rem" }}>
            <p
              style={{
                margin: "0 0 0.75rem",
                fontSize: "var(--text-sm)",
                fontWeight: 600,
                color: "var(--md-primary-container)",
                letterSpacing: "0.06em",
                textTransform: "uppercase",
              }}
            >
              Features
            </p>
            <h2
              style={{
                fontFamily: "var(--font-heading)",
                fontSize: "clamp(1.75rem, 4vw, 2.25rem)",
                fontWeight: 800,
                margin: "0 0 0.75rem",
                color: "var(--md-on-surface)",
              }}
            >
              Everything you need
            </h2>
            <p
              style={{
                fontSize: "var(--text-base)",
                color: "var(--md-on-surface-variant)",
                maxWidth: "440px",
                margin: "0 auto",
                lineHeight: 1.6,
              }}
            >
              Simple tools built for how you actually work.
            </p>
          </div>

          {/* Grid */}
          <div className="bento-grid">
            {/* Card 1 — Invoices & Quotations (wide) */}
            <div
              className="bento-card-wide"
              style={{
                backgroundColor: "var(--green-light)",
                borderRadius: "1.5rem",
                padding: "2.5rem",
                position: "relative",
                overflow: "hidden",
                minHeight: "280px",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
              }}
            >
              <div style={{ maxWidth: "320px", zIndex: 1 }}>
                <h3
                  style={{
                    fontFamily: "var(--font-heading)",
                    fontSize: "var(--text-xl)",
                    fontWeight: 700,
                    color: "var(--md-primary-container)",
                    margin: "0 0 0.75rem",
                  }}
                >
                  Invoices &amp; Quotations
                </h3>
                <p
                  style={{
                    fontSize: "var(--text-base)",
                    color: "var(--md-on-surface-variant)",
                    lineHeight: 1.6,
                    margin: "0 0 1.5rem",
                  }}
                >
                  Convert quotes to professional invoices with one click. Custom
                  branding included.
                </p>
                <button style={ctaBtnStyle("sm")}>Explore features</button>
              </div>

              {/* Mini invoice mockup */}
              <div
                style={{
                  position: "absolute",
                  right: "2rem",
                  top: "50%",
                  transform: "translateY(-50%) rotate(-3deg)",
                  width: "192px",
                  backgroundColor: "var(--md-surface-container-lowest)",
                  borderRadius: "12px",
                  padding: "1.125rem",
                  boxShadow: "0 12px 40px rgba(0,0,0,0.10)",
                  border: "1px solid var(--md-outline-variant)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    marginBottom: "12px",
                  }}
                >
                  <div>
                    <div
                      style={{
                        fontSize: "8px",
                        fontWeight: 700,
                        color: "var(--md-outline)",
                        letterSpacing: "0.1em",
                        textTransform: "uppercase",
                        marginBottom: "2px",
                      }}
                    >
                      Invoice
                    </div>
                    <div
                      style={{
                        fontSize: "11px",
                        fontWeight: 700,
                        color: "var(--md-on-surface)",
                      }}
                    >
                      #INV-0042
                    </div>
                  </div>
                  <div
                    style={{
                      backgroundColor: "var(--md-primary-container)",
                      color: "#fff",
                      fontSize: "8px",
                      fontWeight: 700,
                      padding: "2px 8px",
                      borderRadius: "999px",
                      letterSpacing: "0.04em",
                    }}
                  >
                    PAID
                  </div>
                </div>
                {[
                  ["Design work", "LKR 45,000"],
                  ["Dev hours × 8", "LKR 32,000"],
                  ["Domain renewal", "LKR 3,500"],
                ].map(([label, amount]) => (
                  <div
                    key={label}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginBottom: "5px",
                    }}
                  >
                    <span
                      style={{
                        fontSize: "9px",
                        color: "var(--md-on-surface-variant)",
                      }}
                    >
                      {label}
                    </span>
                    <span
                      style={{
                        fontSize: "9px",
                        fontWeight: 600,
                        color: "var(--md-on-surface)",
                      }}
                    >
                      {amount}
                    </span>
                  </div>
                ))}
                <div
                  style={{
                    borderTop: "1px solid var(--md-outline-variant)",
                    marginTop: "10px",
                    paddingTop: "8px",
                    display: "flex",
                    justifyContent: "space-between",
                  }}
                >
                  <span
                    style={{
                      fontSize: "10px",
                      fontWeight: 700,
                      color: "var(--md-on-surface)",
                    }}
                  >
                    Total
                  </span>
                  <span
                    style={{
                      fontSize: "10px",
                      fontWeight: 700,
                      color: "var(--md-primary-container)",
                    }}
                  >
                    LKR 80,500
                  </span>
                </div>
              </div>
            </div>

            {/* Card 2 — CRM Simplified (narrow, dark) */}
            <div
              className="bento-card-narrow"
              style={{
                backgroundColor: "var(--md-surface-container-highest)",
                borderRadius: "1.5rem",
                padding: "2rem",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                minHeight: "280px",
              }}
            >
              <div
                style={{
                  width: "48px",
                  height: "48px",
                  backgroundColor: "var(--md-surface-container-high)",
                  borderRadius: "12px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <span
                  className="material-symbols-outlined"
                  style={{
                    color: "var(--md-on-surface-variant)",
                    fontSize: "26px",
                  }}
                >
                  group
                </span>
              </div>
              <div>
                <h3
                  style={{
                    fontFamily: "var(--font-heading)",
                    fontSize: "var(--text-lg)",
                    fontWeight: 700,
                    color: "var(--md-on-surface)",
                    margin: "0 0 0.5rem",
                  }}
                >
                  CRM Simplified
                </h3>
                <p
                  style={{
                    fontSize: "var(--text-sm)",
                    color: "var(--md-on-surface-variant)",
                    lineHeight: 1.6,
                    margin: 0,
                  }}
                >
                  Your clients, contacts, and billing history — all in one
                  place.
                </p>
              </div>
            </div>

            {/* Card 3 — Multi-currency (narrow, blue) */}
            <div
              className="bento-card-narrow"
              style={{
                backgroundColor: "var(--md-secondary-container)",
                borderRadius: "1.5rem",
                padding: "2rem",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                minHeight: "240px",
              }}
            >
              <div
                style={{
                  width: "48px",
                  height: "48px",
                  backgroundColor: "rgba(255,255,255,0.4)",
                  borderRadius: "12px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <span
                  className="material-symbols-outlined"
                  style={{
                    color: "var(--md-on-secondary-container)",
                    fontSize: "26px",
                  }}
                >
                  currency_exchange
                </span>
              </div>
              <div>
                <h3
                  style={{
                    fontFamily: "var(--font-heading)",
                    fontSize: "var(--text-lg)",
                    fontWeight: 700,
                    color: "var(--md-on-secondary-container)",
                    margin: "0 0 0.5rem",
                  }}
                >
                  Multi-currency
                </h3>
                <p
                  style={{
                    fontSize: "var(--text-sm)",
                    color: "var(--md-on-secondary-container)",
                    opacity: 0.82,
                    lineHeight: 1.6,
                    margin: 0,
                  }}
                >
                  LKR, USD, EUR, GBP. Bill anyone, anywhere, in their currency.
                </p>
              </div>
            </div>

            {/* Card 4 — One-tap PDF (wide) */}
            <div
              className="bento-card-wide"
              style={{
                backgroundColor: "var(--orange-light)",
                borderRadius: "1.5rem",
                padding: "2.5rem",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                overflow: "hidden",
                minHeight: "240px",
                gap: "2rem",
              }}
            >
              <div style={{ maxWidth: "300px" }}>
                <h3
                  style={{
                    fontFamily: "var(--font-heading)",
                    fontSize: "var(--text-xl)",
                    fontWeight: 700,
                    color: "var(--md-on-surface)",
                    margin: "0 0 0.75rem",
                  }}
                >
                  One-tap PDF
                </h3>
                <p
                  style={{
                    fontSize: "var(--text-base)",
                    color: "var(--md-on-surface-variant)",
                    lineHeight: 1.6,
                    margin: 0,
                  }}
                >
                  Export beautiful, print-ready documents instantly. Works on
                  any screen, every time.
                </p>
              </div>

              {/* PDF mock */}
              <div style={{ flexShrink: 0 }}>
                <div
                  style={{
                    width: "116px",
                    height: "152px",
                    backgroundColor: "var(--md-surface-container-lowest)",
                    borderRadius: "12px",
                    boxShadow: "0 8px 28px rgba(0,0,0,0.12)",
                    transform: "rotate(10deg)",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    border: "2px dashed var(--brand-warning)",
                  }}
                >
                  <span
                    className="material-symbols-outlined"
                    style={{ fontSize: "44px", color: "var(--brand-warning)" }}
                  >
                    picture_as_pdf
                  </span>
                  <span
                    style={{
                      fontSize: "9px",
                      fontWeight: 700,
                      letterSpacing: "0.1em",
                      color: "var(--brand-warning)",
                      marginTop: "6px",
                    }}
                  >
                    PDF EXPORT
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── How it works placeholder ─────────────── */}
      <section
        id="how-it-works"
        style={{
          padding: "5rem 1.5rem",
          backgroundColor: "var(--md-surface-container)",
          textAlign: "center",
        }}
      >
        <p
          style={{
            color: "var(--md-on-surface-variant)",
            fontSize: "var(--text-sm)",
          }}
        >
          How it works placeholder
        </p>
      </section>

      {/* ── Showcase placeholder ─────────────────── */}
      <section
        id="showcase"
        style={{
          padding: "5rem 1.5rem",
          maxWidth: "1100px",
          margin: "0 auto",
          width: "100%",
          textAlign: "center",
        }}
      >
        <p
          style={{
            color: "var(--md-on-surface-variant)",
            fontSize: "var(--text-sm)",
          }}
        >
          Product showcase placeholder
        </p>
      </section>

      {/* ── Closing CTA band ─────────────────────── */}
      <section
        style={{
          padding: "5rem 1.5rem",
          backgroundColor: "var(--md-primary)",
          textAlign: "center",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "1.75rem",
        }}
      >
        <h2
          style={{
            fontFamily: "var(--font-heading)",
            fontSize: "clamp(1.75rem, 4vw, 2.75rem)",
            fontWeight: 800,
            margin: 0,
            color: "var(--md-on-primary)",
          }}
        >
          Ready to send that invoice?
        </h2>
        <p
          style={{
            margin: 0,
            fontSize: "var(--text-lg)",
            color: "var(--md-on-primary)",
            opacity: 0.8,
            maxWidth: "460px",
            lineHeight: 1.6,
          }}
        >
          A calmer way to bill your clients.
        </p>
        {user ? (
          <Link to="/dashboard" style={ctaBtnStyle("lg")}>
            Go to app
          </Link>
        ) : (
          <button onClick={signInWithGoogle} style={ctaBtnStyle("lg")}>
            <GoogleIcon />
            Sign in with Google
          </button>
        )}
      </section>

      {/* ── Footer ───────────────────────────────── */}
      <footer
        style={{
          padding: "2rem 2rem",
          borderTop: "1px solid var(--md-outline-variant)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "1rem",
          fontSize: "var(--text-sm)",
          color: "var(--md-on-surface-variant)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <span
            className="material-symbols-outlined filled"
            style={{ fontSize: "18px", color: "var(--md-primary-container)" }}
          >
            account_balance_wallet
          </span>
          <span
            style={{
              fontFamily: "var(--font-heading)",
              fontWeight: 700,
              color: "var(--md-primary-container)",
            }}
          >
            SimpleBill
          </span>
        </div>

        <p
          style={{
            margin: 0,
            fontSize: "var(--text-xs)",
            color: "var(--md-on-surface-variant)",
          }}
        >
          Made for my dad, and anyone who'd rather not think about invoicing.
        </p>

        <div style={{ display: "flex", gap: "1.5rem", alignItems: "center" }}>
          <Link
            to="/terms"
            style={{
              color: "var(--md-on-surface-variant)",
              textDecoration: "none",
            }}
          >
            Terms
          </Link>
          <a
            href="https://github.com/donkasun/simple-bill"
            target="_blank"
            rel="noreferrer"
            style={{
              color: "var(--md-on-surface-variant)",
              textDecoration: "none",
            }}
          >
            GitHub
          </a>
          <span>© 2026 SimpleBill.</span>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
