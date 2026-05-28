export type SegmentedToggleOption<T extends string> = {
  value: T;
  label: string;
};

type SegmentedToggleProps<T extends string> = {
  label?: string;
  ariaLabel?: string;
  value: T;
  options: SegmentedToggleOption<T>[];
  onChange: (value: T) => void;
  disabled?: boolean;
  id?: string;
};

const SegmentedToggle = <T extends string>({
  label,
  ariaLabel,
  value,
  options,
  onChange,
  disabled = false,
  id,
}: SegmentedToggleProps<T>) => {
  return (
    <div className="SegmentedToggle">
      {label ? (
        <div
          className="SegmentedToggle__label"
          id={id ? `${id}-label` : undefined}
        >
          {label}
        </div>
      ) : null}

      <div
        className="SegmentedToggle__group"
        role="radiogroup"
        aria-labelledby={label && id ? `${id}-label` : undefined}
        aria-label={!label ? (ariaLabel ?? id) : undefined}
      >
        {options.map((opt) => {
          const selected = opt.value === value;
          return (
            <button
              key={opt.value}
              type="button"
              role="radio"
              aria-checked={selected}
              className={`SegmentedToggle__option${selected ? " is-selected" : ""}`}
              onClick={() => onChange(opt.value)}
              disabled={disabled}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default SegmentedToggle;
