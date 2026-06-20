import { useTranslation } from "react-i18next";

// Modern empty state for pages not yet built: a floating, glowing icon badge
// over the ambient background, with a mono "coming soon" tag.
export default function ComingSoon({ title, subtitle, children }) {
  const { t } = useTranslation();
  return (
    <div className="flex min-h-[62vh] flex-col items-center justify-center text-center">
      <div className="rise relative mb-6">
        <span className="absolute inset-0 -z-10 rounded-3xl bg-octo-purple/30 blur-2xl" />
        <span className="grid h-20 w-20 animate-float place-items-center rounded-3xl border border-white/10 bg-octo-card text-octo-purple shadow-glow-purple">
          {children}
        </span>
      </div>
      <h1 className="rise section-title text-3xl" style={{ "--d": "80ms" }}>
        {title}
      </h1>
      <p
        className="rise mt-3 max-w-xs font-sans text-sm text-gray-400"
        style={{ "--d": "160ms" }}
      >
        {subtitle}
      </p>
      <span
        className="rise mt-5 rounded-full border border-white/10 bg-octo-elevated px-4 py-1.5 font-mono text-[11px] uppercase tracking-[0.2em] text-octo-green"
        style={{ "--d": "240ms" }}
      >
        {t("common.comingSoon")}
      </span>
    </div>
  );
}
