"use client";

import { useState, type FormEvent } from "react";
import { motion } from "framer-motion";
import Modal from "../ui/Modal";
import PressButton from "../ui/PressButton";
import TextInput from "../ui/TextInput";
import Icon from "../ui/Icon";
import Rule from "../ui/Rule";
import { SPRING } from "@/lib/motion";

type Tier = "monthly" | "annual";

const TIER_PRICE: Record<Tier, string> = {
  monthly: "$4.99/mo",
  annual: "$39.99/yr",
};

function formatCardNumber(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 16);
  return digits.replace(/(.{4})/g, "$1 ").trim();
}

function formatExpiry(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 4);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)} / ${digits.slice(2)}`;
}

function formatCvc(raw: string): string {
  return raw.replace(/\D/g, "").slice(0, 4);
}

export default function GoldCirclePaywall({
  open,
  onClose,
  reason,
  onSubscribed,
}: {
  open: boolean;
  onClose: () => void;
  reason: string;
  onSubscribed: () => void;
}) {
  const [tier, setTier] = useState<Tier>("annual");
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvc, setCvc] = useState("");
  const [phase, setPhase] = useState<"form" | "submitting" | "success">(
    "form"
  );

  function handleClose() {
    if (phase === "submitting") return;
    setPhase("form");
    onClose();
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (phase !== "form") return;
    setPhase("submitting");
    window.setTimeout(() => {
      setPhase("success");
      window.setTimeout(() => {
        onSubscribed();
        setPhase("form");
        onClose();
      }, 1100);
    }, 1400);
  }

  return (
    <Modal open={open} onClose={handleClose} title="Le Cercle d'Or">
      <div className="relative">
        <button
          type="button"
          onClick={handleClose}
          aria-label="Close"
          className="absolute right-0 top-0 text-ink-500 [@media(hover:hover)_and_(pointer:fine)]:hover:text-ink-900"
        >
          <Icon name="X" size={16} />
        </button>

        <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-pill ring-1 ring-rule-strong">
          <Icon name="Crown" size={32} strokeWidth={1} className="text-ink-900" />
        </div>

        <h2 className="text-center font-display text-title text-ink-900">
          Le Cercle d&apos;Or
        </h2>
        <p className="mt-2 text-center text-small text-ink-500">{reason}</p>

        <div className="relative mt-6 flex rounded-pill bg-paper-sunk p-1">
          {(["monthly", "annual"] as Tier[]).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTier(t)}
              className="relative flex-1 rounded-pill py-2.5 text-small"
            >
              {tier === t ? (
                <motion.span
                  layoutId="tier-selection"
                  className="absolute inset-0 rounded-pill bg-paper-raised shadow-ambient"
                  transition={SPRING.layout}
                />
              ) : null}
              <span className="relative z-10 flex flex-col items-center">
                {t === "annual" ? (
                  <span className="font-mono text-[9px] uppercase tracking-[0.15em] text-sage-600">
                    Meilleure valeur
                  </span>
                ) : (
                  <span className="h-[13px]" />
                )}
                <span
                  className={tier === t ? "text-ink-900" : "text-ink-500"}
                >
                  {t === "monthly" ? "Mensuel" : "Annuel"} {TIER_PRICE[t]}
                </span>
              </span>
            </button>
          ))}
        </div>

        <ul className="mt-6 divide-y divide-rule border-y border-rule">
          {[
            "Unlimited streak freezes, for the travelling connoisseur",
            "Missed-day recovery, discreetly arranged",
            "A mark beside your name, so the Circle knows",
          ].map((perk) => (
            <li key={perk} className="py-3 text-small text-ink-700">
              {perk}
            </li>
          ))}
        </ul>

        <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
          <TextInput
            label="Card number"
            mono
            placeholder="4242 4242 4242 4242"
            value={cardNumber}
            onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
            inputMode="numeric"
            maxLength={19}
            required
          />
          <div className="grid grid-cols-2 gap-4">
            <TextInput
              label="Expiry"
              mono
              placeholder="MM / YY"
              value={expiry}
              onChange={(e) => setExpiry(formatExpiry(e.target.value))}
              inputMode="numeric"
              maxLength={7}
              required
            />
            <TextInput
              label="CVC"
              mono
              placeholder="•••"
              value={cvc}
              onChange={(e) => setCvc(formatCvc(e.target.value))}
              inputMode="numeric"
              maxLength={4}
              required
            />
          </div>

          <PressButton
            type="submit"
            fullWidth
            disabled={phase !== "form"}
            className={phase === "success" ? "bg-sage-700" : ""}
          >
            <span className="relative inline-flex items-center gap-2">
              {phase === "submitting" ? (
                <Icon name="Loader2" size={16} className="animate-spin" />
              ) : null}
              <motion.span
                key={phase}
                initial={{ opacity: 0, filter: "blur(2px)" }}
                animate={{ opacity: 1, filter: "blur(0px)" }}
                transition={{ duration: 0.2 }}
              >
                {phase === "success"
                  ? "Bienvenue au Cercle d'Or"
                  : `Rejoindre le Cercle d'Or — ${TIER_PRICE[tier]}`}
              </motion.span>
            </span>
          </PressButton>
        </form>

        <Rule className="mt-6" />
        <p className="mt-4 text-center font-mono text-eyebrow text-ink-500">
          This is a demo paywall for a satirical app — no card is real, no
          payment is processed, and nothing is charged. Any details entered
          here go nowhere.
        </p>
      </div>
    </Modal>
  );
}
