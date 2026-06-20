import { NavLink, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";

// Bold line icons (stroke = currentColor) so they inherit the active/inactive
// colour from their wrapper.
const iconProps = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.9,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  className: "h-6 w-6",
};

const HomeIcon = () => (
  <svg {...iconProps}>
    <path d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.5a.75.75 0 0 0 .75.75H9.75v-6a.75.75 0 0 1 .75-.75h3a.75.75 0 0 1 .75.75v6h4.5a.75.75 0 0 0 .75-.75V9.75" />
  </svg>
);

// Bracket / sitemap icon for the Tournament tab.
const BracketIcon = () => (
  <svg {...iconProps}>
    <rect x="3" y="4" width="6" height="4" rx="1" />
    <rect x="3" y="16" width="6" height="4" rx="1" />
    <rect x="15" y="10" width="6" height="4" rx="1" />
    <path d="M9 6h3v6h3M9 18h3v-6" />
  </svg>
);

// Soccer ball for the Matches tab.
const BallIcon = () => (
  <svg {...iconProps}>
    <circle cx="12" cy="12" r="9" />
    <path d="m12 7 3.5 2.5-1.3 4.1H9.8L8.5 9.5 12 7Z" />
    <path d="M12 7V3.2M15.5 9.5l3.6-1.2M14.2 13.6l2.3 3M9.8 13.6l-2.3 3M8.5 9.5 4.9 8.3" />
  </svg>
);

const UsersIcon = () => (
  <svg {...iconProps}>
    <path d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
  </svg>
);

// Quiz card with a question mark.
const QuizIcon = () => (
  <svg {...iconProps}>
    <rect x="4" y="3.5" width="16" height="17" rx="3" />
    <path d="M9.5 9.2a2.5 2.5 0 1 1 3.4 2.33c-.6.24-.9.66-.9 1.27v.4" />
    <path d="M12 16.2h.01" />
  </svg>
);

// 5 tabs in the exact spec order (Tournament keeps its name per spec).
const TABS = [
  { to: "/", key: "home", Icon: HomeIcon, end: true },
  { to: "/tournament", key: "tournament", Icon: BracketIcon },
  { to: "/matches", key: "matches", Icon: BallIcon },
  { to: "/teams", key: "teams", Icon: UsersIcon },
  { to: "/quiz", key: "quiz", Icon: QuizIcon },
];

export default function BottomNav() {
  const { t } = useTranslation();
  const { pathname } = useLocation();

  // Which tab the current route belongs to — drives the sliding pill. -1 on
  // routes with no tab (e.g. /admin), which simply hides the pill.
  const activeIndex = TABS.findIndex((tab) =>
    tab.end ? pathname === tab.to : pathname === tab.to || pathname.startsWith(`${tab.to}/`)
  );

  return (
    // Fixed at the bottom with 16px side margins and 12px from the bottom edge
    // (kept clear of the iOS home indicator via the safe-area inset).
    <nav
      className="fixed inset-x-0 z-50 px-4"
      style={{ bottom: "max(12px, env(safe-area-inset-bottom))" }}
    >
      <div
        className="relative mx-auto h-[72px] max-w-2xl overflow-hidden rounded-[28px] border border-white/[0.07] backdrop-blur-2xl backdrop-saturate-150"
        style={{
          // Near-neutral dark glass: lets the colourful app background bloom
          // softly through the blur instead of sitting on a flat purple slab.
          background:
            "linear-gradient(to bottom, rgba(20,18,30,0.62), rgba(11,10,18,0.80))",
          boxShadow:
            "inset 0 1px 0 rgba(255,255,255,0.07), 0 12px 34px rgba(0,0,0,0.45)",
        }}
      >
        {/* A faint purple bloom low and centred — a hint of brand, not a slab */}
        <div className="pointer-events-none absolute -bottom-10 left-1/2 h-24 w-3/4 -translate-x-1/2 rounded-full bg-octo-purple/12 blur-3xl" />
        {/* Glass edge: a fading highlight hairline along the top */}
        <div className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent" />

        {/* Sliding highlight pill — glides under the active tab */}
        <div
          className="pointer-events-none absolute inset-y-0 left-0 z-0 transition-[transform,opacity] duration-300 ease-out"
          style={{
            width: `${100 / TABS.length}%`,
            transform: `translateX(${activeIndex < 0 ? 0 : activeIndex * 100}%)`,
            opacity: activeIndex < 0 ? 0 : 1,
          }}
        >
          <div
            className="absolute inset-x-2.5 inset-y-2.5 rounded-2xl border border-white/10 bg-white/[0.06]"
            style={{ boxShadow: "inset 0 1px 0 rgba(255,255,255,0.10)" }}
          />
        </div>

        <ul className="relative z-10 flex h-full items-stretch justify-between">
          {TABS.map(({ to, key, Icon, end }) => (
            <li key={key} className="flex-1">
              <NavLink
                to={to}
                end={end}
                className="group flex h-full flex-col items-center justify-center gap-1.5 transition-transform active:scale-90"
              >
                {({ isActive }) => (
                  <span
                    className="flex flex-col items-center gap-1.5 transition-colors duration-300"
                    style={{ color: isActive ? "#FACC15" : "#7b749e" }}
                  >
                    {/* Icon with a soft gold glow when active */}
                    <span className="relative grid place-items-center">
                      {isActive && (
                        <span className="absolute h-9 w-9 rounded-full bg-[#FACC15]/20 blur-md" />
                      )}
                      <span
                        className={`relative transition-transform duration-300 ${
                          isActive ? "-translate-y-0.5" : "group-hover:-translate-y-0.5"
                        }`}
                      >
                        <Icon />
                      </span>
                    </span>
                    <span className="font-display text-[11px] font-bold uppercase leading-none tracking-wide">
                      {t(`nav.${key}`)}
                    </span>
                  </span>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
}
