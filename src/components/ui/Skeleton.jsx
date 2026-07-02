// Shimmering placeholders shown while live data loads. Shaped like the real
// content (cards, rows, grids) so the page doesn't jump when data arrives —
// a far better perceived-speed cue than a spinner, especially through the
// API's cold starts.

// One glowing bone. Size/shape via className.
export function Bone({ className = "" }) {
  return (
    <div
      aria-hidden
      className={`animate-shimmer rounded-lg bg-white/[0.05] bg-[linear-gradient(110deg,transparent_35%,rgba(255,255,255,0.07)_50%,transparent_65%)] bg-[length:200%_100%] ${className}`}
    />
  );
}

// A match-card sized placeholder (used by Matches and Home's upcoming list).
export function MatchCardSkeleton() {
  return (
    <div className="octo-card p-4">
      <div className="mb-3 flex items-center justify-between">
        <Bone className="h-3 w-28" />
        <Bone className="h-4 w-16 rounded-full" />
      </div>
      <div className="flex items-center justify-between gap-3">
        <div className="flex flex-1 items-center gap-2.5">
          <Bone className="h-9 w-9 shrink-0 rounded-full" />
          <Bone className="h-4 w-full max-w-[90px]" />
        </div>
        <Bone className="h-6 w-10 shrink-0" />
        <div className="flex flex-1 items-center justify-end gap-2.5">
          <Bone className="h-4 w-full max-w-[90px]" />
          <Bone className="h-9 w-9 shrink-0 rounded-full" />
        </div>
      </div>
      <div className="mt-3 border-t border-white/5 pt-3">
        <Bone className="h-3 w-36" />
      </div>
    </div>
  );
}

// A stack of match cards.
export function MatchListSkeleton({ count = 4 }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }, (_, i) => (
        <MatchCardSkeleton key={i} />
      ))}
    </div>
  );
}

// The Teams grid: circle crest + two text lines per tile.
export function TeamGridSkeleton({ count = 6 }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="octo-card flex flex-col items-center gap-3 p-5">
          <Bone className="h-16 w-16 rounded-full" />
          <Bone className="h-4 w-20" />
          <Bone className="h-3 w-14 rounded-full" />
        </div>
      ))}
    </div>
  );
}

// Home below the hero: live banner + results rail + a couple of list cards.
export function HomeSkeleton() {
  return (
    <div className="space-y-8">
      <div className="octo-card p-5">
        <div className="mb-4 flex items-center justify-between">
          <Bone className="h-5 w-28 rounded-full" />
          <Bone className="h-3 w-16" />
        </div>
        <div className="flex items-center justify-between gap-3">
          <div className="flex flex-1 items-center gap-2.5">
            <Bone className="h-10 w-10 shrink-0 rounded-full" />
            <Bone className="h-4 w-full max-w-[100px]" />
          </div>
          <Bone className="h-9 w-16 shrink-0" />
          <div className="flex flex-1 items-center justify-end gap-2.5">
            <Bone className="h-4 w-full max-w-[100px]" />
            <Bone className="h-10 w-10 shrink-0 rounded-full" />
          </div>
        </div>
      </div>

      <div>
        <Bone className="mb-3 h-5 w-40" />
        <div className="no-scrollbar -mx-4 flex gap-3 overflow-x-auto px-4">
          {Array.from({ length: 3 }, (_, i) => (
            <div key={i} className="octo-card min-w-[240px] p-4">
              <Bone className="mb-3 h-3 w-24" />
              <div className="flex items-center gap-2.5">
                <Bone className="h-8 w-8 rounded-full" />
                <Bone className="h-4 w-24" />
              </div>
              <div className="mt-2 flex items-center gap-2.5">
                <Bone className="h-8 w-8 rounded-full" />
                <Bone className="h-4 w-24" />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <Bone className="mb-3 h-5 w-36" />
        <MatchListSkeleton count={2} />
      </div>
    </div>
  );
}
