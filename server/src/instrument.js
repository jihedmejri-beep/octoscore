// Sentry initialisation for the API. This MUST be imported before any other
// module (especially express) so the SDK can auto-instrument them — see the
// first line of index.js. Stays a no-op until SENTRY_DSN is set, so local dev
// and unconfigured deploys are unaffected.
import "dotenv/config";
import * as Sentry from "@sentry/node";

if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV || "development",
  });
}
