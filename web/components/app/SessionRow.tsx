import Icon from "../ui/Icon";
import { formatSessionTime } from "@/lib/format";
import { COLOR_LABELS, COLOR_SWATCHES } from "@/lib/enums";
import { BRISTOL_COLORS } from "@/lib/bristol";
import { useLanguage } from "@/hooks/useLanguage";
import type { SessionRow as SessionRowType } from "@/lib/types";

// Reads GET /api/sessions row shape — snake_case (§0.3), unlike the
// camelCase POST body used by DetailLogForm/QuickLogCard.
export default function SessionRow({
  session,
  onClick,
}: {
  session: SessionRowType;
  onClick?: () => void;
}) {
  const { t, tEnum } = useLanguage();
  return (
    <div
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={
        onClick
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onClick();
              }
            }
          : undefined
      }
      className={[
        "flex w-full flex-wrap items-center gap-3 px-4 py-4 text-left md:px-6",
        onClick
          ? "cursor-pointer transition-colors duration-150 [@media(hover:hover)_and_(pointer:fine)]:hover:bg-paper-sunk"
          : "",
      ].join(" ")}
    >
      <span className="font-mono text-small text-ink-500">
        {formatSessionTime(session.occurred_at)}
      </span>

      <div className="flex flex-wrap items-center gap-2">
        {session.bristol_type ? (
          <span className="inline-flex items-center gap-1.5 rounded-pill bg-paper-sunk px-2.5 py-1 text-small text-ink-700 ring-1 ring-rule">
            <span
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: BRISTOL_COLORS[session.bristol_type - 1] }}
              aria-hidden="true"
            />
            Type {session.bristol_type}
          </span>
        ) : (
          <span className="inline-flex items-center rounded-pill bg-paper-sunk px-2.5 py-1 text-small text-ink-500 ring-1 ring-rule">
            {t("session.quickLog")}
          </span>
        )}

        {session.color ? (
          <span className="inline-flex items-center gap-1.5 rounded-pill bg-paper-sunk px-2.5 py-1 text-small text-ink-700 ring-1 ring-rule">
            <span
              className="h-2 w-2 rounded-full ring-1 ring-rule-strong"
              style={{ backgroundColor: COLOR_SWATCHES[session.color] }}
              aria-hidden="true"
            />
            {tEnum("color", session.color, COLOR_LABELS[session.color])}
          </span>
        ) : null}

        {session.blood_flag ? (
          <span className="inline-flex items-center gap-1.5 rounded-pill bg-claret-100 px-2.5 py-1 text-small text-claret-600 ring-1 ring-claret-200">
            <Icon name="Droplet" size={12} />
            {t("session.bloodFlagged")}
          </span>
        ) : null}
      </div>
    </div>
  );
}
