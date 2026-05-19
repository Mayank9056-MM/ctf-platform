export function GridOverlay() {
  return (
    <div
      className="pointer-events-none fixed inset-0 z-0 opacity-[0.018]"
      style={{
        backgroundImage:
          "linear-gradient(rgba(0,255,136,1) 1px, transparent 1px), linear-gradient(90deg, rgba(0,255,136,1) 1px, transparent 1px)",
        backgroundSize: "64px 64px",
      }}
      aria-hidden
    />
  );
}
