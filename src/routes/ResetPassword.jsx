import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { resetPassword as resetPasswordRequest } from "../services/authService";
import { useAuthStore } from "../store/authStore";

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
const CheckIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="h-8 w-8">
    <path d="M20 6 9 17l-5-5" />
  </svg>
);

export default function ResetPassword() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const token = params.get("token");

  // Derive the no-token state up front so the effect-free component never needs
  // a synchronous setState.
  const [status, setStatus] = useState(token ? "form" : "missing"); // form | success | missing
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    if (password !== confirm) {
      setError(t("reset.mismatch"));
      return;
    }
    setBusy(true);
    setError("");
    try {
      const { token: authToken, user } = await resetPasswordRequest(token, password);
      // Sign the user straight in with the fresh token.
      useAuthStore.getState().setSession(authToken, user);
      setStatus("success");
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="octo-card w-full max-w-md p-8">
        {status === "success" ? (
          <div className="text-center">
            <div className="mx-auto mb-5 grid h-16 w-16 place-items-center rounded-full bg-octo-green/15 text-octo-green">
              <CheckIcon />
            </div>
            <h1 className="font-display text-2xl font-bold uppercase tracking-wide text-white">
              {t("reset.successTitle")}
            </h1>
            <p className="mt-2 font-sans text-sm text-gray-400">{t("reset.successBody")}</p>
            <button
              type="button"
              onClick={() => navigate("/")}
              className="mt-6 inline-block rounded-2xl bg-octo-purple px-6 py-3 font-display text-sm font-bold uppercase tracking-wide text-white shadow-glow-purple transition-opacity hover:opacity-90"
            >
              {t("reset.continue")}
            </button>
          </div>
        ) : status === "missing" ? (
          <div className="text-center">
            <h1 className="font-display text-2xl font-bold uppercase tracking-wide text-white">
              {t("reset.title")}
            </h1>
            <p className="mt-2 font-sans text-sm text-red-300">{t("reset.missing")}</p>
            <Link
              to="/"
              className="mt-6 inline-block rounded-2xl border border-white/10 px-6 py-3 font-display text-sm font-bold uppercase tracking-wide text-gray-300 transition-colors hover:text-white"
            >
              {t("reset.backHome")}
            </Link>
          </div>
        ) : (
          <>
            <h1 className="font-display text-2xl font-bold uppercase tracking-wide text-white">
              {t("reset.title")}
            </h1>
            <p className="mt-1 font-mono text-xs text-gray-400">{t("reset.sub")}</p>

            <form onSubmit={submit} className="mt-5 space-y-4">
              <label className="block">
                <span className="mb-1.5 block font-mono text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                  {t("reset.newPassword")}
                </span>
                <div className="relative">
                  <input
                    type={showPw ? "text" : "password"}
                    required
                    minLength={6}
                    autoComplete="new-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
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
              </label>

              <label className="block">
                <span className="mb-1.5 block font-mono text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                  {t("reset.confirmPassword")}
                </span>
                <input
                  type={showPw ? "text" : "password"}
                  required
                  minLength={6}
                  autoComplete="new-password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder={t("auth.passwordPlaceholder")}
                  className="auth-input"
                />
              </label>

              {error && (
                <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-center font-mono text-xs text-red-300">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={busy}
                className="flex w-full items-center justify-center rounded-2xl bg-octo-purple py-3 font-display text-sm font-bold uppercase tracking-wide text-white shadow-glow-purple transition-opacity hover:opacity-90 disabled:opacity-60"
              >
                {busy ? t("reset.updating") : t("reset.submit")}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
