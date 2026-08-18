import type { ReactNode } from "react";

export default function EditorialSplit({
  rail,
  children,
  stickyRail = false,
  id,
  className = "",
}: {
  rail: ReactNode;
  children: ReactNode;
  stickyRail?: boolean;
  id?: string;
  className?: string;
}) {
  return (
    <section
      id={id}
      className={[
        "mx-auto w-full max-w-[1180px] px-5 py-28 md:px-10 md:py-40",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div className="grid grid-cols-1 gap-y-10 md:grid-cols-12 md:gap-x-16">
        <div
          className={[
            "md:col-span-4",
            stickyRail ? "md:sticky md:top-28 md:self-start" : "",
          ]
            .filter(Boolean)
            .join(" ")}
        >
          {rail}
        </div>
        <div className="md:col-span-8">{children}</div>
      </div>
    </section>
  );
}
