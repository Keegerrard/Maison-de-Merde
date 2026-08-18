"use client";

import { useState, type FormEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import DoubleBezelCard from "../ui/DoubleBezelCard";
import TextInput from "../ui/TextInput";
import PressButton from "../ui/PressButton";
import Icon from "../ui/Icon";
import { ApiError } from "@/lib/api";
import type { AuthUser } from "@/lib/types";
import { SPRING } from "@/lib/motion";

const USERNAME_RE = /^[a-zA-Z0-9_]{3,24}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type Tab = "login" | "signup";

export default function AuthPanel({
  onLogin,
  onSignup,
  initialTab = "login",
  initialUsername = "",
}: {
  onLogin: (body: { username: string; password: string }) => Promise<AuthUser>;
  onSignup: (body: {
    username: string;
    email: string;
    password: string;
  }) => Promise<AuthUser>;
  initialTab?: Tab;
  initialUsername?: string;
}) {
  const [tab, setTab] = useState<Tab>(initialTab);
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const [loginUsername, setLoginUsername] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  const [signupUsername, setSignupUsername] = useState(initialUsername);
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  async function handleLogin(e: FormEvent) {
    e.preventDefault();
    setServerError(null);
    setSubmitting(true);
    try {
      await onLogin({ username: loginUsername, password: loginPassword });
    } catch (err) {
      setServerError(
        err instanceof ApiError ? err.message : "Failed to log in."
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSignup(e: FormEvent) {
    e.preventDefault();
    setServerError(null);
    const errors: Record<string, string> = {};
    if (!USERNAME_RE.test(signupUsername)) {
      errors.username = "3–24 characters: letters, numbers, underscores.";
    }
    if (!EMAIL_RE.test(signupEmail)) {
      errors.email = "Enter a valid email address.";
    }
    if (signupPassword.length < 8) {
      errors.password = "At least 8 characters.";
    }
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setSubmitting(true);
    try {
      await onSignup({
        username: signupUsername,
        email: signupEmail,
        password: signupPassword,
      });
    } catch (err) {
      setServerError(
        err instanceof ApiError ? err.message : "Failed to create account."
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="grid min-h-[100dvh] grid-cols-1 md:grid-cols-12">
      <div className="flex flex-col justify-between gap-8 px-6 py-10 md:col-span-6 md:px-16 md:py-16">
        <div className="flex flex-col gap-6">
          <span className="font-display text-title text-ink-900">
            Maison de Merde
          </span>
          <span className="inline-flex w-fit items-center rounded-pill px-3 py-1 font-mono text-eyebrow uppercase text-ink-500 ring-1 ring-rule">
            Établie 2026 · Purveyors of Fine Digestive Distinction
          </span>
          <h1 className="font-display text-display text-ink-900">
            The ledger is open.
          </h1>
        </div>
        <p className="font-mono text-eyebrow uppercase text-ink-300">
          Maison de Merde is a tracking and pattern-recognition tool. It is
          not a medical device and does not diagnose any condition.
        </p>
      </div>

      <div className="flex items-center px-6 pb-16 md:col-span-6 md:px-16 md:pb-0">
        <DoubleBezelCard className="w-full max-w-[440px]">
          <div className="relative mb-6 flex rounded-pill bg-paper-sunk p-1">
            {(["login", "signup"] as Tab[]).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTab(t)}
                className="relative flex-1 rounded-pill py-2 text-small font-medium"
              >
                {tab === t ? (
                  <motion.span
                    layoutId="auth-tab"
                    className="absolute inset-0 rounded-pill bg-paper-raised shadow-ambient"
                    transition={SPRING.layout}
                  />
                ) : null}
                <span
                  className={[
                    "relative z-10",
                    tab === t ? "text-ink-900" : "text-ink-500",
                  ].join(" ")}
                >
                  {t === "login" ? "Se connecter" : "Créer un compte"}
                </span>
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait" initial={false}>
            {tab === "login" ? (
              <motion.form
                key="login"
                onSubmit={handleLogin}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.2 }}
                className="flex flex-col gap-4"
              >
                <TextInput
                  label="Nom d'utilisateur ou email"
                  value={loginUsername}
                  onChange={(e) => setLoginUsername(e.target.value)}
                  required
                  autoComplete="username"
                />
                <TextInput
                  label="Mot de passe"
                  type="password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                />
                {serverError ? <ErrorStrip message={serverError} /> : null}
                <PressButton type="submit" fullWidth disabled={submitting}>
                  {submitting ? (
                    <Icon name="Loader2" size={16} className="animate-spin" />
                  ) : null}
                  Se connecter
                </PressButton>
              </motion.form>
            ) : (
              <motion.form
                key="signup"
                onSubmit={handleSignup}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.2 }}
                className="flex flex-col gap-4"
              >
                <TextInput
                  label="Nom d'utilisateur"
                  value={signupUsername}
                  onChange={(e) => setSignupUsername(e.target.value)}
                  error={fieldErrors.username}
                  required
                  minLength={3}
                  maxLength={24}
                  autoComplete="username"
                />
                <TextInput
                  label="Email"
                  type="email"
                  value={signupEmail}
                  onChange={(e) => setSignupEmail(e.target.value)}
                  error={fieldErrors.email}
                  required
                  autoComplete="email"
                />
                <TextInput
                  label="Mot de passe"
                  type="password"
                  value={signupPassword}
                  onChange={(e) => setSignupPassword(e.target.value)}
                  error={fieldErrors.password}
                  required
                  minLength={8}
                  autoComplete="new-password"
                />
                {serverError ? <ErrorStrip message={serverError} /> : null}
                <PressButton type="submit" fullWidth disabled={submitting}>
                  {submitting ? (
                    <Icon name="Loader2" size={16} className="animate-spin" />
                  ) : null}
                  Créer un compte
                </PressButton>
              </motion.form>
            )}
          </AnimatePresence>
        </DoubleBezelCard>
      </div>
    </div>
  );
}

function ErrorStrip({ message }: { message: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="rounded-sm bg-claret-100 px-3 py-2 text-small text-claret-600 ring-1 ring-claret-200"
    >
      {message}
    </motion.div>
  );
}
