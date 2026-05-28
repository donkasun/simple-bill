import React, { useMemo, useState } from "react";
import Button from "./Button";

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
    <div className="onboarding-guide" aria-label="First invoice guide">
      <div className="onboarding-guide__header">
        <div className="onboarding-guide__header-top">
          <div className="onboarding-guide__title">{title}</div>
          <button
            type="button"
            onClick={onDismissForever}
            className="link-btn onboarding-guide__dismiss"
          >
            {dismissLabel}
          </button>
        </div>
        <div className="onboarding-guide__step-label">
          Step {idx + 1} of {safeSteps.length}: {step.title}
        </div>
      </div>

      <div className="onboarding-guide__body">{step.body}</div>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: 8,
          marginTop: 16,
        }}
      >
        <Button
          type="button"
          variant="secondary"
          onClick={() => setIdx((v) => Math.max(0, v - 1))}
          disabled={!canPrev}
          aria-disabled={!canPrev}
        >
          Back
        </Button>
        <div style={{ display: "flex", gap: 8 }}>
          <Button type="button" variant="secondary" onClick={() => setIdx(0)}>
            Restart
          </Button>
          <Button
            type="button"
            onClick={() => setIdx((v) => Math.min(safeSteps.length - 1, v + 1))}
            disabled={!canNext}
            aria-disabled={!canNext}
          >
            {canNext ? "Next" : "Done"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default OnboardingStepper;
