import React from "react";
import type { DashboardStatusCounts } from "@hooks/pages/useDashboardPage";
import { dashboardIntroAnimationClasses } from "@utils/dashboardIntroAnimation";

type DashboardSummaryStripProps = {
  playIntro?: boolean;
  statusCounts: DashboardStatusCounts;
  onPaidClick: () => void;
  onSentClick: () => void;
  onDraftClick: () => void;
};

type StatusCardConfig = {
  key: "paid" | "sent" | "draft";
  label: string;
  icon: string;
  filled?: boolean;
  countKey: keyof DashboardStatusCounts;
  className: string;
  delayClass: string;
  onClick: () => void;
};

const DashboardSummaryStrip: React.FC<DashboardSummaryStripProps> = ({
  playIntro = false,
  statusCounts,
  onPaidClick,
  onSentClick,
  onDraftClick,
}) => {
  const cards: StatusCardConfig[] = [
    {
      key: "paid",
      label: "Paid",
      icon: "check_circle",
      filled: true,
      countKey: "paidCount",
      className: "dashboard-status-card--paid",
      delayClass: "dashboard-animate-fade-up--delay-1",
      onClick: onPaidClick,
    },
    {
      key: "sent",
      label: "Sent",
      icon: "arrow_forward",
      countKey: "sentCount",
      className: "dashboard-status-card--sent",
      delayClass: "dashboard-animate-fade-up--delay-2",
      onClick: onSentClick,
    },
    {
      key: "draft",
      label: "Draft",
      icon: "edit",
      countKey: "draftCount",
      className: "dashboard-status-card--draft",
      delayClass: "dashboard-animate-fade-up--delay-3",
      onClick: onDraftClick,
    },
  ];

  return (
    <section
      className="dashboard-status-bento"
      aria-label="Invoice status summary"
    >
      {cards.map((card) => (
        <button
          key={card.key}
          type="button"
          className={`dashboard-status-card ${card.className} ${dashboardIntroAnimationClasses(playIntro, card.delayClass)} dashboard-soft-shadow`.trim()}
          onClick={card.onClick}
        >
          <div className="dashboard-status-card__head">
            <span className="dashboard-status-card__label">{card.label}</span>
            <span className="dashboard-status-card__chip" aria-hidden>
              <span
                className={`material-symbols-outlined${card.filled ? " filled" : ""}`}
              >
                {card.icon}
              </span>
            </span>
          </div>
          <span className="dashboard-status-card__value">
            {statusCounts[card.countKey]}
          </span>
        </button>
      ))}
    </section>
  );
};

export default DashboardSummaryStrip;
