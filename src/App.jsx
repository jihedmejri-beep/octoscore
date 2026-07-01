import { useEffect, useState } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";

import useTabSwipe, { TAB_PATHS } from "./hooks/useTabSwipe.js";
import BottomNav from "./components/layout/BottomNav.jsx";
import TopBar from "./components/layout/TopBar.jsx";
import NotifyPrompt from "./components/layout/NotifyPrompt.jsx";
import InstallPrompt from "./components/layout/InstallPrompt.jsx";
import ScrollToTopButton from "./components/ui/ScrollToTopButton.jsx";
import Home from "./routes/Home.jsx";
import Tournament from "./routes/Tournament.jsx";
import Matches from "./routes/Matches.jsx";
import MatchDetail from "./routes/MatchDetail.jsx";
import Teams from "./routes/Teams.jsx";
import TeamDetail from "./routes/TeamDetail.jsx";
import Quiz from "./routes/Quiz.jsx";
import VerifyEmail from "./routes/VerifyEmail.jsx";
import ResetPassword from "./routes/ResetPassword.jsx";
import AdminShell from "./admin/AdminShell.jsx";
import Dashboard from "./admin/pages/Dashboard.jsx";
import ManageTeams from "./admin/pages/ManageTeams.jsx";
import ManagePlayers from "./admin/pages/ManagePlayers.jsx";
import ManageMatches from "./admin/pages/ManageMatches.jsx";
import ManageQuiz from "./admin/pages/ManageQuiz.jsx";
import ManageGroups from "./admin/pages/ManageGroups.jsx";
import ManageContent from "./admin/pages/ManageContent.jsx";
import { useAuthStore } from "./store/authStore";
import { useDataStore } from "./store/dataStore";
import { usePushStore } from "./store/pushStore";
import { prefetchQuiz } from "./services/quizService";
import { LANGUAGES } from "./i18n";

export default function App() {
  const { i18n } = useTranslation();
  const location = useLocation();
  const swipe = useTabSwipe();

  // Pick a slide direction for the page transition by comparing the tab we're
  // entering with the one we just left. Mirrored for RTL so the motion always
  // matches the swipe. Falls back to a plain fade on non-tab routes. Computed by
  // adjusting state during render (React's pattern for "value from last render")
  // so the class is ready before paint — no ref-during-render anti-pattern.
  const [prevPath, setPrevPath] = useState(location.pathname);
  const [pageAnim, setPageAnim] = useState("page-enter");
  if (location.pathname !== prevPath) {
    const idx = TAB_PATHS.indexOf(location.pathname);
    const oldIdx = TAB_PATHS.indexOf(prevPath);
    const rtl = i18n.dir() === "rtl";
    let next = "page-enter";
    if (idx !== -1 && oldIdx !== -1 && idx !== oldIdx) {
      const forward = idx > oldIdx;
      next = `page-enter-from-${forward === rtl ? "left" : "right"}`;
    }
    setPrevPath(location.pathname);
    setPageAnim(next);
  }

  // On boot: validate any stored token, then load the live tournament data.
  // Also warm the quiz cache so opening the Quiz tab is instant later.
  useEffect(() => {
    useAuthStore.getState().hydrate();
    useDataStore.getState().load();
    usePushStore.getState().init();
    prefetchQuiz();
  }, []);

  // Keep <html lang> and text direction in sync with the active language so
  // Arabic renders RTL across the whole app.
  useEffect(() => {
    const lang = LANGUAGES.find((l) => l.code === i18n.language) ?? LANGUAGES[0];
    document.documentElement.lang = lang.code;
    document.documentElement.dir = lang.dir;
  }, [i18n.language]);

  return (
    <div className="app-bg relative min-h-screen overflow-x-hidden text-white">
      {/* Ambient background: breathing color glows layered over the hexagon
          lattice from .app-bg for extra depth. */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-32 -left-24 h-80 w-80 animate-glow-breathe rounded-full bg-octo-purple/25 blur-[120px]" />
        <div className="absolute top-1/3 -right-24 h-72 w-72 animate-glow-breathe rounded-full bg-octo-cyan/15 blur-[120px] [animation-delay:1.5s]" />
        <div className="absolute bottom-0 left-1/4 h-72 w-72 animate-glow-breathe rounded-full bg-octo-green/10 blur-[120px] [animation-delay:3s]" />
      </div>

      <TopBar />

      {/* Page content. Bottom padding leaves room for the floating navbar.
          Swipe handlers let you flick left/right between the main tabs; the
          keyed wrapper replays the slide-in animation on every route change. */}
      <main className="mx-auto max-w-2xl px-4 pb-28 pt-5" {...swipe}>
        <div key={location.pathname} className={pageAnim}>
        <Routes location={location}>
          <Route path="/" element={<Home />} />
          <Route path="/tournament" element={<Tournament />} />
          <Route path="/matches" element={<Matches />} />
          <Route path="/matches/:matchId" element={<MatchDetail />} />
          <Route path="/teams" element={<Teams />} />
          <Route path="/teams/:teamId" element={<TeamDetail />} />
          <Route path="/quiz" element={<Quiz />} />
          <Route path="/verify-email" element={<VerifyEmail />} />
          <Route path="/reset-password" element={<ResetPassword />} />

          {/* Admin control center (guarded inside AdminShell) */}
          <Route path="/admin" element={<AdminShell />}>
            <Route index element={<Dashboard />} />
            <Route path="teams" element={<ManageTeams />} />
            <Route path="players" element={<ManagePlayers />} />
            <Route path="matches" element={<ManageMatches />} />
            <Route path="quiz" element={<ManageQuiz />} />
            <Route path="groups" element={<ManageGroups />} />
            <Route path="content" element={<ManageContent />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        </div>
      </main>

      <ScrollToTopButton />
      <InstallPrompt />
      <NotifyPrompt />
      <BottomNav />
    </div>
  );
}
