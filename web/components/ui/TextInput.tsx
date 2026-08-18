import { useId, type InputHTMLAttributes } from "react";

interface TextInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  mono?: boolean;
}

export default function TextInput({
  label,
  error,
  mono = false,
  id,
  className = "",
  ...rest
}: TextInputProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={inputId} className="text-small font-medium text-ink-700">
        {label}
      </label>
      <input
        id={inputId}
        className={[
          "rounded-sm bg-paper-sunk px-4 py-3 text-body text-ink-900",
          "ring-1 ring-rule placeholder:text-ink-300",
          "transition-shadow duration-[160ms] ease-out",
          "focus:outline-none focus:ring-2 focus:ring-sage-500",
          mono ? "font-mono" : "",
          error ? "ring-claret-200" : "",
          className,
        ]
          .filter(Boolean)
          .join(" ")}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${inputId}-error` : undefined}
        {...rest}
      />
      {error ? (
        <p id={`${inputId}-error`} className="text-small text-claret-600">
          {error}
        </p>
      ) : null}
    </div>
  );
}
