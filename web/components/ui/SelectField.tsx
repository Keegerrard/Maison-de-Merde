import { useId, type SelectHTMLAttributes } from "react";
import Icon from "./Icon";

interface Option {
  value: string;
  label: string;
  swatch?: string;
}

interface SelectFieldProps
  extends Omit<SelectHTMLAttributes<HTMLSelectElement>, "children"> {
  label: string;
  options: readonly Option[];
}

export default function SelectField({
  label,
  options,
  id,
  className = "",
  ...rest
}: SelectFieldProps) {
  const generatedId = useId();
  const selectId = id ?? generatedId;
  const hasSwatches = options.some((o) => o.swatch);
  const currentSwatch = options.find((o) => o.value === rest.value)?.swatch;

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={selectId} className="text-small font-medium text-ink-700">
        {label}
      </label>
      <div className="relative">
        {hasSwatches ? (
          <span
            aria-hidden="true"
            className="absolute left-4 top-1/2 h-2.5 w-2.5 -translate-y-1/2 rounded-full ring-1 ring-rule-strong"
            style={{ backgroundColor: currentSwatch }}
          />
        ) : null}
        <select
          id={selectId}
          className={[
            "w-full appearance-none rounded-sm bg-paper-sunk py-3 pr-10 text-body text-ink-900",
            hasSwatches ? "pl-9" : "pl-4",
            "ring-1 ring-rule",
            "transition-shadow duration-[160ms] ease-out",
            "focus:outline-none focus:ring-2 focus:ring-sage-500",
            className,
          ]
            .filter(Boolean)
            .join(" ")}
          {...rest}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <Icon
          name="ChevronDown"
          size={16}
          className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-ink-300"
        />
      </div>
    </div>
  );
}
