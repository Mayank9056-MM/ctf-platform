export function Ambient() {
  return (
    <>
      <div
        className="pointer-events-none fixed inset-0 opacity-[0.012]"
        aria-hidden
        style={{
          backgroundImage:
            "radial-gradient(rgba(245,158,11,0.12) 1px, transparent 1px)",
          backgroundSize: "36px 36px",
        }}
      />
      <div
        className="pointer-events-none fixed left-0 top-0 h-[500px] w-[500px] rounded-full bg-amber-500/3 blur-[160px]"
        aria-hidden
      />
      <div
        className="pointer-events-none fixed bottom-0 right-0 h-[400px] w-[400px] rounded-full bg-emerald-500/3 blur-[120px]"
        aria-hidden
      />
    </>
  );
}
