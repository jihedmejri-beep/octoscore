import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import { LANGUAGES } from "../../i18n";

const GlobeIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.7"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="h-4 w-4"
  >
    <circle cx="12" cy="12" r="9" />
    <path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" />
  </svg>
);

const ChevronIcon = ({ open }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={`h-3.5 w-3.5 transition-transform duration-300 ${open ? "rotate-180" : ""}`}
  >
    <path d="m6 9 6 6 6-6" />
  </svg>
);

export default function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  const current =
    LANGUAGES.find((l) => l.code === i18n.language) ?? LANGUAGES[0];

  // Close on outside click + Escape.
  useEffect(() => {
    if (!open) return undefined;
    const onClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const choose = (code) => {
    i18n.changeLanguage(code);
    setOpen(false);
  };

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label="Change language"
        className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1.5 font-mono text-xs font-bold tracking-wide transition-colors ${
          open
            ? "border-octo-purple/60 bg-octo-purple/10 text-white"
            : "border-white/10 bg-octo-elevated text-gray-300 hover:border-octo-purple/50 hover:text-white"
        }`}
      >
        <GlobeIcon />
        <span className="tabular-nums">{current.label}</span>
        <ChevronIcon open={open} />
      </button>

      {open && (
        <ul
          role="listbox"
          className="absolute right-0 z-50 mt-2 w-44 origin-top-right animate-fade-up overflow-hidden rounded-2xl border border-white/10 bg-octo-card/95 p-1.5 shadow-card backdrop-blur-xl"
        >
          {LANGUAGES.map((lang) => {
            const active = lang.code === i18n.language;
            return (
              <li key={lang.code}>
                <button
                  type="button"
                  role="option"
                  aria-selected={active}
                  onClick={() => choose(lang.code)}
                  className={`flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2 text-left transition-colors ${
                    active
                      ? "bg-octo-purple/15 text-white"
                      : "text-gray-400 hover:bg-white/[0.05] hover:text-white"
                  }`}
                >
                  <span className="flex items-center gap-2.5">
                    <span
                      className={`grid h-6 w-7 place-items-center rounded-md font-mono text-[10px] font-bold ${
                        active
                          ? "bg-octo-purple/25 text-octo-purple"
                          : "bg-white/[0.04] text-gray-400"
                      }`}
                    >
                      {lang.label}
                    </span>
                    <span className="font-sans text-sm" dir={lang.dir}>
                      {lang.name}
                    </span>
                  </span>
                  {active && (
                    <span className="h-2 w-2 shrink-0 rounded-full bg-octo-purple shadow-glow-purple" />
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
