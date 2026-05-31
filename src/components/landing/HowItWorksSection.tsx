import { useEffect, useRef, useState, type CSSProperties } from "react";
import TypewriterText from "./TypewriterText";

const STEPS = [
  {
    id: "add",
    label: "Add",
    title: "Add your client and what you charge for",
    body: "Set it up once. SimpleBill remembers your people and your usual charges.",
    image: "/how-it-works/step-add.png",
    imageAlt: "Customers and items screens in SimpleBill",
    rotate: -5,
    offsetX: 0,
    offsetY: 0,
  },
  {
    id: "build",
    label: "Build",
    title: "Build the invoice",
    body: "Pick a client, drop in your line items, and the total adds itself up.",
    image: "/how-it-works/step-build.png",
    imageAlt: "Line items on an invoice in SimpleBill",
    rotate: 4.5,
    offsetX: 22,
    offsetY: -18,
  },
  {
    id: "send",
    label: "Send",
    title: "Send it and move on",
    body: "Download the PDF, send it off, and get back to the work that pays you.",
    image: "/how-it-works/step-send.png",
    imageAlt: "Dashboard showing invoice status in SimpleBill",
    rotate: -2.5,
    offsetX: -18,
    offsetY: -32,
  },
] as const;

const STEP_COUNT = STEPS.length;

export default function HowItWorksSection() {
  const stageRef = useRef<HTMLDivElement>(null);
  const [activeStep, setActiveStep] = useState(0);
  const [descVisible, setDescVisible] = useState(false);
  const [enteringIndex, setEnteringIndex] = useState<number | null>(0);
  const prevStepRef = useRef(0);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;

    const updateStep = () => {
      const rect = stage.getBoundingClientRect();
      const scrollable = stage.offsetHeight - window.innerHeight;
      if (scrollable <= 0) return;

      const progress = Math.max(0, Math.min(1, -rect.top / scrollable));
      const step = Math.min(STEP_COUNT - 1, Math.floor(progress * STEP_COUNT));
      setActiveStep(step);
    };

    window.addEventListener("scroll", updateStep, { passive: true });
    window.addEventListener("resize", updateStep);
    updateStep();
    return () => {
      window.removeEventListener("scroll", updateStep);
      window.removeEventListener("resize", updateStep);
    };
  }, []);

  useEffect(() => {
    if (activeStep > prevStepRef.current) {
      setEnteringIndex(activeStep);
    } else {
      setEnteringIndex(null);
    }
    prevStepRef.current = activeStep;

    setDescVisible(false);
    const reduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const delay = reduced ? 0 : STEPS[activeStep].title.length * 32 + 120;
    const id = window.setTimeout(() => setDescVisible(true), delay);
    return () => window.clearTimeout(id);
  }, [activeStep]);

  return (
    <section id="how-it-works">
      <style>{`
        .how-scroll-stage {
          --how-card-width: clamp(340px, 44vw, 560px);
          --how-card-height: clamp(300px, 40vw, 500px);
        }
        @keyframes typewriter-cursor {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
        @keyframes card-drop {
          from {
            opacity: 0;
            transform: translate(-50%, -50%) translateY(-90px) rotate(0deg) scale(0.96);
          }
          to {
            opacity: 1;
            transform: translate(-50%, -50%) rotate(var(--card-rot)) translate(var(--card-x), var(--card-y));
          }
        }
        .how-sticky-panel {
          display: grid;
          grid-template-rows: auto minmax(0, 1fr);
          gap: clamp(1.5rem, 3vh, 2.5rem);
          width: min(1400px, 96vw);
          margin-inline: auto;
        }
        .how-stage-header {
          text-align: center;
          padding-top: clamp(3rem, 7vh, 5.5rem);
        }
        .how-sticky-inner {
          display: grid;
          grid-template-columns: minmax(0, 2fr) minmax(0, 3fr);
          gap: clamp(1.75rem, 3.5vw, 3rem);
          align-items: center;
          width: 100%;
          min-height: min(560px, calc(100vh - 64px - 8rem));
        }
        .how-stack-card {
          position: absolute;
          left: 50%;
          top: 50%;
          width: var(--how-card-width);
          padding: 10px;
          background: var(--md-surface-container-lowest);
          border-radius: 20px;
          border: 1px solid var(--md-outline-variant);
          box-shadow:
            0 2px 0 rgba(255, 255, 255, 0.8) inset,
            0 16px 40px rgba(0, 0, 0, 0.08);
          transform: translate(-50%, -50%) rotate(var(--card-rot)) translate(var(--card-x), var(--card-y));
          transform-origin: center center;
          transition: box-shadow 0.3s ease, opacity 0.3s ease;
        }
        .how-stack-card--top {
          box-shadow:
            0 2px 0 rgba(255, 255, 255, 0.9) inset,
            0 28px 56px rgba(0, 0, 0, 0.12),
            0 10px 24px rgba(0, 0, 0, 0.06);
        }
        .how-stack-card:not(.how-stack-card--top) {
          opacity: 0.88;
          box-shadow:
            0 1px 0 rgba(255, 255, 255, 0.6) inset,
            0 8px 20px rgba(0, 0, 0, 0.05);
        }
        .how-stack-card--enter {
          animation: card-drop 0.55s cubic-bezier(0.22, 1, 0.36, 1) forwards;
        }
        .how-stack-card img {
          display: block;
          width: 100%;
          aspect-ratio: 16 / 10;
          object-fit: cover;
          object-position: top center;
          border-radius: 12px;
          border: 1px solid color-mix(in srgb, var(--md-outline-variant) 60%, transparent);
          background: var(--md-surface-container-lowest);
        }
        .how-stack-card--top img {
          border-color: color-mix(in srgb, var(--md-outline-variant) 80%, transparent);
        }
        .how-stack-card:not(.how-stack-card--top) img {
          filter: saturate(0.92) brightness(0.98);
        }
        .how-stack-scene {
          position: relative;
          width: calc(var(--how-card-width) + 64px);
          height: var(--how-card-height);
          z-index: 1;
        }
        .how-stack-wrap {
          position: relative;
          min-height: var(--how-card-height);
          display: flex;
          align-items: center;
          justify-content: center;
          width: 100%;
        }
        .how-stack-wrap::before {
          content: "";
          position: absolute;
          inset: -8% -4%;
          background: radial-gradient(
            ellipse at center,
            color-mix(in srgb, var(--green-light) 70%, transparent) 0%,
            transparent 72%
          );
          pointer-events: none;
          z-index: 0;
        }
        .how-step-copy {
          display: flex;
          flex-direction: column;
          justify-content: center;
          min-height: min(420px, calc(100vh - 64px - 10rem));
          padding-block: 1rem;
        }
        .how-step-desc {
          transition: opacity 0.35s ease, transform 0.35s ease;
        }
        .how-step-desc--visible {
          opacity: 1;
          transform: translateY(0);
        }
        .how-step-desc--hidden {
          opacity: 0;
          transform: translateY(6px);
        }
        @media (min-width: 1200px) {
          .how-scroll-stage {
            --how-card-width: clamp(440px, 36vw, 600px);
            --how-card-height: clamp(360px, 32vw, 540px);
          }
          .how-sticky-inner {
            grid-template-columns: minmax(0, 5fr) minmax(0, 7fr);
            gap: clamp(2rem, 4vw, 4rem);
          }
        }
        @media (min-width: 901px) and (min-height: 900px) {
          .how-scroll-stage {
            --how-card-width: clamp(400px, 40vw, 580px);
            --how-card-height: clamp(340px, 36vw, 520px);
          }
        }
        @media (max-width: 900px) {
          .how-sticky-inner {
            grid-template-columns: 1fr !important;
            gap: 2.5rem !important;
            min-height: auto !important;
          }
          .how-scroll-stage {
            height: auto !important;
          }
          .how-sticky-panel {
            position: relative !important;
            top: auto !important;
            min-height: auto !important;
            width: 100% !important;
            padding-inline: 1.5rem !important;
          }
          .how-stack-wrap {
            min-height: 280px !important;
          }
          .how-step-copy {
            min-height: auto !important;
          }
          .how-mobile-steps {
            display: flex !important;
            flex-direction: column;
            gap: 2.5rem;
          }
          .how-desktop-only {
            display: none !important;
          }
        }
        @media (min-width: 901px) {
          .how-mobile-steps {
            display: none !important;
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .how-stack-card--enter {
            animation: none;
          }
          .how-step-desc--hidden {
            opacity: 1;
            transform: none;
          }
        }
      `}</style>

      {/* Desktop: sticky scroll (header lives inside sticky panel) */}
      <div
        ref={stageRef}
        className="how-scroll-stage how-desktop-only"
        style={{ height: `${STEP_COUNT * 75 + 25}vh` }}
      >
        <div
          className="how-sticky-panel how-desktop-only"
          style={{
            position: "sticky",
            top: "64px",
            minHeight: "calc(100vh - 64px)",
            padding: "1rem 1.5rem 2.5rem",
          }}
        >
          <div className="how-stage-header">
            <p
              style={{
                margin: "0 0 0.5rem",
                fontSize: "var(--text-sm)",
                fontWeight: 600,
                color: "var(--md-primary-container)",
                letterSpacing: "0.06em",
                textTransform: "uppercase",
              }}
            >
              How it works
            </p>
            <h2
              style={{
                fontFamily: "var(--font-heading)",
                fontSize: "clamp(1.5rem, 2.2vw, 2rem)",
                fontWeight: 800,
                margin: 0,
                color: "var(--md-on-surface)",
                maxWidth: "520px",
                marginInline: "auto",
                lineHeight: 1.2,
              }}
            >
              Blank page to sent invoice
            </h2>
          </div>

          <div className="how-sticky-inner">
            {/* Left — step text */}
            <div className="how-step-copy">
              <div
                style={{
                  display: "flex",
                  gap: "0.5rem",
                  marginBottom: "1.25rem",
                }}
                aria-label="Progress"
              >
                {STEPS.map((step, i) => (
                  <span
                    key={step.id}
                    style={{
                      fontSize: "var(--text-xs)",
                      fontWeight: 700,
                      letterSpacing: "0.08em",
                      textTransform: "uppercase",
                      color:
                        i === activeStep
                          ? "var(--md-primary-container)"
                          : i < activeStep
                            ? "var(--md-on-surface-variant)"
                            : "var(--md-outline-variant)",
                      transition: "color 0.25s ease",
                    }}
                  >
                    {step.label}
                    {i < STEPS.length - 1 ? (
                      <span
                        aria-hidden
                        style={{
                          marginLeft: "0.5rem",
                          color: "var(--md-outline-variant)",
                          fontWeight: 400,
                        }}
                      >
                        ·
                      </span>
                    ) : null}
                  </span>
                ))}
              </div>

              <TypewriterText
                key={activeStep}
                animationKey={activeStep}
                text={STEPS[activeStep].title}
                style={{
                  fontFamily: "var(--font-heading)",
                  fontSize: "clamp(1.75rem, 2.8vw, 2.75rem)",
                  fontWeight: 700,
                  margin: "0 0 1.25rem",
                  color: "var(--md-on-surface)",
                  lineHeight: 1.2,
                  minHeight: "2.5em",
                  maxWidth: "520px",
                }}
              />

              <p
                className={`how-step-desc ${descVisible ? "how-step-desc--visible" : "how-step-desc--hidden"}`}
                style={{
                  margin: 0,
                  fontSize: "clamp(1rem, 1.15vw, 1.125rem)",
                  lineHeight: 1.65,
                  color: "var(--md-on-surface-variant)",
                  maxWidth: "480px",
                }}
              >
                {STEPS[activeStep].body}
              </p>
            </div>

            {/* Right — stacked cards */}
            <div className="how-stack-wrap" aria-hidden>
              <div className="how-stack-scene">
                {STEPS.map((step, i) => {
                  if (i > activeStep) return null;
                  const isEntering = i === enteringIndex;
                  const isTop = i === activeStep;
                  const cardTransform = `translate(-50%, -50%) rotate(${step.rotate}deg) translate(${step.offsetX}px, ${step.offsetY}px)`;
                  return (
                    <div
                      key={step.id}
                      className={`how-stack-card${isEntering ? " how-stack-card--enter" : ""}${isTop ? " how-stack-card--top" : ""}`}
                      style={
                        {
                          zIndex: i + 1,
                          "--card-rot": `${step.rotate}deg`,
                          "--card-x": `${step.offsetX}px`,
                          "--card-y": `${step.offsetY}px`,
                          transform: isEntering ? undefined : cardTransform,
                        } as CSSProperties
                      }
                    >
                      <img
                        src={step.image}
                        alt={step.imageAlt}
                        loading="lazy"
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile: static stacked steps */}
      <div
        className="how-mobile-steps"
        style={{
          maxWidth: "1100px",
          margin: "0 auto",
          padding: "4.5rem 1.5rem 5rem",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: "2.5rem" }}>
          <p
            style={{
              margin: "0 0 0.5rem",
              fontSize: "var(--text-sm)",
              fontWeight: 600,
              color: "var(--md-primary-container)",
              letterSpacing: "0.06em",
              textTransform: "uppercase",
            }}
          >
            How it works
          </p>
          <h2
            style={{
              fontFamily: "var(--font-heading)",
              fontSize: "clamp(1.5rem, 4vw, 2rem)",
              fontWeight: 800,
              margin: 0,
              color: "var(--md-on-surface)",
              lineHeight: 1.2,
            }}
          >
            Blank page to sent invoice
          </h2>
        </div>
        {STEPS.map((step, i) => (
          <article key={step.id}>
            <p
              style={{
                margin: "0 0 0.5rem",
                fontSize: "var(--text-xs)",
                fontWeight: 700,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: "var(--md-primary-container)",
              }}
            >
              {i + 1}. {step.label}
            </p>
            <h3
              style={{
                fontFamily: "var(--font-heading)",
                fontSize: "var(--text-xl)",
                fontWeight: 700,
                margin: "0 0 0.75rem",
                color: "var(--md-on-surface)",
              }}
            >
              {step.title}
            </h3>
            <p
              style={{
                margin: "0 0 1.25rem",
                fontSize: "var(--text-base)",
                lineHeight: 1.65,
                color: "var(--md-on-surface-variant)",
              }}
            >
              {step.body}
            </p>
            <img
              src={step.image}
              alt={step.imageAlt}
              loading="lazy"
              style={{
                width: "100%",
                maxWidth: "480px",
                aspectRatio: "16 / 10",
                objectFit: "cover",
                objectPosition: "top center",
                borderRadius: "14px",
                border: "1px solid var(--md-outline-variant)",
                boxShadow: "0 12px 32px rgba(0,0,0,0.1)",
              }}
            />
          </article>
        ))}
      </div>
    </section>
  );
}
