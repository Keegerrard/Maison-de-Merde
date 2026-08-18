import Icon from "../ui/Icon";
import { formatSessionTime } from "@/lib/format";
import { COLOR_LABELS, COLOR_SWATCHES } from "@/lib/enums";
import { BRISTOL_COLORS } from "@/lib/bristol";
import type { SessionRow as SessionRowType } from "@/lib/types";

// Reads GET /api/sessions row shape — snake_case (§0.3), unlike the
// camelCase POST body used by DetailLogForm/QuickLogCard.
export default function SessionRow({ session }: { session: SessionRowType }) {
  return (
    <div className="flex flex-wrap items-center gap-3 px-4 py-4 md:px-6">
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
            quick log
          </span>
        )}

        {session.color ? (
          <span className="inline-flex items-center gap-1.5 rounded-pill bg-paper-sunk px-2.5 py-1 text-small text-ink-700 ring-1 ring-rule">
            <span
              className="h-2 w-2 rounded-full ring-1 ring-rule-strong"
              style={{ backgroundColor: COLOR_SWATCHES[session.color] }}
              aria-hidden="true"
            />
            {COLOR_LABELS[session.color]}
          </span>
        ) : null}

        {session.blood_flag ? (
          <span className="inline-flex items-center gap-1.5 rounded-pill bg-claret-100 px-2.5 py-1 text-small text-claret-600 ring-1 ring-claret-200">
            <Icon name="Droplet" size={12} />
            blood flagged
          </span>
        ) : null}
      </div>
    </div>
  );
}
