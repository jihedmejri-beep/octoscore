import { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { verifyEmail as verifyEmailRequest } from "../services/authService";
import { useAuthStore } from "../store/authStore";

const CheckIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="h-8 w-8">
    <path d="M20 6 9 17l-5-5" />
  </svg>
);

const CrossIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="h-8 w-8">
    <path d="M18 6 6 18M6 6l12 12" />
  </svg>
);

export default function VerifyEmail() {
  const { t } = useTranslation();
  const [params] = useSearchParams();
  const token = params.get("token");

  // Derive the no-token error from props so the effect only performs async work
  // (avoids a synchronous setState inside the effect body).
  const [status, setStatus] = useState(token ? "loading" : "error");
  const [message, setMessage] = useState(token ? "" : t("verify.missing"));
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current || !token) return; // guard StrictMode double-invoke / no token
    ran.current = true;

    verifyEmailRequest(token)
      .then(() => {
        setStatus("success");
        // If this browser is signed in, refresh the user so the banner clears.
        const { token: authToken } = useAuthStore.getState();
        if (authToken) useAuthStore.getState().hydrate();
      })
      .catch((e) => {
        setStatus("error");
        setMessage(e.message);
      });
  }, [token]);

  const isError = status === "error";

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="octo-card w-full max-w-md p-8 text-center">
        {status === "loading" ? (
          <>
            <div className="mx-auto mb-5 h-10 w-10 animate-spin rounded-full border-2 border-white/15 border-t-octo-purple" />
            <p className="font-mono text-sm text-gray-400">{t("verify.verifying")}</p>
          </>
        ) : (
          <>
            <div
              className={`mx-auto mb-5 grid h-16 w-16 place-items-center rounded-full ${
                isError
                  ? "bg-red-500/15 text-red-400"
                  : "bg-octo-green/15 text-octo-green"
              }`}
            >
              {isError ? <CrossIcon /> : <CheckIcon />}
            </div>
            <h1 className="font-display text-2xl font-bold uppercase tracking-wide text-white">
              {isError ? t("verify.errorTitle") : t("verify.successTitle")}
            </h1>
            <p className="mt-2 font-sans text-sm text-gray-400">
              {isError ? message || t("verify.errorBody") : t("verify.successBody")}
            </p>
            <Link
              to="/"
              className="mt-6 inline-block rounded-2xl bg-octo-purple px-6 py-3 font-display text-sm font-bold uppercase tracking-wide text-white shadow-glow-purple transition-opacity hover:opacity-90"
            >
              {t("verify.backHome")}
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
