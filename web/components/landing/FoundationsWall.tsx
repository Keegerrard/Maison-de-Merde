import EditorialSplit from "@/components/ui/EditorialSplit";
import SectionHeading from "@/components/ui/SectionHeading";
import Rule from "@/components/ui/Rule";
import Reveal from "@/components/ui/Reveal";
import Stagger from "@/components/ui/Stagger";
import CitationCard from "./CitationCard";
import CommitmentRow from "./CommitmentRow";

// Row 1 — the only two citations this product cites. Do not add a third:
// a fabricated reference is the same failure mode as a fabricated
// testimonial (plan §C.7). If more visual weight is ever needed, widen
// these two cards — never invent a peer.
const CITATIONS = [
  {
    index: "01",
    authors: "Lewis, S. J. & Heaton, K. W.",
    year: "1997",
    title: "Stool Form Scale as a Useful Guide to Intestinal Transit Time",
    source: "Scandinavian Journal of Gastroenterology, 32(9), 920–924.",
    gloss:
      "The seven types. We adopted them rather than inventing our own, for the obvious reason.",
  },
  {
    index: "02",
    authors: "Kahneman, D. & Tversky, A.",
    year: "1979",
    title: "Prospect Theory: An Analysis of Decision under Risk",
    source: "Econometrica, 47(2), 263–291.",
    gloss:
      "Loss aversion. Why an unbroken streak is harder to abandon than a new one is to begin.",
  },
] as const;

// Row 2 — deliberately not formatted as citations, so they can't be
// mistaken for references. Plain hairline-ruled cells, one honest note
// each on what was borrowed.
const PRIOR_ART = [
  {
    title: "Streak mechanics in habit-formation apps",
    note: "Loss aversion again: consecutive days are worth more than the sum of their parts.",
  },
  {
    title: "Opt-in leaderboards in social fitness",
    note: "Visibility, not obligation — competing here is a choice, never a default.",
  },
  {
    title: "Photo-in, structured-data-out consumer health tools",
    note: "A photograph becomes a number. The number is what gets tracked.",
  },
] as const;

// Row 3 — final copy, drawn verbatim from README §8. Do not edit.
const COMMITMENTS = [
  {
    label: "PHOTOGRAPHS",
    statement: "Deleted after inference. Retained only if you explicitly ask.",
  },
  {
    label: "HEALTH DATA",
    statement: "Never sold. Not a policy that could be revised — a constraint.",
  },
  {
    label: "PORTABILITY",
    statement: "Export everything, or destroy everything, at any time.",
  },
  {
    label: "SCOPE",
    statement:
      "Not a medical device. Not a diagnosis. Flags point you at a doctor, never at a conclusion.",
  },
] as const;

export default function FoundationsWall() {
  return (
    <EditorialSplit
      id="cercle"
      rail={
        <SectionHeading
          eyebrow="LE CERCLE"
          title="There are no customers to quote."
          lede="So here is what the product rests on instead — two citations we did not write, three patterns we did not invent, and four constraints we do not get to revise."
        />
      }
    >
      <div className="flex flex-col gap-16 md:gap-20">
        {/* Row 1 — works cited */}
        <div className="flex flex-col gap-5">
          <span className="font-mono text-eyebrow uppercase tracking-[0.22em] text-ink-500">
            Works cited
          </span>
          <Stagger
            step={0.08}
            className="grid grid-cols-1 gap-6 md:grid-cols-2 md:gap-8"
          >
            {CITATIONS.map((c) => (
              <CitationCard key={c.index} {...c} />
            ))}
          </Stagger>
        </div>

        {/* Row 2 — prior art */}
        <div className="flex flex-col gap-5">
          <span className="font-mono text-eyebrow uppercase tracking-[0.22em] text-ink-500">
            Prior art
          </span>
          <Stagger className="grid grid-cols-1 gap-8 md:grid-cols-3 md:gap-10">
            {PRIOR_ART.map((cell) => (
              <div key={cell.title} className="flex flex-col gap-3">
                <Rule />
                <p className="font-display text-lede text-ink-900">
                  {cell.title}
                </p>
                <p className="text-small text-ink-500">{cell.note}</p>
              </div>
            ))}
          </Stagger>
        </div>

        {/* Row 3 — commitments */}
        <div className="flex flex-col gap-5">
          <span className="font-mono text-eyebrow uppercase tracking-[0.22em] text-ink-500">
            Commitments
          </span>
          <div className="flex flex-col">
            {COMMITMENTS.map((c, i) => (
              <CommitmentRow
                key={c.label}
                label={c.label}
                statement={c.statement}
                index={i}
              />
            ))}
          </div>
        </div>
      </div>
    </EditorialSplit>
  );
}
