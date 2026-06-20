import { useState } from "react";
import { Link, NavLink, Outlet } from "react-router-dom";

import { useAuth } from "../hooks/useAuth.js";
import AuthModal from "../components/auth/AuthModal.jsx";
import { Spinner } from "./components/AdminTable.jsx";

const TABS = [
  { to: "/admin", label: "Overview", end: true },
  { to: "/admin/teams", label: "Teams" },
  { to: "/admin/players", label: "Players" },
  { to: "/admin/matches", label: "Matches" },
  { to: "/admin/gallery", label: "Gallery" },
  { to: "/admin/quiz", label: "Quiz" },
  { to: "/admin/groups", label: "Groups" },
  { to: "/admin/content", label: "Content" },
];

// Gate shown to anyone who isn't a signed-in admin.
function Gate({ isAuthenticated }) {
  const [showAuth, setShowAuth] = useState(false);
  return (
    <div className="py-16">
      <div className="octo-card mx-auto max-w-sm p-8 text-center">
        <div className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-2xl bg-octo-purple/15 text-octo-purple">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
            <rect x="4" y="10" width="16" height="11" rx="2" />
            <path d="M8 10V7a4 4 0 0 1 8 0v3" />
          </svg>
        </div>
        <h1 className="font-display text-xl font-bold uppercase tracking-wide">Admin access required</h1>
        <p className="mt-2 font-sans text-sm text-gray-400">
          {isAuthenticated
            ? "This account doesn't have admin rights."
            : "Sign in with the admin account to manage the tournament."}
        </p>
        <div className="mt-5 flex flex-col gap-2">
          {!isAuthenticated && (
            <button
              type="button"
              onClick={() => setShowAuth(true)}
              className="rounded-2xl bg-octo-purple py-2.5 font-display text-sm font-bold uppercase tracking-wide text-white shadow-glow-purple transition-opacity hover:opacity-90"
            >
              Sign In
            </button>
          )}
          <Link
            to="/"
            className="rounded-2xl border border-white/10 py-2.5 font-display text-sm font-bold uppercase tracking-wide text-gray-300 transition-colors hover:text-white"
          >
            Back to site
          </Link>
        </div>
      </div>
      {showAuth && <AuthModal key="admin-gate" initialMode="signin" onClose={() => setShowAuth(false)} />}
    </div>
  );
}

export default function AdminShell() {
  const { ready, isAuthenticated, isAdmin } = useAuth();

  if (!ready) return <Spinner label="Checking access…" />;
  if (!isAdmin) return <Gate isAuthenticated={isAuthenticated} />;

  return (
    <div>
      <div className="mb-5 flex items-center gap-2">
        <span className="rounded-full bg-octo-gold/20 px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-wider text-octo-gold">
          Admin
        </span>
        <span className="font-mono text-[11px] uppercase tracking-wider text-gray-500">
          Control Center
        </span>
      </div>

      {/* Section nav */}
      <div className="no-scrollbar -mx-4 mb-6 flex gap-2 overflow-x-auto px-4">
        {TABS.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            end={tab.end}
            className={({ isActive }) =>
              `shrink-0 rounded-full border px-3.5 py-1.5 font-mono text-[11px] font-semibold uppercase tracking-wider transition-colors ${
                isActive
                  ? "border-octo-purple bg-octo-purple/15 text-white"
                  : "border-white/10 bg-octo-card text-gray-400 hover:text-white"
              }`
            }
          >
            {tab.label}
          </NavLink>
        ))}
      </div>

      <Outlet />
    </div>
  );
}
