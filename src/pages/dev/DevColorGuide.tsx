import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { usePageTitle } from "@components/layout/PageTitleContext";
import { isLocalDevHost } from "@utils/isLocalDevHost";
import {
  DASHBOARD_TOKENS,
  PRIMARY_TOKENS,
  STATUS_SAMPLES,
  SURFACE_TOKENS,
  type TokenRow,
} from "./devColorGuideData";

function Swatch({ color }: { color: string }) {
  return (
    <span
      className="dev-color-swatch"
      style={{ backgroundColor: color }}
      aria-hidden
    />
  );
}

function ColorCell({ hex }: { hex: string }) {
  return (
    <span className="dev-color-cell">
      <Swatch color={hex} />
      <code>{hex}</code>
    </span>
  );
}

function TokenTable({ title, rows }: { title: string; rows: TokenRow[] }) {
  return (
    <section className="dev-color-section">
      <h2 className="dev-color-section__title">{title}</h2>
      <div className="dev-color-table-wrap">
        <table className="dev-color-table">
          <thead>
            <tr>
              <th scope="col">Token</th>
              <th scope="col">Light</th>
              <th scope="col">Dark</th>
              <th scope="col">Used for</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.token}>
                <td>
                  <code className="dev-color-token">{row.token}</code>
                </td>
                <td>
                  <ColorCell hex={row.light} />
                </td>
                <td>
                  <ColorCell hex={row.dark} />
                </td>
                <td>{row.use}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

const DevColorGuide = () => {
  usePageTitle("Color guide (dev)");
  const navigate = useNavigate();
  const allowed = isLocalDevHost();

  useEffect(() => {
    if (!allowed) {
      navigate("/dashboard", { replace: true });
    }
  }, [allowed, navigate]);

  if (!allowed) {
    return null;
  }

  return (
    <div className="app-page dev-color-guide">
      <header className="dev-color-guide__header">
        <h1 className="page-title">Dashboard &amp; Settings colors</h1>
        <p className="page-subtitle">
          Quick reference for light and dark tokens. Source:{" "}
          <code>src/index.css</code>
        </p>
      </header>

      <TokenTable title="Primary &amp; status" rows={PRIMARY_TOKENS} />
      <TokenTable title="Surfaces &amp; text" rows={SURFACE_TOKENS} />
      <TokenTable title="Dashboard &amp; settings" rows={DASHBOARD_TOKENS} />

      <section className="dev-color-section">
        <h2 className="dev-color-section__title">Document status pills</h2>
        <div className="dev-color-table-wrap">
          <table className="dev-color-table">
            <thead>
              <tr>
                <th scope="col">Status</th>
                <th scope="col">Light theme pill</th>
                <th scope="col">Dark theme pill</th>
              </tr>
            </thead>
            <tbody>
              {STATUS_SAMPLES.map((row) => (
                <tr key={row.label}>
                  <td>
                    <strong>{row.label}</strong>
                  </td>
                  <td>
                    <span
                      className="dev-color-sample dev-color-sample--pill"
                      style={{
                        backgroundColor: row.light.pillBg,
                        color: row.light.pillFg,
                      }}
                    >
                      {row.label}
                    </span>
                    <code
                      style={{
                        marginLeft: 8,
                        fontSize: "0.75rem",
                        opacity: 0.7,
                      }}
                    >
                      {row.light.pillBg}
                    </code>
                  </td>
                  <td style={{ background: "#191c1d", borderRadius: 6 }}>
                    <span
                      className="dev-color-sample dev-color-sample--pill"
                      style={{
                        backgroundColor: row.dark.pillBg,
                        color: row.dark.pillFg,
                      }}
                    >
                      {row.label}
                    </span>
                    <code
                      style={{
                        marginLeft: 8,
                        fontSize: "0.75rem",
                        opacity: 0.7,
                        color: "#bfc9c1",
                      }}
                    >
                      {row.dark.pillBg}
                    </code>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="dev-color-section">
        <h2 className="dev-color-section__title">Settings tiles</h2>
        <div className="dev-color-previews">
          <div className="dev-color-preview-card">
            <span className="dev-color-preview-card__label">Unselected</span>
            <button
              type="button"
              className="dev-color-preview-settings"
              disabled
            >
              LKR · sample
            </button>
          </div>
          <div className="dev-color-preview-card">
            <span className="dev-color-preview-card__label">
              Selected (light)
            </span>
            <button
              type="button"
              className="dev-color-preview-settings is-selected"
              disabled
            >
              LKR · sample
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default DevColorGuide;
