import EditorialSplit from "@/components/ui/EditorialSplit";
import EyebrowTag from "@/components/ui/EyebrowTag";
import Reveal from "@/components/ui/Reveal";
import Stagger from "@/components/ui/Stagger";
import SpecimenCard from "./SpecimenCard";

export default function IntroSection() {
  return (
    <EditorialSplit
      rail={
        <div className="flex flex-col gap-4">
          <EyebrowTag>UNE INTRODUCTION</EyebrowTag>
          <h2 className="font-display text-display text-ink-900">
            We are entirely serious about this.
          </h2>
        </div>
      }
    >
      <Stagger className="flex flex-col gap-6">
        <p className="max-w-[52ch] text-body text-ink-700">
          We built this because <em>&ldquo;is this normal for me?&rdquo;</em>{" "}
          has no answer without a baseline, and almost nobody has one.
          Digestive health is universal and unspeakable at the same time,
          which is a reliable recipe for an information vacuum.
        </p>
        <p className="max-w-[52ch] text-body text-ink-700">
          Everything else here &mdash; the streaks, the ranks, the medals,
          the discreet talk of a Gold Circle &mdash; exists to solve one
          problem: a record with gaps in it is not a record. Maison de Merde
          is a tracking and pattern-recognition instrument. It is not a
          medical device, it does not diagnose anything, and it will tell
          you so until you are bored of hearing it.
        </p>
      </Stagger>
      <Reveal delay={0.12} className="mt-10 md:mt-12 md:max-w-[420px]">
        <SpecimenCard />
      </Reveal>
    </EditorialSplit>
  );
}
