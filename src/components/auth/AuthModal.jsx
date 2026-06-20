import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";

import { useAuth } from "../../hooks/useAuth.js";
import { forgotPassword as forgotPasswordRequest } from "../../services/authService";

const CloseIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="h-5 w-5">
    <path d="M6 6l12 12M18 6L6 18" />
  </svg>
);

const EyeIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
    <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const EyeOffIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
    <path d="M9.9 4.24A9.1 9.1 0 0 1 12 4c6.5 0 10 7 10 7a13.2 13.2 0 0 1-2.16 3.19M6.1 6.1A13.3 13.3 0 0 0 2 11s3.5 7 10 7a9.1 9.1 0 0 0 4.5-1.16" />
    <path d="m9.5 9.5a3 3 0 0 0 4.24 4.24M2 2l20 20" />
  </svg>
);

// Sign in / sign up / forgot-password modal. Controlled by being mounted;
// `initialMode` selects the starting view. The parent remounts it per open via a
// `key`, so initial state comes straight from props (no reset effect needed).
export default function AuthModal({ initialMode = "signin", onClose }) {
  const { t } = useTranslation();
  const { login, signup, loading, error, clearError } = useAuth();

  const [mode, setMode] = useState(initialMode); // "signin" | "signup" | "forgot"
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [showPw, setShowPw] = useState(false);
  const [caps, setCaps] = useState(false);
  // Forgot-password local state (handled outside the auth store).
  const [forgotBusy, setForgotBusy] = useState(false);
  const [forgotErr, setForgotErr] = useState("");
  const [forgotDone, setForgotDone] = useState(false);
  const firstFieldRef = useRef(null);

  const isSignup = mode === "signup";
  const isForgot = mode === "forgot";

  // Side-effects only: lock body scroll, wire Escape, focus the first field.
  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    const id = setTimeout(() => firstFieldRef.current?.focus(), 60);
    return () => {
      document.body.style.overflow = prevOverflow;
      document.removeEventListener("keydown", onKey);
      clearTimeout(id);
    };
  }, [onClose]);

  const switchMode = (m) => {
    setMode(m);
    setShowPw(false);
    setCaps(false);
    setForgotErr("");
    setForgotDone(false);
    clearError();
  };

  const update = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));
  const onPwKey = (e) => setCaps(Boolean(e.getModifierState?.("CapsLock")));

  const submit = async (e) => {
    e.preventDefault();
    if (isForgot) {
      setForgotBusy(true);
      setForgotErr("");
      try {
        await forgotPasswordRequest(form.email);
        setForgotDone(true);
      } catch (err) {
        setForgotErr(err.message);
      } finally {
        setForgotBusy(false);
      }
      return;
    }
    try {
      if (isSignup) await signup(form);
      else await login({ email: form.email, password: form.password });
      onClose();
    } catch {
      /* error is surfaced from the store */
    }
  };

  const headerTitle = isForgot ? t("auth.forgotTitle") : isSignup ? t("auth.joinTitle") : t("auth.welcomeBack");
  const headerSub = isForgot ? t("auth.forgotSub") : isSignup ? t("auth.signUpSub") : t("auth.signInSub");

  return createPortal(
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label={headerTitle}>
      {/* Backdrop */}
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
      />

      {/* Card */}
      <div className="relative max-h-[90vh] w-full max-w-md animate-fade-up overflow-y-auto rounded-3xl border border-white/10 bg-octo-card shadow-card">
        {/* Accent header */}
        <div className="relative overflow-hidden border-b border-white/5 bg-gradient-to-br from-octo-purple/25 via-octo-card to-octo-card px-6 pb-5 pt-6">
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="absolute end-4 top-4 grid h-8 w-8 place-items-center rounded-full border border-white/10 text-gray-400 transition-colors hover:text-white"
          >
            <CloseIcon />
          </button>
          <h2 className="font-display text-2xl font-bold uppercase tracking-wide text-white">{headerTitle}</h2>
          <p className="mt-1 font-mono text-xs text-gray-400">{headerSub}</p>
        </div>

        {/* Tabs (hidden on the forgot-password view) */}
        {!isForgot && (
          <div className="flex gap-1.5 px-6 pt-5">
            {["signin", "signup"].map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => switchMode(m)}
                className={`flex-1 rounded-full px-3 py-2 font-display text-sm font-bold uppercase tracking-wide transition-colors ${
                  mode === m
                    ? "bg-octo-purple text-white shadow-glow-purple"
                    : "border border-white/10 text-gray-400 hover:text-white"
                }`}
              >
                {m === "signin" ? t("auth.signIn") : t("auth.signUp")}
              </button>
            ))}
          </div>
        )}

        {/* Forgot-password success state */}
        {isForgot && forgotDone ? (
          <div className="space-y-5 px-6 pb-7 pt-5 text-center">
            <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-octo-green/15 text-octo-green">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="h-7 w-7">
                <path d="M20 6 9 17l-5-5" />
              </svg>
            </div>
            <p className="font-sans text-sm text-gray-300">{t("auth.resetSent")}</p>
            <button
              type="button"
              onClick={() => switchMode("signin")}
              className="inline-block font-display text-sm font-bold uppercase tracking-wide text-octo-purple transition-colors hover:text-octo-cyan"
            >
              {t("auth.backToSignIn")}
            </button>
          </div>
        ) : (
          /* Form */
          <form onSubmit={submit} className="space-y-4 px-6 pb-7 pt-5">
            {isSignup && (
              <Field label={t("auth.name")}>
                <input
                  ref={firstFieldRef}
                  type="text"
                  required
                  autoComplete="name"
                  value={form.name}
                  onChange={update("name")}
                  placeholder={t("auth.namePlaceholder")}
                  className="auth-input"
                />
              </Field>
            )}

            <Field label={t("auth.email")}>
              <input
                ref={isSignup ? undefined : firstFieldRef}
                type="email"
                required
                autoComplete="email"
                value={form.email}
                onChange={update("email")}
                placeholder={t("auth.emailPlaceholder")}
                className="auth-input"
              />
            </Field>

            {!isForgot && (
              <Field
                label={t("auth.password")}
                action={
                  !isSignup && (
                    <button
                      type="button"
                      onClick={() => switchMode("forgot")}
                      className="font-mono text-[11px] font-semibold text-octo-purple transition-colors hover:text-octo-cyan"
                    >
                      {t("auth.forgotPassword")}
                    </button>
                  )
                }
              >
                <div className="relative">
                  <input
                    type={showPw ? "text" : "password"}
                    required
                    minLength={6}
                    autoComplete={isSignup ? "new-password" : "current-password"}
                    value={form.password}
                    onChange={update("password")}
                    onKeyUp={onPwKey}
                    onKeyDown={onPwKey}
                    placeholder={t("auth.passwordPlaceholder")}
                    className="auth-input pe-11"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw((v) => !v)}
                    aria-label={showPw ? t("auth.hidePassword") : t("auth.showPassword")}
                    className="absolute end-3 top-1/2 -translate-y-1/2 text-gray-500 transition-colors hover:text-gray-200"
                  >
                    {showPw ? <EyeOffIcon /> : <EyeIcon />}
                  </button>
                </div>
                {caps && (
                  <span className="mt-1.5 flex items-center gap-1.5 font-mono text-[11px] text-octo-gold">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5">
                      <path d="m12 3 9 9h-5v6H8v-6H3l9-9Z" />
                    </svg>
                    {t("auth.capsLock")}
                  </span>
                )}
              </Field>
            )}

            {(error || forgotErr) && (
              <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-center font-mono text-xs text-red-300">
                {forgotErr || error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading || forgotBusy}
              className="mt-1 flex w-full items-center justify-center rounded-2xl bg-octo-purple py-3 font-display text-sm font-bold uppercase tracking-wide text-white shadow-glow-purple transition-opacity hover:opacity-90 disabled:opacity-60"
            >
              {isForgot
                ? forgotBusy
                  ? t("auth.loading")
                  : t("auth.sendResetLink")
                : loading
                  ? t("auth.loading")
                  : isSignup
                    ? t("auth.createAccount")
                    : t("auth.signIn")}
            </button>

            {isForgot ? (
              <p className="text-center">
                <button
                  type="button"
                  onClick={() => switchMode("signin")}
                  className="font-mono text-xs font-bold text-octo-purple transition-colors hover:text-octo-cyan"
                >
                  {t("auth.backToSignIn")}
                </button>
              </p>
            ) : (
              <p className="text-center font-mono text-xs text-gray-500">
                {isSignup ? t("auth.haveAccount") : t("auth.noAccount")}{" "}
                <button
                  type="button"
                  onClick={() => switchMode(isSignup ? "signin" : "signup")}
                  className="font-bold text-octo-purple transition-colors hover:text-octo-cyan"
                >
                  {isSignup ? t("auth.signIn") : t("auth.signUp")}
                </button>
              </p>
            )}
          </form>
        )}
      </div>
    </div>,
    document.body
  );
}

function Field({ label, action, children }) {
  return (
    <label className="block">
      <span className="mb-1.5 flex items-center justify-between">
        <span className="font-mono text-[11px] font-semibold uppercase tracking-wider text-gray-400">{label}</span>
        {action}
      </span>
      {children}
    </label>
  );
}
