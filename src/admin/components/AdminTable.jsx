import { createPortal } from "react-dom";

const EditIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
    <path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
  </svg>
);
const TrashIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
    <path d="M3 6h18M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2m2 0v14a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V6" />
  </svg>
);
const PlusIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="h-4 w-4">
    <path d="M12 5v14M5 12h14" />
  </svg>
);

function IconBtn({ label, onClick, danger, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={`grid h-9 w-9 place-items-center rounded-xl border transition-colors ${
        danger
          ? "border-white/10 text-gray-400 hover:border-red-500/50 hover:text-red-400"
          : "border-white/10 text-gray-400 hover:border-octo-purple/50 hover:text-white"
      }`}
    >
      {children}
    </button>
  );
}

// Page heading with an optional "Add" button.
export function AdminPageHeader({ title, subtitle, actionLabel, onAction }) {
  return (
    <div className="mb-4 flex items-end justify-between gap-3">
      <div>
        <h1 className="section-title flex items-center gap-2.5 text-2xl">
          <span className="h-5 w-1 rounded-full bg-octo-purple" />
          {title}
        </h1>
        {subtitle && (
          <p className="mt-1 pl-3.5 font-mono text-[11px] uppercase tracking-wider text-gray-500">
            {subtitle}
          </p>
        )}
      </div>
      {onAction && (
        <button
          type="button"
          onClick={onAction}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-2xl bg-octo-purple px-4 py-2.5 font-display text-sm font-bold uppercase tracking-wide text-white shadow-glow-purple transition-opacity hover:opacity-90"
        >
          <PlusIcon />
          {actionLabel || "Add"}
        </button>
      )}
    </div>
  );
}

// A list row card with edit / delete actions.
export function AdminRow({ title, meta, badges, children, onEdit, onDelete, leading }) {
  return (
    <div className="octo-card flex items-start gap-3 p-4">
      {leading}
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="truncate font-display text-sm font-bold uppercase tracking-wide">{title}</span>
          {badges}
        </div>
        {meta && <div className="mt-0.5 font-mono text-[11px] text-gray-500">{meta}</div>}
        {children}
      </div>
      <div className="flex shrink-0 gap-1.5">
        {onEdit && <IconBtn label="Edit" onClick={onEdit}><EditIcon /></IconBtn>}
        {onDelete && <IconBtn label="Delete" onClick={onDelete} danger><TrashIcon /></IconBtn>}
      </div>
    </div>
  );
}

export function Pill({ children, color = "#6236FF" }) {
  return (
    <span
      className="rounded-full px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wider"
      style={{ color, backgroundColor: `${color}22`, border: `1px solid ${color}44` }}
    >
      {children}
    </span>
  );
}

export function Spinner({ label = "Loading…" }) {
  return (
    <div className="flex items-center justify-center gap-3 py-16 text-gray-500">
      <span className="h-5 w-5 animate-spin rounded-full border-2 border-octo-purple/30 border-t-octo-purple" />
      <span className="font-mono text-xs uppercase tracking-widest">{label}</span>
    </div>
  );
}

export function EmptyState({ children }) {
  return (
    <div className="octo-card p-8 text-center font-mono text-xs uppercase tracking-widest text-gray-500">
      {children}
    </div>
  );
}

export function ErrorNote({ children }) {
  if (!children) return null;
  return (
    <p className="mb-3 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 font-mono text-xs text-red-300">
      {children}
    </p>
  );
}

// Confirm-before-delete dialog.
export function ConfirmDialog({ open, title = "Delete", message, confirmLabel = "Delete", busy, onConfirm, onClose }) {
  if (!open) return null;
  return createPortal(
    <div className="fixed inset-0 z-[95] flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <button type="button" aria-label="Close" onClick={onClose} className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <div className="relative w-full max-w-sm animate-fade-up overflow-hidden rounded-3xl border border-white/10 bg-octo-card p-5 shadow-card">
        <h3 className="font-display text-lg font-bold uppercase tracking-wide text-white">{title}</h3>
        <p className="mt-2 font-sans text-sm text-gray-300">{message}</p>
        <div className="mt-5 flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-2xl border border-white/10 py-2.5 font-display text-sm font-bold uppercase tracking-wide text-gray-300 transition-colors hover:text-white"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={busy}
            className="flex-1 rounded-2xl bg-red-500/90 py-2.5 font-display text-sm font-bold uppercase tracking-wide text-white transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            {busy ? "…" : confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
