// Error-reporting wrapper. The heavy @sentry/react SDK is pulled in with a
// dynamic import() — so Vite splits it into its own chunk that is only fetched
// when VITE_SENTRY_DSN is set. Until you add a DSN this ships no Sentry code to
// users and every call here is a silent no-op.
let sentry = null;

// Fire-and-forget from main.jsx. Loads + initialises the SDK only if a DSN is
// configured (set VITE_SENTRY_DSN in your Vercel env / .env).
export async function initSentry() {
  const dsn = import.meta.env.VITE_SENTRY_DSN;
  if (!dsn) return; // not configured — stay a no-op

  try {
    const S = await import("@sentry/react");
    S.init({ dsn, environment: import.meta.env.MODE });
    sentry = S;
  } catch (err) {
    console.error("Sentry init failed:", err);
  }
}

// Report a caught error (e.g. from the ErrorBoundary). No-op until init runs.
export function captureError(error, extra) {
  if (!sentry) return;
  sentry.captureException(error, extra ? { extra } : undefined);
}
