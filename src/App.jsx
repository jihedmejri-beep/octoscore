import { useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

import BottomNav from "./components/layout/BottomNav.jsx";
import TopBar from "./components/layout/TopBar.jsx";
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
import ManageGallery from "./admin/pages/ManageGallery.jsx";
import ManageQuiz from "./admin/pages/ManageQuiz.jsx";
import ManageGroups from "./admin/pages/ManageGroups.jsx";
import ManageContent from "./admin/pages/ManageContent.jsx";
import { useAuthStore } from "./store/authStore";
import { useDataStore } from "./store/dataStore";
import { LANGUAGES } from "./i18n";

export default function App() {
  const { i18n } = useTranslation();

  // On boot: validate any stored token, then load the live tournament data.
  useEffect(() => {
    useAuthStore.getState().hydrate();
    useDataStore.getState().load();
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

      {/* Page content. Bottom padding leaves room for the floating navbar. */}
      <main className="mx-auto max-w-2xl px-4 pb-28 pt-5">
        <Routes>
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
            <Route path="gallery" element={<ManageGallery />} />
            <Route path="quiz" element={<ManageQuiz />} />
            <Route path="groups" element={<ManageGroups />} />
            <Route path="content" element={<ManageContent />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      <ScrollToTopButton />
      <BottomNav />
    </div>
  );
}
