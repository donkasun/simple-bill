import React, { useMemo, useState } from "react";
import PrimaryButton from "./PrimaryButton";
import SecondaryButton from "./SecondaryButton";

export type OnboardingStep = {
  id: string;
  title: string;
  body: React.ReactNode;
};

type OnboardingStepperProps = {
  title: string;
  steps: OnboardingStep[];
  onDismissForever: () => void;
  dismissLabel?: string;
};

const OnboardingStepper: React.FC<OnboardingStepperProps> = ({
  title,
  steps,
  onDismissForever,
  dismissLabel = "Got it, don’t show again",
}) => {
  const safeSteps = useMemo(() => steps.filter(Boolean), [steps]);
  const [idx, setIdx] = useState(0);
  const step = safeSteps[idx];
  if (!step) return null;

  const canPrev = idx > 0;
  const canNext = idx < safeSteps.length - 1;

  return (
    <div
      className="card"
      style={{
        padding: 16,
        marginBottom: 16,
        border: "1px solid var(--md-outline-variant)",
      }}
      aria-label="First invoice guide"
    >
      <div
        style={{ display: "flex", justifyContent: "space-between", gap: 12 }}
      >
        <div>
          <div
            style={{
              fontFamily: "var(--font-heading)",
              fontSize: 18,
              fontWeight: 700,
              marginBottom: 4,
              color: "var(--md-on-surface)",
            }}
          >
            {title}
          </div>
          <div
            style={{
              fontFamily: "var(--font-body)",
              fontSize: 14,
              fontWeight: 700,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              color: "var(--md-on-surface-variant)",
            }}
          >
            Step {idx + 1} of {safeSteps.length}: {step.title}
          </div>
        </div>
        <button
          type="button"
          onClick={onDismissForever}
          className="link-btn"
          style={{ minHeight: 44, alignSelf: "flex-start" }}
        >
          {dismissLabel}
        </button>
      </div>

      <div style={{ marginTop: 12 }}>{step.body}</div>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: 8,
          marginTop: 16,
        }}
      >
        <SecondaryButton
          type="button"
          onClick={() => setIdx((v) => Math.max(0, v - 1))}
          disabled={!canPrev}
          aria-disabled={!canPrev}
        >
          Back
        </SecondaryButton>
        <div style={{ display: "flex", gap: 8 }}>
          <SecondaryButton type="button" onClick={() => setIdx(0)}>
            Restart
          </SecondaryButton>
          <PrimaryButton
            type="button"
            onClick={() => setIdx((v) => Math.min(safeSteps.length - 1, v + 1))}
            disabled={!canNext}
            aria-disabled={!canNext}
          >
            {canNext ? "Next" : "Done"}
          </PrimaryButton>
        </div>
      </div>
    </div>
  );
};

export default OnboardingStepper;
