/**
 * A component that renders a subtle, ambient background effect.
 * It contains a faint scanline/grid overlay and two corner glows.
 * It is intended to be used as a wrapper around other components.
 */
export function Ambient() {
  return (
    <>
      {/* Faint scanline / grid overlay */}
      <div
        className="pointer-events-none fixed inset-0 opacity-[0.015]"
        aria-hidden
        style={{
          backgroundImage:
            "linear-gradient(rgba(0,255,136,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(0,255,136,0.1) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />
      {/* Corner glows */}
      <div
        className="pointer-events-none fixed right-0 top-0 h-[600px] w-[500px] rounded-full bg-emerald-500/3 blur-[160px]"
        aria-hidden
      />
      <div
        className="pointer-events-none fixed bottom-0 left-0 h-[400px] w-[400px] rounded-full bg-violet-500/3 blur-[120px]"
        aria-hidden
      />
    </>
  );
}