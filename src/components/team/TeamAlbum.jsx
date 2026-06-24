import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";

import { fetchTeamPhotos } from "../../services/teamService";

function DownloadIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
      <path d="M12 3v12m0 0 4-4m-4 4-4-4M5 21h14" />
    </svg>
  );
}

function ArrowIcon({ dir = "left" }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
      <path d={dir === "left" ? "m15 18-6-6 6-6" : "m9 6 6 6-6 6"} />
    </svg>
  );
}

export default function TeamAlbum({ teamId }) {
  const { t } = useTranslation();
  const [photos, setPhotos] = useState([]);
  const [openIndex, setOpenIndex] = useState(null);

  useEffect(() => {
    let active = true;
    fetchTeamPhotos(teamId)
      .then((data) => active && Array.isArray(data) && setPhotos(data))
      .catch(() => {
        /* offline / none — just render nothing */
      });
    return () => {
      active = false;
    };
  }, [teamId]);

  const isOpen = openIndex !== null;
  const close = useCallback(() => setOpenIndex(null), []);
  const next = useCallback(() => setOpenIndex((i) => (i + 1) % photos.length), [photos.length]);
  const prev = useCallback(
    () => setOpenIndex((i) => (i - 1 + photos.length) % photos.length),
    [photos.length]
  );

  useEffect(() => {
    if (!isOpen) return undefined;
    const onKey = (e) => {
      if (e.key === "Escape") close();
      else if (e.key === "ArrowRight") next();
      else if (e.key === "ArrowLeft") prev();
    };
    window.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.body.classList.add("overlay-open");
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
      document.body.classList.remove("overlay-open");
    };
  }, [isOpen, close, next, prev]);

  if (photos.length === 0) return null;

  const current = isOpen ? photos[openIndex] : null;

  return (
    <section className="rise" style={{ "--d": "320ms" }}>
      <h2 className="mb-3 flex items-center gap-2.5 font-display text-lg font-bold uppercase tracking-wide">
        <span className="h-4 w-1 rounded-full bg-octo-gold" />
        {t("teamDetail.album")}
        <span className="ml-1 font-mono text-xs font-bold text-octo-gold">{photos.length}</span>
      </h2>

      <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-4">
        {photos.map((photo, i) => (
          <button
            key={photo.id}
            type="button"
            onClick={() => setOpenIndex(i)}
            aria-label={`${t("gallery.view")} ${i + 1}`}
            className="group relative block aspect-square overflow-hidden rounded-2xl border border-white/[0.07] bg-octo-elevated shadow-card transition duration-300 hover:-translate-y-1 hover:border-white/20"
          >
            <img
              src={photo.thumbUrl}
              alt={photo.caption || ""}
              loading="lazy"
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          </button>
        ))}
      </div>

      {/* Lightbox — portaled to <body> so it escapes the transformed page
          wrapper (the swipe/slide animation) and centers on the viewport. */}
      {isOpen && current && createPortal(
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" role="dialog" aria-modal="true">
          <button
            type="button"
            aria-label="Close"
            onClick={close}
            className="absolute inset-0 cursor-default bg-black/85 backdrop-blur-md"
          />

          <div className="relative z-10 w-full max-w-lg">
            <div className="animate-fade-up overflow-hidden rounded-3xl border border-white/10 bg-octo-card shadow-card">
              <img src={current.fullUrl} alt={current.caption || ""} className="max-h-[70vh] w-full object-contain" />
            </div>

            {current.caption && (
              <p className="mt-3 text-center font-sans text-sm leading-relaxed text-gray-300">{current.caption}</p>
            )}

            {current.downloadUrl && (
              <a
                href={current.downloadUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-3 flex items-center justify-center gap-2 rounded-2xl border border-octo-gold/40 bg-octo-gold/15 py-2.5 font-display text-sm font-bold uppercase tracking-wide text-octo-gold transition-colors hover:bg-octo-gold/25"
              >
                <DownloadIcon />
                {t("gallery.download")}
              </a>
            )}

            <div className="mt-4 flex items-center justify-between">
              <button
                type="button"
                onClick={prev}
                aria-label="Previous"
                className="grid h-10 w-10 place-items-center rounded-full border border-white/15 bg-white/[0.04] text-white transition-colors hover:border-octo-gold/60 hover:text-octo-gold"
              >
                <ArrowIcon dir="left" />
              </button>
              <span className="font-mono text-xs uppercase tracking-wider text-gray-400">
                {openIndex + 1} {t("gallery.of")} {photos.length}
              </span>
              <button
                type="button"
                onClick={next}
                aria-label="Next"
                className="grid h-10 w-10 place-items-center rounded-full border border-white/15 bg-white/[0.04] text-white transition-colors hover:border-octo-gold/60 hover:text-octo-gold"
              >
                <ArrowIcon dir="right" />
              </button>
            </div>
          </div>

          <button
            type="button"
            onClick={close}
            aria-label="Close"
            className="absolute right-4 top-4 z-10 grid h-10 w-10 place-items-center rounded-full border border-white/15 bg-black/50 text-white backdrop-blur transition-colors hover:border-white/40"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>,
        document.body,
      )}
    </section>
  );
}
