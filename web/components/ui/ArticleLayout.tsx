import type { ReactNode } from "react";
import Rule from "./Rule";
import FooterWordmark from "./FooterWordmark";

/**
 * Shared reading-page shell for the three /journal/* articles. Server
 * component — no hooks, no motion. A narrow `max-w-[62ch]` column, a serif
 * H1, a mono metadata line (journal context + kicker), and the same
 * FooterWordmark used on the landing page, rendered full-width outside the
 * reading column.
 */
export default function ArticleLayout({
  kicker,
  title,
  children,
}: {
  kicker: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <>
      <article className="mx-auto w-full max-w-[1180px] px-5 pt-16 md:px-10 md:pt-24">
        <div className="mx-auto flex max-w-[62ch] flex-col">
          <a
            href="/#journal"
            className="inline-flex w-fit items-center text-small text-ink-500 transition-colors duration-[140ms] ease-out [@media(hover:hover)_and_(pointer:fine)]:hover:text-ink-900"
          >
            ← Retour
          </a>

          <p className="mt-10 font-mono text-eyebrow uppercase tracking-[0.22em] text-ink-500">
            LE JOURNAL · {kicker}
          </p>
          <h1 className="mt-4 font-display text-display text-ink-900">
            {title}
          </h1>

          <Rule className="my-10" />

          <div className="flex flex-col gap-6 font-sans text-lede text-ink-700">
            {children}
          </div>
        </div>
      </article>

      <div className="mt-28 md:mt-40">
        <FooterWordmark />
      </div>
    </>
  );
}
