import Icon from "../ui/Icon";
import DoubleBezelCard from "../ui/DoubleBezelCard";
import ArrowCTAButton from "../ui/ArrowCTAButton";
import { useLanguage } from "@/hooks/useLanguage";

export default function DoctorExportCard() {
  const { t } = useLanguage();
  return (
    <DoubleBezelCard className="flex-1">
      <Icon name="FileText" size={20} className="text-ink-700" strokeWidth={1.25} />
      <h3 className="mt-4 font-display text-title text-ink-900">
        {t("export.title")}
      </h3>
      <p className="mt-2 text-body text-ink-500">
        {t("export.desc")}
      </p>
      <ArrowCTAButton
        href="/api/dashboard/export"
        download
        className="mt-6"
      >
        {t("export.button")}
      </ArrowCTAButton>
      <p className="mt-4 font-mono text-small text-ink-300">
        {t("export.footnote")}
      </p>
    </DoubleBezelCard>
  );
}
