import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { usePageTitle } from "@components/layout/PageTitleContext";
import { isLocalDevHost } from "@utils/isLocalDevHost";
import Button from "@components/core/Button";

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section style={{ marginBottom: "2rem" }}>
      <h2
        style={{
          fontSize: "var(--text-sm)",
          textTransform: "uppercase",
          letterSpacing: "0.08em",
          color: "var(--md-on-surface-variant)",
          marginBottom: "1rem",
        }}
      >
        {title}
      </h2>
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "0.75rem",
          alignItems: "center",
        }}
      >
        {children}
      </div>
    </section>
  );
}

export default function DevButtonGuide() {
  usePageTitle("Dev · Buttons");
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLocalDevHost()) navigate("/", { replace: true });
  }, [navigate]);

  return (
    <div style={{ padding: "2rem", maxWidth: 800 }}>
      <h1 style={{ fontSize: "var(--text-xl)", marginBottom: "2rem" }}>
        Button component
      </h1>

      <Section title="Primary (default)">
        <Button>Save changes</Button>
        <Button disabled>Disabled</Button>
      </Section>

      <Section title="Secondary">
        <Button variant="secondary">Cancel</Button>
        <Button variant="secondary" disabled>
          Disabled
        </Button>
      </Section>

      <Section title="Prominent (pill CTA)">
        <Button prominent>New invoice</Button>
        <Button prominent variant="secondary">
          Browse
        </Button>
        <Button prominent disabled>
          Disabled
        </Button>
      </Section>

      <Section title="With icon">
        <Button>
          <span
            className="material-symbols-outlined filled"
            aria-hidden
            style={{ fontSize: 20 }}
          >
            add_circle
          </span>
          New invoice
        </Button>
        <Button variant="secondary">
          <span
            className="material-symbols-outlined"
            aria-hidden
            style={{ fontSize: 20 }}
          >
            download
          </span>
          Download PDF
        </Button>
        <Button prominent>
          <span
            className="material-symbols-outlined filled"
            aria-hidden
            style={{ fontSize: 20 }}
          >
            add_circle
          </span>
          New invoice
        </Button>
      </Section>

      <Section title="Full width">
        <div style={{ width: "100%" }}>
          <Button style={{ width: "100%" }}>Full-width primary</Button>
        </div>
        <div style={{ width: "100%" }}>
          <Button variant="secondary" style={{ width: "100%" }}>
            Full-width secondary
          </Button>
        </div>
      </Section>
    </div>
  );
}
