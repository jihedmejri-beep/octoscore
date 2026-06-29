import { Link } from "react-router-dom";

import LanguageSwitcher from "./LanguageSwitcher.jsx";
import AccountMenu from "./AccountMenu.jsx";
import NotifyBell from "./NotifyBell.jsx";
import Search from "../search/Search.jsx";
import logo from "../../assets/logo.jpeg";

export default function TopBar() {
  return (
    <header className="sticky top-0 z-40 border-b border-white/[0.06] bg-octo-bg/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-2xl items-center justify-between gap-3 px-4 py-3">
        {/* Left: logo emblem + wordmark (links home) */}
        <Link to="/" className="group flex items-center gap-3">
          {/* Emblem: the logo's own circular badge IS the logo — no wrapper
              ring. The crown baked into the top of the JPEG is cropped out by
              zooming in and shifting the focus down onto the badge. */}
          <span className="relative shrink-0">
            <span
              className="absolute -inset-1 rounded-full bg-octo-purple/30 blur-md transition-all duration-300 group-hover:bg-octo-purple/50"
              aria-hidden="true"
            />
            <span
              role="img"
              aria-label="Octopus Tournament"
              className="relative block h-12 w-12 rounded-full bg-white bg-no-repeat transition-transform duration-300 group-hover:scale-105 group-active:scale-95"
              style={{
                // Measured from the source JPEG: badge center sits at
                // 49.2% × 55.3% (the crown offsets it) and spans 68.3% of the
                // width. These zoom/position values centre that badge in the
                // circle and crop the crown off the top.
                backgroundImage: `url(${logo})`,
                backgroundSize: "143%",
                backgroundPosition: "47% 67%",
              }}
            />
          </span>

          {/* Wordmark + micro-tagline */}
          <span className="flex flex-col leading-none">
            <span className="font-display text-2xl font-bold uppercase tracking-wide text-white">
              OCTO
              <span className="bg-gradient-to-r from-octo-purple via-octo-purple to-octo-cyan bg-clip-text text-transparent drop-shadow-[0_0_14px_rgba(98,54,255,0.45)]">
                SCORE
              </span>
            </span>
            <span className="mt-1 font-mono text-[8.5px] font-semibold uppercase tracking-[0.32em] text-gray-500 transition-colors group-hover:text-gray-400">
              Octopus Tournament
            </span>
          </span>
        </Link>

        {/* Right: language + account */}
        <div className="flex items-center gap-2">
          <Search />
          <NotifyBell />
          <LanguageSwitcher />
          <AccountMenu />
        </div>
      </div>
    </header>
  );
}
