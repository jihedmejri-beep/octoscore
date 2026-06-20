import { useEffect, useState } from "react";

// Floating "back to top" button. Fades in once the user scrolls past the fold
// and sits just above the floating bottom navigation.
export default function ScrollToTopButton() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > 480);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <button
      type="button"
      aria-label="Scroll to top"
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      className={`fixed right-4 z-40 grid h-11 w-11 place-items-center rounded-full border border-octo-purple/40 bg-octo-card/90 text-white shadow-glow-purple backdrop-blur transition-all duration-300 hover:-translate-y-0.5 hover:border-octo-purple ${
        show
          ? "translate-y-0 opacity-100"
          : "pointer-events-none translate-y-3 opacity-0"
      }`}
      style={{ bottom: "calc(max(1rem, env(safe-area-inset-bottom)) + 5.5rem)" }}
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-5 w-5"
      >
        <path d="m6 15 6-6 6 6" />
      </svg>
    </button>
  );
}
