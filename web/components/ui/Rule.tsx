export default function Rule({
  strong = false,
  className = "",
}: {
  strong?: boolean;
  className?: string;
}) {
  return (
    <hr
      className={[
        "border-0 h-px",
        strong ? "bg-rule-strong" : "bg-rule",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    />
  );
}
