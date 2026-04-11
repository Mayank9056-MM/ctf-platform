/**
 * A component that renders a gradient background with a given color.
 * It is used to add a subtle gradient effect to the background of a component.
 * @param {{ color: string }} props - The color of the gradient.
 * @returns {React.ReactElement} - The rendered component.
 */
export function Ambient({ color }: { color: string }) {
  return (
    <>
      <div className="pointer-events-none fixed inset-0 opacity-[0.012]" aria-hidden style={{
        backgroundImage: "linear-gradient(rgba(0,255,136,0.08) 1px,transparent 1px),linear-gradient(90deg,rgba(0,255,136,0.08) 1px,transparent 1px)",
        backgroundSize: "40px 40px",
      }} />
      <div className="pointer-events-none fixed right-0 top-0 h-[600px] w-[500px] rounded-full blur-[160px] opacity-30 transition-colors duration-1000"
        style={{ backgroundColor: color }} aria-hidden />
    </>
  );
}