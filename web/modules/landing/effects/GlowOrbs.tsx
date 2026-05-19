export function GlowOrbs() {
  return (
    <>
      <div
        className="pointer-events-none fixed right-[-10%] top-[-5%] h-[600px] w-[600px] rounded-full bg-emerald-500/5 blur-[120px]"
        aria-hidden
      />
      <div
        className="pointer-events-none fixed left-[-8%] bottom-[10%] h-[500px] w-[500px] rounded-full bg-cyan-500/4 blur-[100px]"
        aria-hidden
      />
      <div
        className="pointer-events-none fixed left-[40%] top-[50%] h-[300px] w-[300px] rounded-full bg-violet-500/3 blur-[80px]"
        aria-hidden
      />
    </>
  );
}
