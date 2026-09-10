export default function GrainOverlay() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-[45] opacity-[0.05]"
      style={{
        backgroundImage: "url(/grain.svg)",
        backgroundSize: "200px 200px",
        mixBlendMode: "overlay",
      }}
    />
  );
}
