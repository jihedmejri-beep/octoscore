// Simple centered spinner for loading states across public pages.
export default function Loader({ label = "Loading…" }) {
  return (
    <div className="flex items-center justify-center gap-3 py-20 text-gray-500">
      <span className="h-5 w-5 animate-spin rounded-full border-2 border-octo-purple/30 border-t-octo-purple" />
      <span className="font-mono text-xs uppercase tracking-widest">{label}</span>
    </div>
  );
}
