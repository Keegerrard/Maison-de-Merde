import EditorialSplit from "@/components/ui/EditorialSplit";
import SectionHeading from "@/components/ui/SectionHeading";
import Stagger from "@/components/ui/Stagger";
import JournalCard from "./JournalCard";

// Three load-bearing trust articles, not a decorative blog. See plan §C.8 /
// §0.5 — these double as the sincere half of the satire, so the copy here
// is verbatim against the plan and must not drift.
const ARTICLES = [
  {
    href: "/journal/streak-engine/",
    kicker: "METHODOLOGY",
    title: "How the streak actually works",
    standfirst:
      "Grace tokens, freezes, and why a missed Tuesday is not a moral failure.",
  },
  {
    href: "/journal/bristol-scale/",
    kicker: "TAXONOMY",
    title: "Why we did not invent our own scale",
    standfirst:
      "A clinically validated seven-point taxonomy already exists. Using it was the entire decision.",
  },
  {
    href: "/journal/photographs/",
    kicker: "CONFIDENTIALITY",
    title: "What happens to your photograph",
    standfirst:
      "It goes to a model once, the model answers, and then it is gone. Unless you say otherwise.",
  },
] as const;

export default function JournalTeaserGrid() {
  return (
    <EditorialSplit
      id="journal"
      rail={
        <SectionHeading
          eyebrow="THE JOURNAL"
          title="Three things worth reading before you start."
        />
      }
    >
      <Stagger className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {ARTICLES.map((article) => (
          <JournalCard key={article.href} {...article} />
        ))}
      </Stagger>
    </EditorialSplit>
  );
}
