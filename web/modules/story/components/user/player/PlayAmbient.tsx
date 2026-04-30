export function PlayAmbient({ color }: { color: string }) {
  return (
    <>
      <div
        className="pointer-events-none fixed inset-0 opacity-[0.006]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(139,92,246,0.5) 1px,transparent 1px),linear-gradient(90deg,rgba(139,92,246,0.5) 1px,transparent 1px)",
          backgroundSize: "40px 40px",
        }}
        aria-hidden
      />
      <div
        className="pointer-events-none fixed inset-0 opacity-10"
        style={{
          background: `radial-gradient(ellipse at 50% 40%, ${color}20 0%, transparent 65%)`,
        }}
        aria-hidden
      />
    </>
  );
}
