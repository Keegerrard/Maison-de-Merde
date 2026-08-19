import type { Metadata } from "next";
import ArticleLayout from "@/components/ui/ArticleLayout";
import Rule from "@/components/ui/Rule";

export const metadata: Metadata = {
  title: "How the streak actually works — Maison de Merde",
  description:
    "Grace tokens, freezes, and why a missed Tuesday is not a moral failure.",
};

export default function StreakEnginePage() {
  return (
    <ArticleLayout kicker="METHODOLOGY" title="How the streak actually works">
      <p>
        A streak is not a mood. It is a small, exact piece of arithmetic that
        runs once a day: did this account log at least one session today? If
        yes, the streak extends by one. If no, one of two things happens — a
        grace token is spent silently on your behalf, or the count returns to
        zero. Nothing about the number is subjective, and nothing about it is
        trying to guilt you; it is simply counting.
      </p>
      <p>
        The counting happens on unique days, not on sessions. Log three times
        in one day and the streak moves by exactly one day, the same as
        logging once. This detail matters more than it looks: a streak
        mechanic that rewarded volume rather than consistency would quietly
        incentivize logging more often than is healthy, which is precisely
        the failure mode this product is built to avoid. The streak counts
        days you showed up, not entries you produced.
      </p>

      <Rule />

      <p>
        Missing a day resets a streak to zero by default, which is the
        honest, unadorned rule and also, on its own, a fairly punishing one.
        Illness, travel, a chaotic week — none of these are moral failures,
        but a naive streak counter treats them identically to indifference.
        So the counter carries a small amount of forgiveness built into the
        mechanism itself, not bolted on afterward as a customer-service
        exception.
      </p>
      <p>
        Grace tokens are the mechanism. A user earns one grace token
        automatically every fourteen consecutive days of an active streak —
        day 14, day 28, day 42, and so on — up to a hard ceiling of three
        tokens held at once. A grace token is spent automatically, without
        being asked, the first time a day passes with no session logged: it
        silently treats that missed day as if it hadn&rsquo;t happened, and
        the streak continues uninterrupted. You are not shown a modal asking
        you to confirm the sacrifice of a resource. It happens the way
        accrued time off should work and almost never does — quietly, in
        your favor, without a negotiation.
      </p>
      <p>
        Three tokens is a deliberate ceiling, not an oversight. Unlimited
        grace would make the streak meaningless — a counter nobody could ever
        break is not tracking anything. The cap keeps the mechanic honest
        while still absorbing the realistic case (a bad week, a hospital
        stay, a holiday) rather than only the theoretical one (a single
        forgotten Tuesday).
      </p>
      <p>
        Separately from grace tokens, a streak can be frozen deliberately, in
        advance. If you know a gap is coming — a trip, a procedure, a
        stretch with no privacy — you can freeze the streak for a specific
        window before it happens, and the days inside that window simply do
        not count against you, token or no token. This is disclosed here, in
        full, because it is a real feature with a real mechanism, not a
        monetized unlock dressed up as generosity. A habit-tracking tool
        that hides its own forgiveness behind a paywall has confused the
        incentive it is supposed to be managing.
      </p>

      <Rule />

      <p className="font-mono text-eyebrow uppercase tracking-[0.22em] text-ink-500">
        Une limite
      </p>
      <p>
        None of this eliminates the underlying risk. Streak-based design
        works by leveraging loss aversion — the same psychological lever
        that makes a fourteen-day streak feel more valuable than the sum of
        fourteen individual good days — and that lever cuts in both
        directions. Used carelessly, it produces exactly the anxious,
        compulsive relationship with a bodily function this product exists
        to avoid, not encourage. Grace tokens, the freeze window, and the
        decision to count days rather than volume are mitigations against
        that risk. They are not a guarantee against it, and an article about
        our own mechanics is the wrong place to pretend otherwise. If a
        streak starts to feel like an obligation rather than a record,
        breaking it on purpose is the correct use of the product.
      </p>
    </ArticleLayout>
  );
}
