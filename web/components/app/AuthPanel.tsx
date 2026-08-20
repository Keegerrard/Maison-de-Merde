"use client";

import { useState, type FormEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import DoubleBezelCard from "../ui/DoubleBezelCard";
import TextInput from "../ui/TextInput";
import PressButton from "../ui/PressButton";
import Checkbox from "../ui/Checkbox";
import Icon from "../ui/Icon";
import { apiFetch, ApiError } from "@/lib/api";
import type { AuthUser, ForgotPasswordResponse } from "@/lib/types";
import { SPRING } from "@/lib/motion";
import { useLanguage } from "@/hooks/useLanguage";

const USERNAME_RE = /^[a-zA-Z0-9_]{3,24}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type Tab = "login" | "signup";
type ForgotStep = "request" | "reset" | "done";

export default function AuthPanel({
  onLogin,
  onSignup,
  initialTab = "login",
  initialUsername = "",
}: {
  onLogin: (body: {
    username: string;
    password: string;
    remember?: boolean;
  }) => Promise<AuthUser>;
  onSignup: (body: {
    username: string;
    email: string;
    password: string;
  }) => Promise<AuthUser>;
  initialTab?: Tab;
  initialUsername?: string;
}) {
  const { t } = useLanguage();
  const [tab, setTab] = useState<Tab>(initialTab);
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const [loginUsername, setLoginUsername] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);

  const [signupUsername, setSignupUsername] = useState(initialUsername);
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const [showForgot, setShowForgot] = useState(false);
  const [forgotStep, setForgotStep] = useState<ForgotStep>("request");
  const [forgotIdentifier, setForgotIdentifier] = useState("");
  const [forgotResult, setForgotResult] = useState<ForgotPasswordResponse | null>(null);
  const [forgotSubmitting, setForgotSubmitting] = useState(false);
  const [forgotError, setForgotError] = useState<string | null>(null);
  const [resetToken, setResetToken] = useState("");
  const [resetNewPassword, setResetNewPassword] = useState("");
  const [resetSubmitting, setResetSubmitting] = useState(false);
  const [resetError, setResetError] = useState<string | null>(null);

  async function handleLogin(e: FormEvent) {
    e.preventDefault();
    setServerError(null);
    setSubmitting(true);
    try {
      await onLogin({
        username: loginUsername,
        password: loginPassword,
        remember: rememberMe,
      });
    } catch (err) {
      setServerError(
        err instanceof ApiError ? err.message : t("auth.failedLogin")
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
      errors.username = t("auth.usernameHint");
    }
    if (!EMAIL_RE.test(signupEmail)) {
      errors.email = t("auth.emailInvalid");
    }
    if (signupPassword.length < 8) {
      errors.password = t("auth.passwordTooShort");
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
        err instanceof ApiError ? err.message : t("auth.failedSignup")
      );
    } finally {
      setSubmitting(false);
    }
  }

  function openForgot() {
    setShowForgot(true);
    setForgotStep("request");
    setForgotIdentifier(loginUsername);
    setForgotResult(null);
    setForgotError(null);
    setResetToken("");
    setResetNewPassword("");
    setResetError(null);
  }

  function closeForgot() {
    setShowForgot(false);
  }

  async function handleForgotRequest(e: FormEvent) {
    e.preventDefault();
    setForgotError(null);
    setForgotSubmitting(true);
    try {
      const res = await apiFetch<ForgotPasswordResponse>("/api/auth/forgot-password", {
        method: "POST",
        body: { username: forgotIdentifier },
      });
      setForgotResult(res);
      if (res.resetToken) setResetToken(res.resetToken);
      setForgotStep("reset");
    } catch (err) {
      setForgotError(err instanceof ApiError ? err.message : t("account.genericError"));
    } finally {
      setForgotSubmitting(false);
    }
  }

  async function handleResetPassword(e: FormEvent) {
    e.preventDefault();
    setResetError(null);
    if (resetNewPassword.length < 8) {
      setResetError(t("auth.passwordTooShort"));
      return;
    }
    setResetSubmitting(true);
    try {
      await apiFetch<{ ok: true }>("/api/auth/reset-password", {
        method: "POST",
        body: { token: resetToken, newPassword: resetNewPassword },
      });
      setForgotStep("done");
    } catch (err) {
      setResetError(err instanceof ApiError ? err.message : t("account.genericError"));
    } finally {
      setResetSubmitting(false);
    }
  }

  return (
    <div className="grid min-h-[100dvh] grid-cols-1 md:grid-cols-12">
      <div className="flex flex-col justify-between gap-8 px-6 py-10 md:col-span-6 md:px-16 md:py-16">
        <div className="flex flex-col gap-6">
          <span className="font-display text-title text-ink-900">
            {t("app.name")}
          </span>
          <span className="inline-flex w-fit items-center rounded-pill px-3 py-1 font-mono text-eyebrow uppercase text-ink-500 ring-1 ring-rule">
            {t("app.established")} · {t("app.tagline")}
          </span>
          <h1 className="font-display text-display text-ink-900">
            {t("auth.ledgerOpen")}
          </h1>
        </div>
        <p className="font-mono text-eyebrow uppercase text-ink-300">
          {t("auth.disclaimer")}
        </p>
      </div>

      <div className="flex items-center px-6 pb-16 md:col-span-6 md:px-16 md:pb-0">
        <DoubleBezelCard className="w-full max-w-[440px]">
          {showForgot ? (
            <ForgotPasswordFlow
              t={t}
              step={forgotStep}
              identifier={forgotIdentifier}
              onIdentifierChange={setForgotIdentifier}
              onRequest={handleForgotRequest}
              requestSubmitting={forgotSubmitting}
              requestError={forgotError}
              result={forgotResult}
              resetToken={resetToken}
              onResetTokenChange={setResetToken}
              resetNewPassword={resetNewPassword}
              onResetNewPasswordChange={setResetNewPassword}
              onReset={handleResetPassword}
              resetSubmitting={resetSubmitting}
              resetError={resetError}
              onClose={closeForgot}
            />
          ) : (
            <>
          <div className="relative mb-6 flex rounded-pill bg-paper-sunk p-1">
            {(["login", "signup"] as Tab[]).map((tabOption) => (
              <button
                key={tabOption}
                type="button"
                onClick={() => setTab(tabOption)}
                className="relative flex-1 rounded-pill py-2 text-small font-medium"
              >
                {tab === tabOption ? (
                  <motion.span
                    layoutId="auth-tab"
                    className="absolute inset-0 rounded-pill bg-paper-raised shadow-ambient"
                    transition={SPRING.layout}
                  />
                ) : null}
                <span
                  className={[
                    "relative z-10",
                    tab === tabOption ? "text-ink-900" : "text-ink-500",
                  ].join(" ")}
                >
                  {tabOption === "login" ? t("auth.login") : t("auth.signup")}
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
                  label={t("auth.usernameOrEmail")}
                  value={loginUsername}
                  onChange={(e) => setLoginUsername(e.target.value)}
                  required
                  autoComplete="username"
                />
                <TextInput
                  label={t("auth.password")}
                  type="password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                />
                <div className="flex items-center justify-between">
                  <Checkbox
                    label={t("auth.remember")}
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                  />
                  <button
                    type="button"
                    onClick={openForgot}
                    className="text-small text-ink-500 underline-offset-2 [@media(hover:hover)_and_(pointer:fine)]:hover:underline"
                  >
                    {t("auth.forgotPassword")}
                  </button>
                </div>
                {serverError ? <ErrorStrip message={serverError} /> : null}
                <PressButton type="submit" fullWidth disabled={submitting}>
                  {submitting ? (
                    <Icon name="Loader2" size={16} className="animate-spin" />
                  ) : null}
                  {t("auth.login")}
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
                  label={t("auth.username")}
                  value={signupUsername}
                  onChange={(e) => setSignupUsername(e.target.value)}
                  error={fieldErrors.username}
                  required
                  minLength={3}
                  maxLength={24}
                  autoComplete="username"
                />
                <TextInput
                  label={t("auth.email")}
                  type="email"
                  value={signupEmail}
                  onChange={(e) => setSignupEmail(e.target.value)}
                  error={fieldErrors.email}
                  required
                  autoComplete="email"
                />
                <TextInput
                  label={t("auth.password")}
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
                  {t("auth.signup")}
                </PressButton>
              </motion.form>
            )}
          </AnimatePresence>
            </>
          )}
        </DoubleBezelCard>
      </div>
    </div>
  );
}

function ForgotPasswordFlow({
  t,
  step,
  identifier,
  onIdentifierChange,
  onRequest,
  requestSubmitting,
  requestError,
  result,
  resetToken,
  onResetTokenChange,
  resetNewPassword,
  onResetNewPasswordChange,
  onReset,
  resetSubmitting,
  resetError,
  onClose,
}: {
  t: (key: string, replacements?: Record<string, string | number>) => string;
  step: ForgotStep;
  identifier: string;
  onIdentifierChange: (v: string) => void;
  onRequest: (e: FormEvent) => void;
  requestSubmitting: boolean;
  requestError: string | null;
  result: ForgotPasswordResponse | null;
  resetToken: string;
  onResetTokenChange: (v: string) => void;
  resetNewPassword: string;
  onResetNewPasswordChange: (v: string) => void;
  onReset: (e: FormEvent) => void;
  resetSubmitting: boolean;
  resetError: string | null;
  onClose: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="flex flex-col gap-4"
    >
      <div className="flex items-center justify-between">
        <h2 className="font-display text-lg text-ink-900">{t("auth.forgotTitle")}</h2>
        <button
          type="button"
          onClick={onClose}
          aria-label={t("common.close")}
          className="text-ink-500 [@media(hover:hover)_and_(pointer:fine)]:hover:text-ink-900"
        >
          <Icon name="X" size={16} />
        </button>
      </div>

      {step === "request" ? (
        <form onSubmit={onRequest} className="flex flex-col gap-4">
          <p className="text-small text-ink-500">{t("auth.forgotDesc")}</p>
          <TextInput
            label={t("auth.usernameOrEmail")}
            value={identifier}
            onChange={(e) => onIdentifierChange(e.target.value)}
            required
            autoComplete="username"
          />
          {requestError ? <ErrorStrip message={requestError} /> : null}
          <PressButton type="submit" fullWidth disabled={requestSubmitting}>
            {requestSubmitting ? <Icon name="Loader2" size={16} className="animate-spin" /> : null}
            {t("auth.sendResetLink")}
          </PressButton>
        </form>
      ) : null}

      {step === "reset" ? (
        <form onSubmit={onReset} className="flex flex-col gap-4">
          <p className="rounded-sm bg-sage-100 px-3 py-2 text-small text-sage-700 ring-1 ring-sage-200">
            {result?.resetToken ? t("auth.resetTokenReady") : t("auth.resetTokenUnknown")}
          </p>
          {result?.resetToken ? (
            <p className="break-all rounded-sm bg-paper-sunk px-3 py-2 font-mono text-small text-ink-700 ring-1 ring-rule">
              {result.resetToken}
            </p>
          ) : null}
          <TextInput
            label={t("auth.resetCode")}
            value={resetToken}
            onChange={(e) => onResetTokenChange(e.target.value)}
            required
            mono
          />
          <TextInput
            label={t("auth.newPassword")}
            type="password"
            value={resetNewPassword}
            onChange={(e) => onResetNewPasswordChange(e.target.value)}
            required
            minLength={8}
            autoComplete="new-password"
          />
          {resetError ? <ErrorStrip message={resetError} /> : null}
          <PressButton type="submit" fullWidth disabled={resetSubmitting}>
            {resetSubmitting ? <Icon name="Loader2" size={16} className="animate-spin" /> : null}
            {t("auth.resetPassword")}
          </PressButton>
        </form>
      ) : null}

      {step === "done" ? (
        <div className="flex flex-col gap-4">
          <p className="rounded-sm bg-sage-100 px-3 py-2 text-small text-sage-700 ring-1 ring-sage-200">
            {t("auth.resetSuccess")}
          </p>
          <PressButton type="button" fullWidth onClick={onClose}>
            {t("auth.backToLogin")}
          </PressButton>
        </div>
      ) : null}
    </motion.div>
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
