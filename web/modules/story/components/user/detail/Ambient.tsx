export function Ambient({ color }: { color?: string }) {
  return (
    <>
      <div
        className="pointer-events-none fixed inset-0 opacity-[0.008]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(139,92,246,0.4) 1px,transparent 1px),linear-gradient(90deg,rgba(139,92,246,0.4) 1px,transparent 1px)",
          backgroundSize: "60px 60px",
        }}
        aria-hidden
      />
      <div
        className="pointer-events-none fixed top-0 right-0 h-[700px] w-[700px] rounded-full blur-[160px]"
        style={{ background: color ? `${color}08` : "rgba(139,92,246,0.05)" }}
        aria-hidden
      />
      <div
        className="pointer-events-none fixed bottom-0 left-0 h-[400px] w-[400px] rounded-full bg-emerald-500/3 blur-[100px]"
        aria-hidden
      />
    </>
  );
}
