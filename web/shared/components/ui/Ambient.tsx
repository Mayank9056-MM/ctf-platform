
/**
 * A component that adds a subtle ambient background to the page.
 * It is purely visual and does not affect the layout of the page.
 * The background consists of a radial gradient with a subtle teal color,
 * and two blurred rounded rectangles in emerald green and violet.
 */
export function Ambient() {
  return (
    <>
      <div
        className="pointer-events-none fixed inset-0 opacity-[0.01]"
        aria-hidden
        style={{
          backgroundImage:
            "radial-gradient(rgba(0,255,136,0.15) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />
      <div
        className="pointer-events-none fixed right-0 top-0 h-[600px] w-[400px] rounded-full bg-emerald-500/4 blur-[150px]"
        aria-hidden
      />
      <div
        className="pointer-events-none fixed bottom-0 left-0 h-[400px] w-[400px] rounded-full bg-violet-500/3 blur-[120px]"
        aria-hidden
      />
    </>
  );
}