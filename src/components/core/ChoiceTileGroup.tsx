export type ChoiceTileOption<T extends string> = {
  value: T;
  label: string;
};

type ChoiceTileGroupProps<T extends string> = {
  id: string;
  ariaLabel: string;
  value: T;
  options: ChoiceTileOption<T>[];
  onChange: (value: T) => void;
  columns?: 2 | 3 | 4;
  disabled?: boolean;
};

const ChoiceTileGroup = <T extends string>({
  id,
  ariaLabel,
  value,
  options,
  onChange,
  columns = 3,
  disabled = false,
}: ChoiceTileGroupProps<T>) => {
  return (
    <div
      className={`choice-tile-group choice-tile-group--cols-${columns}`}
      role="radiogroup"
      aria-label={ariaLabel}
      id={id}
    >
      {options.map((opt) => {
        const selected = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={selected}
            className={`choice-tile${selected ? " is-selected" : ""}`}
            onClick={() => onChange(opt.value)}
            disabled={disabled}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
};

export default ChoiceTileGroup;
