import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

// Tiny controlled-form helper to cut per-page boilerplate.
// eslint-disable-next-line react-refresh/only-export-components
export function useForm(initial) {
  const [values, setValues] = useState(initial);
  const set = (key, val) => setValues((v) => ({ ...v, [key]: val }));
  const bind = (key) => ({
    value: values[key] ?? "",
    onChange: (e) => set(key, e.target.value),
  });
  const bindCheck = (key) => ({
    checked: Boolean(values[key]),
    onChange: (e) => set(key, e.target.checked),
  });
  return { values, set, setValues, bind, bindCheck };
}

const labelCls =
  "mb-1.5 block font-mono text-[11px] font-semibold uppercase tracking-wider text-gray-400";

export function TextField({ label, hint, ...props }) {
  return (
    <label className="block">
      <span className={labelCls}>{label}</span>
      <input className="auth-input" {...props} />
      {hint && <span className="mt-1 block font-mono text-[10px] text-gray-500">{hint}</span>}
    </label>
  );
}

export function NumberField({ label, hint, ...props }) {
  return (
    <label className="block">
      <span className={labelCls}>{label}</span>
      <input type="number" className="auth-input" {...props} />
      {hint && <span className="mt-1 block font-mono text-[10px] text-gray-500">{hint}</span>}
    </label>
  );
}

export function TextAreaField({ label, rows = 3, ...props }) {
  return (
    <label className="block">
      <span className={labelCls}>{label}</span>
      <textarea rows={rows} className="auth-input resize-y" {...props} />
    </label>
  );
}

export function SelectField({ label, options, ...props }) {
  return (
    <label className="block">
      <span className={labelCls}>{label}</span>
      <select className="auth-input" {...props}>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

export function CheckboxField({ label, ...props }) {
  return (
    <label className="flex cursor-pointer items-center gap-2.5">
      <input type="checkbox" className="h-4 w-4 accent-octo-purple" {...props} />
      <span className="font-sans text-sm text-gray-200">{label}</span>
    </label>
  );
}

const CloseIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="h-5 w-5">
    <path d="M6 6l12 12M18 6L6 18" />
  </svg>
);

// Centered, portaled form modal with Cancel / Save footer.
export function AdminModal({ title, onClose, onSubmit, busy, error, submitLabel = "Save", children }) {
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  return createPortal(
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <button type="button" aria-label="Close" onClick={onClose} className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <form
        onSubmit={onSubmit}
        className="relative flex max-h-[90vh] w-full max-w-lg animate-fade-up flex-col overflow-hidden rounded-3xl border border-white/10 bg-octo-card shadow-card"
      >
        <div className="flex items-center justify-between border-b border-white/5 px-5 py-4">
          <h3 className="font-display text-lg font-bold uppercase tracking-wide">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="grid h-8 w-8 place-items-center rounded-full border border-white/10 text-gray-400 transition-colors hover:text-white"
          >
            <CloseIcon />
          </button>
        </div>

        <div className="space-y-4 overflow-y-auto px-5 py-5">
          {children}
          {error && (
            <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-center font-mono text-xs text-red-300">
              {error}
            </p>
          )}
        </div>

        <div className="flex gap-2 border-t border-white/5 px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-2xl border border-white/10 py-2.5 font-display text-sm font-bold uppercase tracking-wide text-gray-300 transition-colors hover:text-white"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={busy}
            className="flex-1 rounded-2xl bg-octo-purple py-2.5 font-display text-sm font-bold uppercase tracking-wide text-white shadow-glow-purple transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            {busy ? "Saving…" : submitLabel}
          </button>
        </div>
      </form>
    </div>,
    document.body
  );
}
