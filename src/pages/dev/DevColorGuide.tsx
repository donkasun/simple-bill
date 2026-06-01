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
        <h2 className="dev-color-section__title">Document status</h2>
        <div className="dev-color-table-wrap">
          <table className="dev-color-table">
            <thead>
              <tr>
                <th scope="col">Status</th>
                <th scope="col">Dashboard bento</th>
                <th scope="col">Row pill</th>
                <th scope="col">Documents list border</th>
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
                      className="dev-color-sample dev-color-sample--bento"
                      style={{
                        backgroundColor: row.bentoBg,
                        color: row.bentoFg,
                      }}
                    >
                      {row.label}
                    </span>
                  </td>
                  <td>
                    <span
                      className="dev-color-sample dev-color-sample--pill"
                      style={{
                        backgroundColor: row.pillBg,
                        color: row.pillFg,
                      }}
                    >
                      {row.label}
                    </span>
                  </td>
                  <td>
                    <span
                      className="dev-color-sample dev-color-sample--border"
                      style={{ borderLeftColor: row.listBorder }}
                    >
                      Border
                    </span>
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

      <section className="dev-color-section">
        <h2 className="dev-color-section__title">Dashboard bento</h2>
        <div className="dev-color-bento-row">
          {STATUS_SAMPLES.map((row) => (
            <div
              key={row.label}
              className="dev-color-bento-card"
              style={{ backgroundColor: row.bentoBg, color: row.bentoFg }}
            >
              <span className="dev-color-bento-card__label">{row.label}</span>
              <span className="dev-color-bento-card__value">12</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default DevColorGuide;
