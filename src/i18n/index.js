import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import en from "./en.json";
import fr from "./fr.json";
import ar from "./ar.json";

// Supported languages. Arabic is RTL — components flip via the `dir` attribute
// set on <html> (see App.jsx language effect).
export const LANGUAGES = [
  { code: "en", label: "EN", name: "English", dir: "ltr" },
  { code: "fr", label: "FR", name: "Français", dir: "ltr" },
  { code: "ar", label: "AR", name: "العربية", dir: "rtl" },
];

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    fr: { translation: fr },
    ar: { translation: ar },
  },
  lng: "en",
  fallbackLng: "en",
  interpolation: { escapeValue: false },
});

export default i18n;
