import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { useAuth } from "../../hooks/useAuth.js";
import { resendVerification } from "../../services/authService.js";
import AuthModal from "../auth/AuthModal.jsx";

const MailIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
    <rect x="3" y="5" width="18" height="14" rx="2" />
    <path d="m3 7 9 6 9-6" />
  </svg>
);

const UserIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
    <path d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.5 20.25a7.5 7.5 0 0 1 15 0" />
  </svg>
);

const LogoutIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
    <path d="M15 12H4m0 0 3.5-3.5M4 12l3.5 3.5M14 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-2a2 2 0 0 1-2-2v-2" />
  </svg>
);

const ShieldIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
    <path d="M12 3 5 6v5c0 4.5 3 7.5 7 9 4-1.5 7-4.5 7-9V6l-7-3Z" />
  </svg>
);

const initialOf = (name = "") => name.trim().charAt(0).toUpperCase() || "U";

export default function AccountMenu() {
  const { t } = useTranslation();
  const { user, isAuthenticated, isAdmin, logout, clearError } = useAuth();

  const [modal, setModal] = useState(null); // null | "signin" | "signup"
  const [open, setOpen] = useState(false);
  const [resend, setResend] = useState("idle"); // idle | sending | sent | error
  const ref = useRef(null);
  const closeModal = useCallback(() => setModal(null), []);

  const handleResend = async () => {
    setResend("sending");
    try {
      await resendVerification();
      setResend("sent");
    } catch {
      setResend("error");
    }
  };

  // Close the dropdown on outside click / Escape.
  useEffect(() => {
    if (!open) return undefined;
    const onClick = (e) => ref.current && !ref.current.contains(e.target) && setOpen(false);
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  // Signed out → a button that opens the auth modal.
  if (!isAuthenticated) {
    return (
      <>
        <button
          type="button"
          onClick={() => {
            clearError();
            setModal("signin");
          }}
          aria-label={t("auth.signIn")}
          className="grid h-8 w-8 place-items-center rounded-full border border-white/10 text-gray-300 transition-colors hover:border-octo-purple/50 hover:text-white"
        >
          <UserIcon />
        </button>
        {modal !== null && (
          <AuthModal key={modal} initialMode={modal} onClose={closeModal} />
        )}
      </>
    );
  }

  // Signed in → avatar that toggles an account dropdown.
  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="grid h-8 w-8 place-items-center overflow-hidden rounded-full bg-gradient-to-br from-octo-purple to-octo-cyan font-display text-sm font-bold text-white ring-1 ring-white/15 transition-transform hover:scale-105"
      >
        {user.avatarUrl ? (
          <img src={user.avatarUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          initialOf(user.name)
        )}
      </button>

      {open && (
        <div className="absolute end-0 z-50 mt-2 w-60 origin-top-right animate-fade-up overflow-hidden rounded-2xl border border-white/10 bg-octo-card/95 shadow-card backdrop-blur-xl">
          <div className="border-b border-white/5 bg-gradient-to-br from-octo-purple/15 to-transparent p-4">
            <div className="flex items-center gap-2">
              <span className="truncate font-display text-sm font-bold text-white">{user.name}</span>
              {isAdmin && (
                <span className="shrink-0 rounded-full bg-octo-gold/20 px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wider text-octo-gold">
                  {t("auth.adminBadge")}
                </span>
              )}
            </div>
            <p className="mt-0.5 truncate font-mono text-[11px] text-gray-400">{user.email}</p>
            <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-octo-elevated px-2.5 py-1 font-mono text-[11px] font-bold text-octo-green">
              <span className="h-1.5 w-1.5 rounded-full bg-octo-green" />
              {user.xp ?? 0} XP
            </div>
          </div>

          {user.emailVerified === false && (
            <div className="border-b border-white/5 bg-octo-gold/[0.07] px-4 py-3">
              <div className="flex items-center gap-2 text-octo-gold">
                <MailIcon />
                <span className="font-mono text-[11px] font-bold uppercase tracking-wider">
                  {t("auth.unverified")}
                </span>
              </div>
              {resend === "sent" ? (
                <p className="mt-1.5 font-sans text-xs text-octo-green">{t("auth.resent")}</p>
              ) : (
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={resend === "sending"}
                  className="mt-1.5 font-sans text-xs font-semibold text-octo-purple transition-colors hover:text-octo-cyan disabled:opacity-60"
                >
                  {resend === "sending"
                    ? t("auth.loading")
                    : resend === "error"
                      ? t("auth.errorGeneric")
                      : t("auth.resend")}
                </button>
              )}
            </div>
          )}

          {isAdmin && (
            <Link
              to="/admin"
              onClick={() => setOpen(false)}
              className="flex w-full items-center gap-2.5 border-b border-white/5 px-4 py-3 text-left font-sans text-sm text-gray-200 transition-colors hover:bg-white/[0.04] hover:text-white"
            >
              <ShieldIcon />
              {t("auth.adminPanel")}
            </Link>
          )}

          <button
            type="button"
            onClick={() => {
              logout();
              setOpen(false);
            }}
            className="flex w-full items-center gap-2.5 px-4 py-3 text-left font-sans text-sm text-gray-300 transition-colors hover:bg-white/[0.04] hover:text-white"
          >
            <LogoutIcon />
            {t("auth.signOut")}
          </button>
        </div>
      )}
    </div>
  );
}
