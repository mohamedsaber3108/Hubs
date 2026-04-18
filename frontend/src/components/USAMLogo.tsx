export default function USAMLogo({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const sizes = {
    sm: { text: "text-xl", cap: "text-[0.45em] -top-2 -right-1" },
    md: { text: "text-3xl", cap: "text-[0.4em] -top-3 -right-1.5" },
    lg: { text: "text-6xl", cap: "text-[0.35em] -top-4 -right-2" },
  };

  const s = sizes[size];

  return (
    <span
      className={`logo-glow-hover inline-flex items-baseline font-black ${s.text} tracking-tighter select-none cursor-pointer`}
      style={{ filter: "drop-shadow(0 0 20px rgba(20,119,110,0.3))" }}
    >
      <span className="relative inline-block">
        U
        <span className={`absolute ${s.cap} pointer-events-none animate-float`} aria-hidden>
          🎓
        </span>
      </span>
      <span>SAM</span>
      <span className="text-muted-foreground font-medium text-[0.45em] ml-1.5 tracking-normal">Hub</span>
    </span>
  );
}
