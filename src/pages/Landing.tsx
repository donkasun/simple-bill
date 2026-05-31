import { Link, useNavigate } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "@auth/useAuth";
import DisintegratingText from "@components/effects/DisintegratingText";
import CtaCoinsBackground from "@components/landing/CtaCoinsBackground";
import HowItWorksSection from "@components/landing/HowItWorksSection";
import { scrollToSection } from "@utils/scrollToSection";

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

const NAV_LINKS = [
  { label: "Features", href: "#features", id: "features" },
  { label: "How it works", href: "#how-it-works", id: "how-it-works" },
] as const;

const Landing = () => {
  const { user, signInWithGoogle } = useAuth();
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [glow, setGlow] = useState({ x: -1000, y: -1000 });
  const heroRef = useRef<HTMLHeadingElement>(null);

  const handleSectionNavClick = (
    e: React.MouseEvent<HTMLAnchorElement>,
    sectionId: string,
  ) => {
    e.preventDefault();
    scrollToSection(sectionId);
  };

  useEffect(() => {
    if (user) navigate("/dashboard", { replace: true });
  }, [user, navigate]);

  useEffect(() => {
    const onMove = (e: MouseEvent) => setGlow({ x: e.clientX, y: e.clientY });
    window.addEventListener("mousemove", onMove, { passive: true });
    return () => window.removeEventListener("mousemove", onMove);
  }, []);

  useEffect(() => {
    const updateNav = () => {
      setScrolled(window.scrollY > 16);

      const featuresEl = document.getElementById("features");
      const howEl = document.getElementById("how-it-works");
      if (!featuresEl) return;

      const navOffset = 80;
      const y = window.scrollY + navOffset;

      if (y < featuresEl.offsetTop) {
        setActiveSection(null);
      } else if (howEl && y >= howEl.offsetTop) {
        setActiveSection("how-it-works");
      } else {
        setActiveSection("features");
      }
    };

    window.addEventListener("scroll", updateNav, { passive: true });
    updateNav();
    return () => window.removeEventListener("scroll", updateNav);
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
      {/* Cursor-following glow (behind page content) */}
      <div
        aria-hidden
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "500px",
          height: "500px",
          borderRadius: "50%",
          background: "var(--features-glow)",
          filter: "blur(100px)",
          opacity: 0.55,
          transform: `translate(${glow.x - 250}px, ${glow.y - 250}px)`,
          transition: "transform 0.15s ease-out, opacity 0.3s ease",
          pointerEvents: "none",
          zIndex: 0,
          willChange: "transform",
        }}
      />

      <div
        style={{
          position: "relative",
          zIndex: 1,
          flex: 1,
          display: "flex",
          flexDirection: "column",
          minHeight: "100dvh",
        }}
      >
        {/* ── Nav ─────────────────────────────────────── */}
        <nav
          style={{
            position: "sticky",
            top: 0,
            zIndex: 100,
            display: "grid",
            gridTemplateColumns: "1fr auto 1fr",
            alignItems: "center",
            padding: "0 2rem",
            height: "64px",
            backgroundColor: scrolled
              ? "rgba(248,249,250,0.88)"
              : "transparent",
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
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              justifySelf: "start",
            }}
          >
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
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.25rem",
              justifySelf: "center",
            }}
          >
            {NAV_LINKS.map(({ label, href, id }) => {
              const isActive = activeSection === id;
              return (
                <a
                  key={href}
                  href={href}
                  onClick={(e) => handleSectionNavClick(e, id)}
                  style={{
                    padding: "0.375rem 0.875rem",
                    fontSize: "var(--text-base)",
                    fontWeight: isActive ? 700 : 400,
                    color: isActive
                      ? "var(--md-primary-container)"
                      : "var(--md-on-surface-variant)",
                    textDecoration: "none",
                    borderBottom: isActive
                      ? "2px solid var(--md-primary-container)"
                      : "2px solid transparent",
                    lineHeight: "1.5",
                  }}
                >
                  {label}
                </a>
              );
            })}
          </div>

          {/* Right CTA */}
          <div style={{ justifySelf: "end" }}>
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
            ref={heroRef}
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
            <DisintegratingText
              text="Then forget about it."
              color="var(--md-primary-container)"
              triggerRef={heroRef}
            />
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
            Bill the clients you already know, without fighting a spreadsheet.
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
            <a
              href="#how-it-works"
              style={outlineBtnStyle("md")}
              onClick={(e) => handleSectionNavClick(e, "how-it-works")}
            >
              See how it works
            </a>
          </div>
        </main>

        {/* ── Features bento grid ──────────────────── */}
        <section
          id="features"
          style={{
            padding: "5rem 1.5rem",
            backgroundColor: "var(--green-light)",
          }}
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
          .bento-card-wide, .bento-card-narrow {
            transition: background-color 0.25s ease;
          }
          /* Card 1 — Invoices (mint green, Stitch #9ef8ac) */
          .bento-card-1 { background-color: #9ef8ac; }
          .bento-card-1:hover { background-color: var(--md-primary-container); }
          .bento-c1-heading { color: var(--md-primary); transition: color 0.25s ease; }
          .bento-card-1:hover .bento-c1-heading { color: #ffffff; }
          .bento-c1-body { color: var(--md-on-primary-container); transition: color 0.25s ease; }
          .bento-card-1:hover .bento-c1-body { color: rgba(255,255,255,0.85); }
          /* Card 1 — button on card hover */
          .bento-c1-btn { transition: background-color 0.25s ease, color 0.25s ease; }
          .bento-card-1:hover .bento-c1-btn { background-color: var(--green-light) !important; color: var(--md-primary-container) !important; }
          /* Card 2 — CRM (gray) */
          .bento-card-2 { background-color: var(--md-surface-container-highest); }
          .bento-card-2:hover { background-color: var(--md-outline); }
          .bento-c2-icon-wrap { background-color: var(--md-surface-container-high); transition: background-color 0.25s ease; }
          .bento-card-2:hover .bento-c2-icon-wrap { background-color: var(--md-surface-container-highest); }
          .bento-c2-icon { color: var(--md-on-surface-variant); transition: color 0.25s ease; }
          .bento-card-2:hover .bento-c2-icon { color: var(--md-on-surface); }
          .bento-c2-heading { color: var(--md-on-surface); transition: color 0.25s ease; }
          .bento-card-2:hover .bento-c2-heading { color: var(--md-surface-container-highest); }
          .bento-c2-body { color: var(--md-on-surface-variant); transition: color 0.25s ease; }
          .bento-card-2:hover .bento-c2-body { color: var(--md-surface-container-highest); }
          /* Card 3 — Multi-currency (blue) */
          .bento-card-3 { background-color: var(--md-secondary-container); }
          .bento-card-3:hover { background-color: var(--md-secondary-mid); }
          .bento-c3-icon-wrap { background-color: rgba(255,255,255,0.4); transition: background-color 0.25s ease; }
          .bento-card-3:hover .bento-c3-icon-wrap { background-color: rgba(255,255,255,0.2); }
          .bento-c3-icon { color: var(--md-on-secondary-container); transition: color 0.25s ease; }
          .bento-card-3:hover .bento-c3-icon { color: #ffffff; }
          .bento-c3-heading { color: var(--md-on-secondary-container); transition: color 0.25s ease; }
          .bento-card-3:hover .bento-c3-heading { color: #ffffff; }
          .bento-c3-body { color: var(--md-on-secondary-container); transition: color 0.25s ease; }
          .bento-card-3:hover .bento-c3-body { color: rgba(255,255,255,0.85); }
          /* Mockup lift animations */
          .bento-c1-mockup {
            transform: translateY(-50%) rotate(-3deg);
            transition: transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
          }
          .bento-card-1:hover .bento-c1-mockup {
            transform: translateY(-50%) rotate(-6deg) scale(1.06);
          }
          .bento-c4-mockup {
            transform: rotate(10deg);
            transition: transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
          }
          .bento-card-4:hover .bento-c4-mockup {
            transform: rotate(14deg) scale(1.06);
          }
          /* Card 4 — One-tap PDF (amber) */
          .bento-card-4 { background-color: var(--orange-light); }
          .bento-card-4:hover { background-color: var(--brand-warning); }
          .bento-c4-heading { color: var(--md-on-surface); transition: color 0.25s ease; }
          .bento-card-4:hover .bento-c4-heading { color: var(--md-surface); }
          .bento-c4-body { color: var(--md-on-surface-variant); transition: color 0.25s ease; }
          .bento-card-4:hover .bento-c4-body { color: var(--md-surface); }
        `}</style>

          <div
            style={{
              maxWidth: "1100px",
              margin: "0 auto",
              width: "100%",
              position: "relative",
              zIndex: 1,
            }}
          >
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
                What you need, nothing more
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
                For people who invoice sometimes, not all day.
              </p>
            </div>

            {/* Grid */}
            <div className="bento-grid">
              {/* Card 1 — Invoices & Quotations (wide) */}
              <div
                className="bento-card-wide bento-card-1"
                style={{
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
                    className="bento-c1-heading"
                    style={{
                      fontFamily: "var(--font-heading)",
                      fontSize: "var(--text-xl)",
                      fontWeight: 700,
                      margin: "0 0 0.75rem",
                    }}
                  >
                    Invoices &amp; Quotations
                  </h3>
                  <p
                    className="bento-c1-body"
                    style={{
                      fontSize: "var(--text-base)",
                      lineHeight: 1.6,
                      margin: "0 0 1.5rem",
                    }}
                  >
                    Quotes and invoices use the same flow. When they&apos;re
                    ready to pay, flip it to an invoice without starting over.
                  </p>
                  <button className="bento-c1-btn" style={ctaBtnStyle("sm")}>
                    Explore features
                  </button>
                </div>

                {/* Mini invoice mockup */}
                <div
                  className="bento-c1-mockup"
                  style={{
                    position: "absolute",
                    right: "2rem",
                    top: "50%",
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
                className="bento-card-narrow bento-card-2"
                style={{
                  borderRadius: "1.5rem",
                  padding: "2rem",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  minHeight: "280px",
                }}
              >
                <div
                  className="bento-c2-icon-wrap"
                  style={{
                    width: "48px",
                    height: "48px",
                    borderRadius: "12px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <span
                    className="material-symbols-outlined bento-c2-icon"
                    style={{ fontSize: "26px" }}
                  >
                    group
                  </span>
                </div>
                <div>
                  <h3
                    className="bento-c2-heading"
                    style={{
                      fontFamily: "var(--font-heading)",
                      fontSize: "var(--text-lg)",
                      fontWeight: 700,
                      margin: "0 0 0.5rem",
                    }}
                  >
                    Your regulars, saved
                  </h3>
                  <p
                    className="bento-c2-body"
                    style={{
                      fontSize: "var(--text-sm)",
                      lineHeight: 1.6,
                      margin: 0,
                    }}
                  >
                    Keep the people you bill in one place. No more retyping
                    names and emails every month.
                  </p>
                </div>
              </div>

              {/* Card 3 — Multi-currency (narrow, blue) */}
              <div
                className="bento-card-narrow bento-card-3"
                style={{
                  borderRadius: "1.5rem",
                  padding: "2rem",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  minHeight: "240px",
                }}
              >
                <div
                  className="bento-c3-icon-wrap"
                  style={{
                    width: "48px",
                    height: "48px",
                    borderRadius: "12px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <span
                    className="material-symbols-outlined bento-c3-icon"
                    style={{ fontSize: "26px" }}
                  >
                    currency_exchange
                  </span>
                </div>
                <div>
                  <h3
                    className="bento-c3-heading"
                    style={{
                      fontFamily: "var(--font-heading)",
                      fontSize: "var(--text-lg)",
                      fontWeight: 700,
                      margin: "0 0 0.5rem",
                    }}
                  >
                    Multi-currency
                  </h3>
                  <p
                    className="bento-c3-body"
                    style={{
                      fontSize: "var(--text-sm)",
                      lineHeight: 1.6,
                      margin: 0,
                    }}
                  >
                    LKR, USD, EUR, GBP. Bill in whatever currency your client
                    actually pays in.
                  </p>
                </div>
              </div>

              {/* Card 4 — One-tap PDF (wide) */}
              <div
                className="bento-card-wide bento-card-4"
                style={{
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
                    className="bento-c4-heading"
                    style={{
                      fontFamily: "var(--font-heading)",
                      fontSize: "var(--text-xl)",
                      fontWeight: 700,
                      margin: "0 0 0.75rem",
                    }}
                  >
                    One-tap PDF
                  </h3>
                  <p
                    className="bento-c4-body"
                    style={{
                      fontSize: "var(--text-base)",
                      lineHeight: 1.6,
                      margin: 0,
                    }}
                  >
                    Turn any document into a PDF you can email or WhatsApp. One
                    tap.
                  </p>
                </div>

                {/* PDF mock */}
                <div style={{ flexShrink: 0 }}>
                  <div
                    className="bento-c4-mockup"
                    style={{
                      width: "116px",
                      height: "152px",
                      backgroundColor: "var(--md-surface-container-lowest)",
                      borderRadius: "12px",
                      boxShadow: "0 8px 28px rgba(0,0,0,0.12)",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      border: "2px dashed var(--brand-warning)",
                    }}
                  >
                    <span
                      className="material-symbols-outlined"
                      style={{
                        fontSize: "44px",
                        color: "var(--brand-warning)",
                      }}
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

        {/* ── Marquee strip ──────────────────────────── */}
        <section
          style={{
            overflow: "hidden",
            backgroundColor: "var(--md-primary)",
            padding: "1rem 0",
            position: "relative",
          }}
          aria-label="Feature highlights"
        >
          <style>{`
          @keyframes marquee {
            from { transform: translateX(0); }
            to   { transform: translateX(-50%); }
          }
          .marquee-track {
            display: flex;
            width: max-content;
            animation: marquee 30s linear infinite;
            user-select: none;
          }
          .marquee-track:hover { animation-play-state: paused; }
          .marquee-item {
            display: flex;
            align-items: center;
            gap: 0.625rem;
            padding: 0 1.25rem;
            font-size: var(--text-sm);
            font-weight: 500;
            color: var(--md-on-primary);
            white-space: nowrap;
            opacity: 0.9;
          }
          .marquee-sep {
            color: var(--md-on-primary);
            opacity: 0.4;
            font-size: 0.5rem;
            flex-shrink: 0;
          }
        `}</style>
          <div className="marquee-track" aria-hidden="true">
            {(() => {
              const items = [
                { label: "Invoices", icon: "receipt_long" },
                { label: "Quotations", icon: "request_quote" },
                { label: "Multi-currency", icon: "currency_exchange" },
                { label: "One-tap PDF", icon: "picture_as_pdf" },
                { label: "Repeat clients", icon: "group" },
                { label: "LKR", icon: "payments" },
                { label: "USD", icon: "attach_money" },
                { label: "EUR", icon: "euro" },
                { label: "GBP", icon: "currency_pound" },
              ];
              // Repeat the set enough times that one copy is wider than even
              // ultra-wide viewports, so the -50% loop never reveals empty space.
              const perCopy = Array.from({ length: 4 }).flatMap(() => items);
              return [0, 1].map((copy) => (
                <div
                  key={copy}
                  style={{ display: "flex", alignItems: "center" }}
                >
                  {perCopy.map(({ label, icon }, i) => (
                    <div
                      key={`${copy}-${i}`}
                      style={{ display: "flex", alignItems: "center" }}
                    >
                      <span className="marquee-item">
                        <span
                          className="material-symbols-outlined"
                          style={{ fontSize: "16px", opacity: 0.8 }}
                        >
                          {icon}
                        </span>
                        {label}
                      </span>
                      <span className="marquee-sep">◆</span>
                    </div>
                  ))}
                </div>
              ));
            })()}
          </div>
        </section>

        <HowItWorksSection />

        {/* ── Closing CTA band ─────────────────────── */}
        <section
          style={{
            padding: "5rem 1.5rem",
            backgroundColor: "var(--md-primary)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            position: "relative",
            overflow: "hidden",
          }}
        >
          <CtaCoinsBackground />
          <div
            style={{
              maxWidth: "640px",
              width: "100%",
              backgroundColor: "var(--md-surface-container-lowest)",
              borderRadius: "2rem",
              padding: "4rem 3rem",
              boxShadow: "0 8px 48px rgba(0,0,0,0.07)",
              position: "relative",
              zIndex: 1,
              textAlign: "center",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "1.25rem",
            }}
          >
            <h2
              style={{
                fontFamily: "var(--font-heading)",
                fontSize: "clamp(1.75rem, 4vw, 2.5rem)",
                fontWeight: 800,
                margin: 0,
                color: "var(--md-on-surface)",
              }}
            >
              Ready to send that invoice?
            </h2>
            <p
              style={{
                margin: 0,
                fontSize: "var(--text-base)",
                color: "var(--md-on-surface-variant)",
                maxWidth: "400px",
                lineHeight: 1.65,
              }}
            >
              Free to use. No credit card, no sales call.
            </p>
            <div style={{ marginTop: "0.5rem" }}>
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
            </div>
            <p
              style={{
                margin: 0,
                fontSize: "var(--text-xs)",
                color: "var(--md-on-surface-variant)",
                opacity: 0.7,
              }}
            >
              Sign in with Google and send your first invoice in about a minute.
            </p>
          </div>
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
            backgroundColor: "var(--md-surface)",
            position: "relative",
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
    </div>
  );
};

export default Landing;
