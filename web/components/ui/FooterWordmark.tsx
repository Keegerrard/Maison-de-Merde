import Rule from "./Rule";

// Server component — no hooks, no motion. The plan's optional parallax
// drift on the wordmark (useScroll) was skipped deliberately: it's a
// nice-to-have, not required, and this component is shared by the
// landing page and the (static, server-rendered) journal article pages,
// so staying hook-free keeps it drop-in everywhere without a "use client"
// boundary forcing itself onto callers that don't otherwise need one.

interface FooterColumn {
  heading: string;
  links: { label: string; href: string }[];
}

const COLUMNS: FooterColumn[] = [
  {
    heading: "LE SYSTÈME",
    links: [
      { label: "Les Services", href: "/#systeme" },
      { label: "Les Quatre Systèmes", href: "/#systeme" },
      { label: "Le Cercle", href: "/#cercle" },
    ],
  },
  {
    heading: "LE JOURNAL",
    links: [
      { label: "Comment fonctionne la série", href: "/journal/streak-engine/" },
      { label: "L'échelle de Bristol", href: "/journal/bristol-scale/" },
      { label: "Vos photographies", href: "/journal/photographs/" },
    ],
  },
  {
    heading: "LA MAISON",
    links: [
      { label: "Entrer", href: "/app/" },
      { label: "Méthodologie", href: "/journal/bristol-scale/" },
      { label: "Confidentialité", href: "/journal/photographs/" },
    ],
  },
];

export default function FooterWordmark({
  className = "",
}: {
  className?: string;
}) {
  return (
    <footer
      className={["relative overflow-hidden pt-24 pb-0", className]
        .filter(Boolean)
        .join(" ")}
    >
      <div className="mx-auto w-full max-w-[1180px] px-5 md:px-10">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-3 sm:gap-6">
          {COLUMNS.map((column) => (
            <div key={column.heading} className="flex flex-col gap-4">
              <p className="font-mono text-eyebrow uppercase text-ink-500">
                {column.heading}
              </p>
              <ul className="flex flex-col gap-3">
                {column.links.map((link) => (
                  <li key={`${column.heading}-${link.label}`}>
                    <a
                      href={link.href}
                      className="text-small text-ink-700 transition-colors duration-[140ms] ease-out hover:text-ink-900"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <Rule className="mt-16" />

        <p className="max-w-[62ch] py-8 font-mono text-eyebrow uppercase text-ink-300">
          MAISON DE MERDE IS A TRACKING AND PATTERN-RECOGNITION TOOL. IT IS
          NOT A MEDICAL DEVICE AND DOES NOT DIAGNOSE ANY CONDITION. ·
          ÉTABLIE 2026 · PURVEYORS OF FINE DIGESTIVE DISTINCTION
        </p>
      </div>

      <div
        aria-hidden="true"
        className="translate-y-[18%] pl-5 md:pl-10"
      >
        <div className="select-none pointer-events-none font-display text-[clamp(2.25rem,18vw,5rem)] leading-[0.8] text-ink-900/[0.07] md:text-[clamp(3rem,15vw,13rem)] md:whitespace-nowrap">
          MAISON DE MERDE
        </div>
      </div>
    </footer>
  );
}
