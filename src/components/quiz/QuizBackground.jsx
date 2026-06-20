// "Octopus Tournament" esports backdrop for the quiz page. A fixed, full-viewport
// scene layered back-to-front (base gradient → glow blobs → perspective grid →
// tentacles → soccer balls → stars → scanlines → vignette). Everything is static
// except the twinkling stars. The palette + layer styling live in index.css
// under `.quiz-arena` / `.quiz-*`. Purely decorative, so it is aria-hidden and
// never captures pointer events.

const STAR_COUNT = 60;

// Generated once at module load — a fixed starfield is plenty for decoration,
// and keeping the randomness out of render keeps the component pure.
const STARS = Array.from({ length: STAR_COUNT }, () => ({
  left: Math.random() * 100, // 0–100vw
  top: Math.random() * 60, // upper portion only (0–60vh)
  size: 1 + Math.random() * 2.5, // 1–3.5px
  duration: 2 + Math.random() * 3, // 2–5s
  delay: Math.random() * 5, // desync the twinkle
}));

// One curling tentacle (drawn rising from the bottom-left). The right-corner copy
// is the same SVG flipped with scaleX(-1) via the `.quiz-tentacle-right` class.
function Tentacle({ className }) {
  return (
    <svg className={className} viewBox="0 0 400 500" fill="none" aria-hidden="true">
      {/* secondary curl behind */}
      <path
        d="M70 500 C 70 380, 30 320, 120 250 C 200 190, 150 120, 240 70"
        stroke="var(--q-p2)"
        strokeWidth="7"
        strokeLinecap="round"
        opacity="0.7"
      />
      {/* main tentacle */}
      <path
        d="M110 500 C 110 360, 60 300, 150 230 C 230 170, 190 90, 300 40"
        stroke="var(--q-p3)"
        strokeWidth="10"
        strokeLinecap="round"
      />
      {/* suction-cup accents, fading toward the tip */}
      <circle cx="138" cy="300" r="7" fill="var(--q-white)" opacity="0.9" />
      <circle cx="190" cy="200" r="5" fill="var(--q-white)" opacity="0.6" />
      <circle cx="270" cy="80" r="3.5" fill="var(--q-white)" opacity="0.35" />
    </svg>
  );
}

// Simple glowing soccer-ball icon. `fill` themes the centre pentagon.
function Ball({ className, style, fill }) {
  return (
    <svg className={className} style={style} viewBox="0 0 100 100" fill="none" aria-hidden="true">
      <circle cx="50" cy="50" r="44" stroke="var(--q-white)" strokeWidth="3" />
      {/* centre pentagon */}
      <polygon
        points="50,30 67,43 60,63 40,63 33,43"
        fill={fill}
        stroke="var(--q-white)"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      {/* spokes from the pentagon vertices out to the rim */}
      <g stroke="var(--q-white)" strokeWidth="2" strokeLinecap="round">
        <line x1="50" y1="30" x2="50" y2="8" />
        <line x1="67" y1="43" x2="86" y2="33" />
        <line x1="60" y1="63" x2="74" y2="84" />
        <line x1="40" y1="63" x2="26" y2="84" />
        <line x1="33" y1="43" x2="14" y2="33" />
      </g>
    </svg>
  );
}

export default function QuizBackground() {
  return (
    <div className="quiz-bg" aria-hidden="true">
      {/* 2. Glow blobs */}
      <span className="quiz-blob quiz-blob-1" />
      <span className="quiz-blob quiz-blob-2" />
      <span className="quiz-blob quiz-blob-3" />

      {/* 3. Perspective grid floor + light bleed */}
      <div className="quiz-grid-wrap">
        <div className="quiz-grid" />
      </div>
      <div className="quiz-floor-glow" />

      {/* 4. Tentacle silhouettes (corners) */}
      <Tentacle className="quiz-tentacle quiz-tentacle-left" />
      <Tentacle className="quiz-tentacle quiz-tentacle-right" />

      {/* 5. Floating soccer balls */}
      <Ball
        className="quiz-ball"
        style={{ width: 54, height: 54, top: "14%", left: "10%" }}
        fill="var(--q-p2)"
      />
      <Ball
        className="quiz-ball"
        style={{ width: 38, height: 38, bottom: "22%", right: "12%" }}
        fill="var(--q-p1)"
      />
      <Ball
        className="quiz-ball"
        style={{ width: 30, height: 30, top: "20%", right: "16%" }}
        fill="var(--q-glow)"
      />

      {/* 8. Stars — the only motion */}
      <div className="quiz-stars">
        {STARS.map((s, i) => (
          <span
            key={i}
            className="quiz-star"
            style={{
              left: `${s.left}vw`,
              top: `${s.top}vh`,
              width: `${s.size}px`,
              height: `${s.size}px`,
              animationDuration: `${s.duration}s`,
              animationDelay: `${s.delay}s`,
            }}
          />
        ))}
      </div>

      {/* 6. Scanlines + 7. Vignette */}
      <div className="quiz-scanlines" />
      <div className="quiz-vignette" />
    </div>
  );
}
