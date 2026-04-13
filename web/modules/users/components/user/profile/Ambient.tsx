export function Ambient() {
  return (
    <>
      <div
        className="pointer-events-none fixed inset-0 opacity-[0.012]"
        aria-hidden
        style={{
          backgroundImage:
            "radial-gradient(rgba(0,255,136,0.15) 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }}
      />
      <div
        className="pointer-events-none fixed right-0 top-0 h-[500px] w-[500px] rounded-full bg-emerald-500/4 blur-[160px]"
        aria-hidden
      />
      <div
        className="pointer-events-none fixed bottom-0 left-0 h-[400px] w-[350px] rounded-full bg-violet-500/3 blur-[120px]"
        aria-hidden
      />
    </>
  );
}
