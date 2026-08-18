import { useId, type InputHTMLAttributes } from "react";
import Icon from "./Icon";

interface CheckboxProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  label: string;
}

export default function Checkbox({
  label,
  id,
  className = "",
  checked,
  ...rest
}: CheckboxProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;

  return (
    <label
      htmlFor={inputId}
      className={["flex cursor-pointer items-center gap-2.5", className]
        .filter(Boolean)
        .join(" ")}
    >
      <span className="relative inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-[6px] bg-paper-sunk ring-1 ring-rule-strong">
        <input
          id={inputId}
          type="checkbox"
          className="peer absolute inset-0 h-full w-full cursor-pointer appearance-none"
          checked={checked}
          {...rest}
        />
        {checked ? (
          <Icon name="Check" size={13} className="text-sage-700" />
        ) : null}
      </span>
      <span className="text-small text-ink-700">{label}</span>
    </label>
  );
}
