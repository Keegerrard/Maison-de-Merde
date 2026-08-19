"use client";

import { useState, type ChangeEvent, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import DoubleBezelCard from "@/components/ui/DoubleBezelCard";
import TextInput from "@/components/ui/TextInput";
import ArrowCTAButton from "@/components/ui/ArrowCTAButton";
import EyebrowTag from "@/components/ui/EyebrowTag";
import Icon from "@/components/ui/Icon";
import Reveal from "@/components/ui/Reveal";

// Copied verbatim from server/src/auth.js `validateSignupInput` — do not
// approximate this. Server is the source of truth; client just mirrors it.
const USERNAME_PATTERN = /^[a-zA-Z0-9_]{3,24}$/;

export default function EnterPanel() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [error, setError] = useState<string | undefined>(undefined);
  const [isNavigating, setIsNavigating] = useState(false);

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    setUsername(event.target.value);
    if (error) setError(undefined);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = username.trim();

    if (!USERNAME_PATTERN.test(value)) {
      setError("3–24 characters: letters, numbers, and underscores only.");
      return;
    }

    setError(undefined);
    setIsNavigating(true);
    router.push(`/app/?intent=signup&username=${encodeURIComponent(value)}`);
  }

  return (
    <section className="mx-auto w-full max-w-[1180px] px-5 py-32 md:px-10 md:py-40">
      <Reveal>
        <DoubleBezelCard padding="default" className="w-full">
          <div className="flex flex-col items-center gap-8 py-8 text-center md:py-12">
            <EyebrowTag>ENTER</EyebrowTag>

            <div className="flex max-w-[24ch] flex-col gap-3">
              <h2 className="text-display font-display text-ink-900">
                There is no waiting list.
              </h2>
              <p className="text-lede max-w-[46ch] text-ink-500">
                Choose a name. The ledger opens immediately.
              </p>
            </div>

            <form
              onSubmit={handleSubmit}
              noValidate
              className="flex w-full max-w-md flex-col items-stretch gap-4 pt-2 sm:flex-row sm:items-start"
            >
              <div className="flex-1">
                <TextInput
                  label="Username"
                  mono
                  placeholder="3–24 characters"
                  name="username"
                  autoComplete="off"
                  spellCheck={false}
                  value={username}
                  onChange={handleChange}
                  error={error}
                />
              </div>
              <ArrowCTAButton
                type="submit"
                variant="primary"
                className="shrink-0 sm:mt-[1.875rem]"
              >
                {isNavigating ? (
                  <span className="inline-flex items-center gap-2">
                    <Icon
                      name="Loader2"
                      size={14}
                      className="animate-spin"
                    />
                    Open the Register
                  </span>
                ) : (
                  "Open the Register"
                )}
              </ArrowCTAButton>
            </form>

            <p className="font-mono text-small text-ink-300">
              Free. No card. The Gold Circle will find you on its own.
            </p>
          </div>
        </DoubleBezelCard>
      </Reveal>
    </section>
  );
}
