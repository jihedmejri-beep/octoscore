import { useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

// The 5 main tabs, in the same visual left-to-right order as the bottom nav.
// Swiping moves to the neighbouring tab; swiping is a no-op on any other route
// (match/team detail, admin, auth pages) so it never fires unexpectedly.
export const TAB_PATHS = ["/", "/tournament", "/matches", "/teams", "/quiz"];

// Gesture thresholds tuned for a phone: the flick must be a clear, mostly
// horizontal motion so it never hijacks vertical page scrolling or a tap.
const MIN_DISTANCE = 55; // px of horizontal travel required
const HORIZONTAL_BIAS = 1.8; // |dx| must beat |dy| by this factor

// Returns touch handlers to spread onto the page container. A left/right flick
// navigates to the previous/next main tab (mirrored for RTL/Arabic). Gestures
// that begin inside a horizontal scroller (`.no-scrollbar`) or an opted-out
// element (`[data-no-swipe]`) are ignored so carousels still scroll normally.
export default function useTabSwipe() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { i18n } = useTranslation();
  const start = useRef(null);

  const onTouchStart = (e) => {
    const target = e.target;
    if (
      target?.closest?.(".no-scrollbar, [data-no-swipe], input, textarea, select")
    ) {
      start.current = null;
      return;
    }
    const t = e.touches[0];
    start.current = { x: t.clientX, y: t.clientY };
  };

  const onTouchEnd = (e) => {
    const from = start.current;
    start.current = null;
    if (!from) return;

    const idx = TAB_PATHS.indexOf(pathname);
    if (idx === -1) return; // only swipe between the main tabs

    const t = e.changedTouches[0];
    const dx = t.clientX - from.x;
    const dy = t.clientY - from.y;
    if (Math.abs(dx) < MIN_DISTANCE || Math.abs(dx) < Math.abs(dy) * HORIZONTAL_BIAS) {
      return; // not a decisive horizontal flick
    }

    // In RTL the axis is mirrored: swiping right moves forward through the tabs.
    const rtl = i18n.dir() === "rtl";
    const forward = rtl ? dx > 0 : dx < 0;
    const next = idx + (forward ? 1 : -1);
    if (next >= 0 && next < TAB_PATHS.length) navigate(TAB_PATHS[next]);
  };

  return { onTouchStart, onTouchEnd };
}
