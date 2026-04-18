import { useDarkMode } from "@/hooks/useDarkMode";
import { Sun, Moon } from "lucide-react";

export default function DarkModeToggle() {
  const { dark, toggle } = useDarkMode();

  return (
    <button
      onClick={toggle}
      className="relative w-10 h-10 rounded-full bg-secondary flex items-center justify-center transition-all duration-300 hover:bg-accent"
      aria-label="Toggle dark mode"
    >
      <Sun
        className={`w-5 h-5 absolute transition-all duration-500 ${dark ? "opacity-0 rotate-180 scale-0" : "opacity-100 rotate-0 scale-100"}`}
        style={{ color: "hsl(var(--primary))" }}
      />
      <Moon
        className={`w-5 h-5 absolute transition-all duration-500 ${dark ? "opacity-100 rotate-0 scale-100" : "opacity-0 -rotate-180 scale-0"}`}
        style={{ color: "hsl(var(--primary-glow))" }}
      />
    </button>
  );
}
