import { useTranslation } from "react-i18next";

// Dedication / credits for the people who built and validated OctoScore.
// Names are proper nouns, so they live here rather than in the i18n files;
// only the surrounding labels are translated.
const CREATORS = ["Jihed Mejri", "Motez Ben Salah"];
const TESTERS = [
  "Islem Brini",
  "Mohamed Ahmed Nouira",
  "Anes Ben Rayana",
  "Mohamed Haj Ayad",
];
const CERTIFIED_BY = "Islem Brini";
const YEAR = 2026;

// One credit block: an uppercase mono label above a row of highlighted names.
function CreditGroup({ label, names, accent }) {
  return (
    <div>
      <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-gray-500">
        {label}
      </p>
      <p className="mt-1.5 flex flex-wrap justify-center gap-x-2 gap-y-1 font-display text-sm font-bold uppercase tracking-wide">
        {names.map((name, i) => (
          <span key={name} className="inline-flex items-center gap-2">
            <span style={{ color: accent }}>{name}</span>
            {i < names.length - 1 && <span className="text-gray-700">·</span>}
          </span>
        ))}
      </p>
    </div>
  );
}

export default function Footer() {
  const { t } = useTranslation();

  return (
    <footer className="mt-12 border-t border-white/[0.07] pt-8 text-center">
      <div className="mx-auto max-w-md space-y-6">
        <CreditGroup label={t("footer.createdBy")} names={CREATORS} accent="#A78BFA" />
        <CreditGroup label={t("footer.testedBy")} names={TESTERS} accent="#22D3EE" />

        {/* Certified-by badge */}
        <div className="flex items-center justify-center gap-2">
          <span className="inline-flex items-center gap-2 rounded-full border border-octo-green/30 bg-octo-green/10 px-3.5 py-1.5">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-3.5 w-3.5 text-octo-green"
            >
              <path d="M9 12l2 2 4-4" />
              <circle cx="12" cy="12" r="9" />
            </svg>
            <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-octo-green">
              {t("footer.certifiedBy")} {CERTIFIED_BY}
            </span>
          </span>
        </div>

        <p className="font-sans text-xs italic text-gray-500">{t("footer.madeWith")}</p>

        <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-gray-600">
          OctoScore · {YEAR} · {t("footer.rights")}
        </p>
      </div>
    </footer>
  );
}
