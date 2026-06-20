import { useState } from "react";
import { useTranslation } from "react-i18next";

import SearchOverlay from "./SearchOverlay.jsx";

const SearchIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
    <circle cx="11" cy="11" r="7" />
    <path d="m21 21-4.3-4.3" />
  </svg>
);

// Header search entry point: a round button that opens the search overlay.
export default function Search() {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={t("search.label")}
        className="grid h-8 w-8 place-items-center rounded-full border border-white/10 bg-octo-elevated text-gray-300 transition-colors hover:border-octo-purple/50 hover:text-white"
      >
        <SearchIcon />
      </button>
      {open && <SearchOverlay onClose={() => setOpen(false)} />}
    </>
  );
}
