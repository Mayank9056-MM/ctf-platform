export function Ambient() {
  return (
    <>
      <div
        className="pointer-events-none fixed inset-0 opacity-[0.008]"
        style={{
          backgroundImage:
            "linear-gradient(#00ff88 1px,transparent 1px),linear-gradient(90deg,#00ff88 1px,transparent 1px)",
          backgroundSize: "60px 60px",
        }}
        aria-hidden
      />
      <div
        className="pointer-events-none fixed top-0 right-0 h-[600px] w-[600px] rounded-full bg-violet-500/5 blur-[140px]"
        aria-hidden
      />
      <div
        className="pointer-events-none fixed bottom-0 left-0 h-[500px] w-[500px] rounded-full bg-emerald-500/4 blur-[120px]"
        aria-hidden
      />
      <div
        className="pointer-events-none fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[300px] w-[300px] rounded-full bg-cyan-500/3 blur-[100px]"
        aria-hidden
      />
    </>
  );
}
