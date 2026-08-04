import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { stripGenSuffix } from "@/lib/utils";

export function NameSearchBar({ size = "lg" }: { size?: "lg" | "sm" }) {
  const [value, setValue] = useState("");
  const [focused, setFocused] = useState(false);
  const navigate = useNavigate();

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = stripGenSuffix(value).trim();
    if (!q) return;
    navigate(`/search?name=${encodeURIComponent(q)}`);
  };

  return (
    <form 
      onSubmit={onSubmit} 
      className={`relative flex items-center overflow-hidden rounded-2xl border bg-white/90 shadow-lg transition-all duration-300 dark:bg-white/5 ${
        focused 
          ? "border-primary/50 shadow-xl shadow-primary/10 scale-[1.01]" 
          : "border-border/60 dark:border-white/10"
      } ${size === "lg" ? "gradient-border" : ""}`}
    >
      {/* Search Icon */}
      <div className={`pl-5 text-muted transition-colors ${focused ? "text-primary" : ""}`}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <circle cx="11" cy="11" r="8"/>
          <path d="M21 21l-4.35-4.35"/>
        </svg>
      </div>
      
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value.toLowerCase())}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder="Search for your .gen name"
        className={`flex-1 bg-transparent px-4 text-ink placeholder:text-muted/60 focus:outline-none dark:text-white dark:placeholder:text-white/40 ${
          size === "lg" ? "h-16 text-lg" : "h-12 text-sm"
        }`}
      />
      
      <div className={`flex items-center gap-2 pr-2 ${size === "lg" ? "pr-3" : ""}`}>
        <span className={`rounded-lg bg-section px-3 py-1.5 font-mono text-muted dark:bg-white/10 dark:text-white/60 ${
          size === "lg" ? "text-sm" : "text-xs"
        }`}>
          .gen
        </span>
        <button
          type="submit"
          className={`rounded-xl bg-gradient-to-r from-primary to-primaryDark font-semibold text-white shadow-lg shadow-primary/25 transition-all hover:shadow-xl hover:shadow-primary/30 hover:scale-[1.02] ${
            size === "lg" ? "px-8 py-3.5 text-base" : "px-5 py-2.5 text-sm"
          }`}
        >
          Search
        </button>
      </div>
    </form>
  );
}
