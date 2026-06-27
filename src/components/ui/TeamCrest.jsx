import { useDataStore } from "../../store/dataStore";

// Two-letter initials from a team name.
function getInitials(name) {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}

// Deterministic accent color per team (from the Elite palette).
const BADGE_COLORS = ["#6236FF", "#39FF14", "#00E5FF"];
function badgeColor(seed = "") {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) hash = seed.charCodeAt(i) + hash;
  return BADGE_COLORS[hash % BADGE_COLORS.length];
}

// Logos are stored as the raw Cloudinary upload (full size), but a crest is
// only ever shown as a small circle (80px at most, so ~160px on retina). This
// rewrites the delivery URL to ask Cloudinary for a width-capped, auto-format,
// auto-quality version — a tiny fraction of the original, served from its CDN
// and cached once for every place the crest appears. Non-Cloudinary URLs (or
// ones already transformed) are returned untouched.
const CREST_TRANSFORM = "f_auto,q_auto,c_limit,w_256";
function optimizeLogo(url) {
  if (!url || !url.includes("/image/upload/")) return url;
  if (url.includes("/image/upload/f_auto")) return url; // already optimized
  return url.replace("/image/upload/", `/image/upload/${CREST_TRANSFORM}/`);
}

// Team crest: shows the admin-uploaded logo when available, otherwise falls
// back to a colored circle with the team's initials. Resolves the team from the
// live data store unless name/logo are passed in directly.
export default function TeamCrest({ teamId, name, logo, className = "h-9 w-9 text-xs" }) {
  const team = useDataStore((s) => s.teams.find((t) => t.id === teamId));
  const label = name ?? team?.name ?? "";
  const logoUrl = logo ?? team?.logo?.url ?? "";

  if (logoUrl) {
    return (
      <img
        src={optimizeLogo(logoUrl)}
        alt={label}
        loading="lazy"
        decoding="async"
        className={`shrink-0 rounded-full bg-octo-elevated object-cover ${className}`}
      />
    );
  }

  const color = badgeColor(teamId ?? label);
  return (
    <span
      className={`grid shrink-0 place-items-center rounded-full font-display font-bold ${className}`}
      style={{ backgroundColor: `${color}26`, color, border: `1px solid ${color}40` }}
    >
      {getInitials(label)}
    </span>
  );
}
