import type { Metadata } from "next";
import ArticleLayout from "@/components/ui/ArticleLayout";
import Rule from "@/components/ui/Rule";

export const metadata: Metadata = {
  title: "Why we did not invent our own scale — Maison de Merde",
  description:
    "A clinically validated seven-point taxonomy already exists. Using it was the entire decision.",
};

const TYPES: { n: number; label: string }[] = [
  { n: 1, label: "Separate hard lumps" },
  { n: 2, label: "Lumpy sausage" },
  { n: 3, label: "Cracked sausage" },
  { n: 4, label: "Smooth, soft sausage" },
  { n: 5, label: "Soft blobs" },
  { n: 6, label: "Mushy, ragged" },
  { n: 7, label: "Entirely liquid" },
];

export default function BristolScalePage() {
  return (
    <ArticleLayout kicker="TAXONOMIE" title="Why we did not invent our own scale">
      <p>
        The temptation, building a product like this, is to invent something
        better: a proprietary ten-point scale, a set of friendlier names, an
        in-house taxonomy with a trademark symbol quietly attached. We
        considered it for approximately as long as it takes to say out loud,
        and then adopted the Bristol Stool Scale instead, unmodified, exactly
        as Lewis and Heaton published it in the{" "}
        <em className="font-display text-ink-900">
          Scandinavian Journal of Gastroenterology
        </em>{" "}
        in 1997.
      </p>
      <p>
        The scale describes seven forms, defined by shape and consistency
        rather than by anything more subjective:
      </p>
      <ul className="flex flex-col gap-2">
        {TYPES.map((t) => (
          <li key={t.n} className="text-body">
            <span className="font-mono text-small text-ink-900">
              Type {t.n}
            </span>{" "}
            — {t.label}.
          </li>
        ))}
      </ul>

      <Rule />

      <p>
        Types 3 and 4 sit at the center of the scale for a reason: together
        they represent the band correlated with normal colonic transit time,
        the pace at which digested material typically moves through the gut.
        Types 1 and 2 correlate with slower transit — material that has spent
        longer than usual in the colon, where more water is reabsorbed and
        the result hardens accordingly. Types 5 through 7 correlate with
        faster transit, trending toward too little water reabsorption at
        all. The scale is, underneath the plain-language descriptions, a
        proxy for a physiological rate, which is why it has held up
        clinically for almost three decades rather than being a piece of
        branding.
      </p>
      <p>
        That is the entire case for using it instead of writing our own. A
        validated instrument earns two things a bespoke one cannot, no
        matter how carefully designed: credibility and legibility.
        Credibility, because &ldquo;we measured this ourselves&rdquo; is a
        much weaker claim than &ldquo;this is the classification
        gastroenterology already uses,&rdquo; and a health-adjacent product
        that quietly substitutes its own taxonomy for an established one is
        betting against its own trustworthiness for no real gain.
        Legibility, because the entire point of the doctor export feature is
        that someone other than you should be able to open it and understand
        it instantly — a physician who has never seen this product before
        already knows what a Type 6 means. A house taxonomy would need to be
        explained before it could be used, which defeats the purpose of
        exporting anything at all.
      </p>
      <p>
        There was a genuine design cost to this decision, and it is worth
        naming rather than glossing over: the Bristol Scale was not built
        with a consumer app&rsquo;s tone in mind, and its seven categories do
        not map cleanly onto encouraging, friendly UI copy. &ldquo;Separate
        hard lumps&rdquo; is accurate and is also not a phrase most products
        would choose to put in front of a user first thing in the morning.
        We kept the clinical language anyway, verbatim, rather than
        softening it into something more palatable and less precise.
        Precision was the entire reason to adopt the scale in the first
        place; diluting the wording to make it more comfortable would have
        quietly undone the one advantage it offers.
      </p>

      <Rule />

      <p className="font-mono text-eyebrow uppercase tracking-[0.22em] text-ink-500">
        Ce que ce n&rsquo;est pas
      </p>
      <p>
        One thing the scale does not do, and was never designed to do, is
        issue a verdict. A Type 1 or Type 7 logged once is not a diagnosis,
        an emergency, or even necessarily noteworthy — bodies vary, diets
        vary, a single data point varies for reasons that have nothing to do
        with health. What the scale is good at is showing a pattern over
        time: a form that drifts and stays drifted is worth a conversation
        with a doctor; a form that varies normally around Type 3 or 4 across
        weeks is doing what stool sanely does. A Bristol type describes what
        a session looked like. It does not, on its own, describe how you are
        doing.
      </p>
    </ArticleLayout>
  );
}
