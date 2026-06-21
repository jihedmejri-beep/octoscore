import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";

import App from "./App.jsx";
import ErrorBoundary from "./components/ErrorBoundary.jsx";
import { initSentry } from "./sentry.js"; // production error reporting (opt-in via DSN)
import "./i18n"; // initialize i18next before the tree renders
import "./index.css";

initSentry();

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </ErrorBoundary>
  </StrictMode>
);
