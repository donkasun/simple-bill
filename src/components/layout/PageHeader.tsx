import React from "react";

export type PageHeaderProps = {
  title: string;
  subtitle?: string;
  /** Small line above the title (e.g. greeting on Home) */
  eyebrow?: string;
  /** Secondary actions (Cancel, Copy…) placed left of primary actions */
  secondaryActions?: React.ReactNode;
  /** Primary actions aligned to the header (buttons, links) */
  actions?: React.ReactNode;
  /** Larger title for Home */
  size?: "default" | "large";
  /** Top-align actions when there are several buttons (document forms) */
  toolbar?: boolean;
  className?: string;
};

const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  eyebrow,
  secondaryActions,
  actions,
  size = "default",
  toolbar = false,
  className = "",
}) => {
  const rootClass = [
    "page-header",
    size === "large" ? "page-header--large" : "",
    toolbar ? "page-header--toolbar" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  const hasActions = secondaryActions || actions;

  return (
    <header className={rootClass}>
      <div className="page-header__main">
        {eyebrow ? <p className="page-eyebrow">{eyebrow}</p> : null}
        <h1 className="page-title">{title}</h1>
        {subtitle ? <p className="page-subtitle">{subtitle}</p> : null}
      </div>
      {toolbar && hasActions ? (
        <div className="page-header__actions-row">
          {secondaryActions ? (
            <div className="page-header__secondary-actions">
              {secondaryActions}
            </div>
          ) : null}
          {actions ? (
            <div className="page-header__actions">{actions}</div>
          ) : null}
        </div>
      ) : (
        <>
          {secondaryActions ? (
            <div className="page-header__secondary-actions">
              {secondaryActions}
            </div>
          ) : null}
          {actions ? (
            <div className="page-header__actions">{actions}</div>
          ) : null}
        </>
      )}
    </header>
  );
};

export default PageHeader;
