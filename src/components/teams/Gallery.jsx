import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";

import { fetchGallery, galleryDownloadUrl } from "../../services/galleryService.js";

const ACCENTS = {
  purple: "#6236FF",
  green: "#39FF14",
  cyan: "#00E5FF",
  gold: "#FFC700",
};

// Accent-tinted hexagon lattice (matches the app background motif).
function hexLattice(hex) {
  const stroke = encodeURIComponent(hex);
  return `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='46'%3E%3Cpolygon points='20,2 38,12 38,34 20,44 2,34 2,12' fill='none' stroke='${stroke}' stroke-width='0.7' opacity='0.3'/%3E%3C/svg%3E")`;
}

function formatDate(iso, locale) {
  return new Date(iso).toLocaleDateString(locale, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function DownloadIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
      <path d="M12 3v12m0 0 4-4m-4 4-4-4M5 21h14" />
    </svg>
  );
}

// Visual face for a memory. Renders the real Cloudinary photo when the admin has
// uploaded one; otherwise a designed accent tile stands in for it.
function MemoryFace({ item, index, locale, big = false }) {
  const accent = ACCENTS[item.accent] ?? ACCENTS.purple;
  // Small optimized thumbnail in the grid, medium one in the lightbox; fall
  // back to the raw URL for older items served before the optimization.
  const photo = (big ? item.fullUrl : item.thumbUrl) || item.image?.url;
  return (
    <div
      className="relative h-full w-full overflow-hidden"
      style={{
        backgroundColor: "#0A0A0A",
        backgroundImage: `radial-gradient(circle at 28% 18%, ${accent}40, transparent 60%), ${hexLattice(accent)}, linear-gradient(160deg, #1B1B20, #0A0A0A)`,
        backgroundSize: "100% 100%, 40px 46px, 100% 100%",
      }}
    >
      {photo && (
        <img
          src={photo}
          alt={item.title}
          loading="lazy"
          className="absolute inset-0 h-full w-full object-cover"
        />
      )}

      {/* Ghost frame number (hidden once a real photo fills the tile) */}
      {!photo && (
        <span
          className="absolute right-3 top-0 font-display font-bold leading-none text-white/[0.06]"
          style={{ fontSize: big ? "10rem" : "4.5rem" }}
        >
          {String(index + 1).padStart(2, "0")}
        </span>
      )}

      {/* Category tag */}
      {item.tag && (
        <span
          className="absolute left-3 top-3 rounded-full px-2.5 py-1 font-mono text-[9px] font-bold uppercase tracking-wider"
          style={{
            color: accent,
            backgroundColor: `${accent}1F`,
            border: `1px solid ${accent}40`,
          }}
        >
          {item.tag}
        </span>
      )}

      {/* Bottom scrim + title */}
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/45 to-transparent p-3 pt-10">
        <div
          className={`font-display font-bold uppercase leading-tight text-white ${
            big ? "text-2xl" : "text-sm"
          }`}
        >
          {item.title}
        </div>
        <div className="mt-0.5 font-mono text-[10px] uppercase tracking-wider text-gray-400">
          {formatDate(item.date, locale)}
        </div>
      </div>
    </div>
  );
}

function ArrowIcon({ dir = "left" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-5 w-5"
    >
      <path d={dir === "left" ? "m15 18-6-6 6-6" : "m9 6 6 6-6 6"} />
    </svg>
  );
}

export default function Gallery() {
  const { t, i18n } = useTranslation();
  const locale = i18n.language;

  // Gallery tiles come straight from the API — admins add real photos through
  // the admin panel. No fake/seed tiles: an empty gallery renders nothing.
  const [items, setItems] = useState([]);
  const [openIndex, setOpenIndex] = useState(null);

  useEffect(() => {
    let active = true;
    fetchGallery()
      .then((data) => {
        if (active && Array.isArray(data)) setItems(data);
      })
      .catch(() => {
        /* API offline — leave the gallery empty */
      });
    return () => {
      active = false;
    };
  }, []);

  const isOpen = openIndex !== null;
  const close = useCallback(() => setOpenIndex(null), []);
  const next = useCallback(() => setOpenIndex((i) => (i + 1) % items.length), [items.length]);
  const prev = useCallback(
    () => setOpenIndex((i) => (i - 1 + items.length) % items.length),
    [items.length]
  );

  // Keyboard navigation + body scroll-lock while the lightbox is open.
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
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [isOpen, close, next, prev]);

  const current = isOpen ? items[openIndex] : null;
  const canDownload = Boolean(current?.image?.url);

  // Nothing to show until the admin uploads real photos — hide the section.
  if (items.length === 0) return null;

  return (
    <section>
      <div className="mb-3 flex items-end justify-between">
        <div>
          <h2 className="section-title flex items-center gap-2.5">
            <span className="h-4 w-1 rounded-full bg-octo-gold" />
            {t("gallery.title")}
          </h2>
          <p className="mt-1 pl-3.5 font-mono text-[11px] uppercase tracking-wider text-gray-500">
            {t("gallery.subtitle")}
          </p>
        </div>
        <span className="shrink-0 font-mono text-xs font-bold text-octo-gold">
          {items.length}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {items.map((item, i) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setOpenIndex(i)}
            aria-label={`${t("gallery.view")}: ${item.title}`}
            className="rise group relative block aspect-[4/5] overflow-hidden rounded-2xl border border-white/[0.07] shadow-card transition duration-300 hover:-translate-y-1 hover:border-white/20"
            style={{ "--d": `${i * 45}ms` }}
          >
            <div className="h-full w-full transition-transform duration-500 group-hover:scale-105">
              <MemoryFace item={item} index={i} locale={locale} />
            </div>
            <span className="pointer-events-none absolute inset-0 grid place-items-center bg-black/0 opacity-0 transition duration-300 group-hover:bg-black/25 group-hover:opacity-100">
              <span className="rounded-full border border-white/30 bg-black/50 px-3 py-1.5 font-mono text-[10px] font-bold uppercase tracking-wider text-white backdrop-blur">
                {t("gallery.view")}
              </span>
            </span>
          </button>
        ))}
      </div>

      {/* Lightbox — portaled to <body> so it escapes the transformed page
          wrapper (the swipe/slide animation) and centers on the viewport. */}
      {isOpen && current && createPortal(
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-label={current.title}
        >
          <button
            type="button"
            aria-label="Close"
            onClick={close}
            className="absolute inset-0 cursor-default bg-black/80 backdrop-blur-md"
          />

          <div className="relative z-10 w-full max-w-md">
            <div className="animate-fade-up overflow-hidden rounded-3xl border border-white/10 shadow-card">
              <div className="aspect-[4/5]">
                <MemoryFace item={current} index={openIndex} locale={locale} big />
              </div>
            </div>

            <p className="mt-4 font-sans text-sm leading-relaxed text-gray-300">
              {current.caption}
            </p>

            {/* Download (only when a real image is attached) */}
            {canDownload && (
              <a
                href={current.downloadUrl || galleryDownloadUrl(current.id)}
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
                {openIndex + 1} {t("gallery.of")} {items.length}
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
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-5 w-5"
            >
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>,
        document.body,
      )}
    </section>
  );
}
