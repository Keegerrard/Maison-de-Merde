import type { Metadata } from "next";
import ArticleLayout from "@/components/ui/ArticleLayout";
import Rule from "@/components/ui/Rule";

export const metadata: Metadata = {
  title: "What happens to your photograph — Maison de Merde",
  description:
    "It goes to a model once, the model answers, and then it is gone. Unless you say otherwise.",
};

export default function PhotographsPage() {
  return (
    <ArticleLayout
      kicker="CONFIDENTIALITÉ"
      title="What happens to your photograph"
    >
      <p>
        The honest version of this pipeline is short enough to describe
        completely, so we are going to describe it completely rather than
        gesture at a privacy policy and hope that is enough.
      </p>
      <p>
        You take the photo on your own device, inside your own camera or
        gallery, before this product is involved at all. When you choose to
        submit it, the file travels once, over an encrypted connection, to
        our server. It arrives at a single endpoint built for exactly this
        and nothing else, and it is capped at eight megabytes — large enough
        for a normal photo, small enough that nothing unusual is happening
        on the way in.
      </p>

      <Rule />

      <p>
        On the server, the image is never written to disk. It is held in
        memory only, for the length of one request, using a storage mode
        chosen specifically so there is no file to forget about afterward —
        no temp folder, no upload directory, no residual copy sitting
        somewhere waiting to be cleaned up later by a job that might not
        run. From memory, it is sent once to a hosted vision model operated
        by OpenAI, with an instruction set that is deliberately narrow:
        describe what is visible in clinical, structural terms — an
        estimated Bristol type, a color category, whether undigested food is
        visible — and explicitly, repeatedly, do not diagnose anything. The
        model is not asked for a medical opinion and is instructed not to
        volunteer one.
      </p>
      <p>
        That single inference call is also where the image&rsquo;s active
        life ends. Once the model has returned its answer, the photo is not
        kept, logged, cached, or reused — by design, not merely by default.
        The one exception is opt-in and explicit: if you tick &ldquo;keep
        this photo&rdquo; for your own personal record, the file is
        retained under the same access controls as the rest of your health
        data; if you don&rsquo;t tick it, nothing about the image persists
        past the request that analyzed it. Default is delete. Retention is
        something you have to ask for, not something you have to notice and
        turn off.
      </p>
      <p>
        The model&rsquo;s answer is not treated as a finding, either. Every
        response the model returns includes its own confidence in that
        response, and anything below a fairly conservative threshold — a
        self-reported confidence of 0.4 out of 1.0 — is discarded before it
        ever reaches you. Not shown with a caveat, not flagged as
        &ldquo;uncertain&rdquo;: withheld entirely. A wrong guess presented
        with false authority is worse than no guess, and a threshold
        enforced in code is a more reliable promise than a threshold
        enforced by tone of voice.
      </p>

      <Rule />

      <p className="font-mono text-eyebrow uppercase tracking-[0.22em] text-ink-500">
        Ce que nous ne prétendons pas
      </p>
      <p>
        What does reach you, above that threshold, is never final. It
        prefills the same structured form a manual entry would use — Bristol
        type, color, visible food — with every field editable and none of
        them submitted on your behalf. You look at the suggestion, correct
        whatever the model got wrong, and what actually gets saved to your
        history is your corrected answer, not the model&rsquo;s first guess.
        Nothing in this pipeline is capable of writing to your record
        without you reading it first.
      </p>
      <p>
        We are not going to claim this runs on your device, because it
        doesn&rsquo;t — describing a real network call to a real external
        model as &ldquo;on-device&rdquo; would be exactly the kind of small
        dishonesty that makes the rest of this article worthless. What we
        can claim, because it is true and because most of it is visible in
        the network request itself, is narrower and more useful: one photo,
        one inference call, no disk write, no retention without asking, no
        guess presented as a fact, and no result that reaches your record
        without you seeing it first.
      </p>
    </ArticleLayout>
  );
}
