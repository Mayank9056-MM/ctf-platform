export function Ambient() {
  return (
    <>
      <div className="pointer-events-none fixed inset-0 opacity-[0.012]" aria-hidden style={{
        backgroundImage: "linear-gradient(rgba(251,191,36,0.08) 1px,transparent 1px),linear-gradient(90deg,rgba(251,191,36,0.08) 1px,transparent 1px)",
        backgroundSize: "60px 60px",
      }} />
      <div className="pointer-events-none fixed left-1/2 top-0 h-[500px] w-[600px] -translate-x-1/2 rounded-full bg-amber-500/3 blur-[160px]" aria-hidden />
    </>
  );
}