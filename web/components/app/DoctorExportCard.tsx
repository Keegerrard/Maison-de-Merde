import Icon from "../ui/Icon";
import DoubleBezelCard from "../ui/DoubleBezelCard";
import ArrowCTAButton from "../ui/ArrowCTAButton";

export default function DoctorExportCard() {
  return (
    <DoubleBezelCard className="flex-1">
      <Icon name="FileText" size={20} className="text-ink-700" strokeWidth={1.25} />
      <h3 className="mt-4 font-display text-title text-ink-900">
        Doctor export.
      </h3>
      <p className="mt-2 text-body text-ink-500">
        Totals, Bristol distribution, and every session flagged for blood or
        severe straining. De-identified by default.
      </p>
      <ArrowCTAButton
        href="/api/dashboard/export"
        download
        className="mt-6"
      >
        Exporter le résumé (.txt)
      </ArrowCTAButton>
      <p className="mt-4 font-mono text-small text-ink-300">
        Written to be handed over, not to be admired.
      </p>
    </DoubleBezelCard>
  );
}
