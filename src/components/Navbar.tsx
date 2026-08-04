import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { ConnectWalletButton } from "./ConnectWalletButton";
import { ThemeToggle } from "./ThemeToggle";

const NAV = [
  { href: "/search", label: "Search", icon: "🔍" },
  { href: "/resolve", label: "Resolve", icon: "🔗" },
  { href: "/dashboard", label: "Dashboard", icon: "📊" },
  { href: "/disputes", label: "Disputes", icon: "⚠️" },
  { href: "/about", label: "Docs", icon: "📚" },
];

export function Navbar() {
  const [open, setOpen] = useState(false);
  const location = useLocation();

  return (
    <nav className="sticky top-0 z-50 border-b border-white/10 glass">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        {/* Logo */}
        <Link 
          to="/" 
          className="flex items-center gap-3 group" 
          onClick={() => setOpen(false)}
        >
          <div className="relative">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary via-purple-500 to-accent flex items-center justify-center shadow-lg shadow-primary/25 group-hover:shadow-xl group-hover:shadow-primary/30 transition-all duration-300">
              <span className="text-white font-bold text-lg">G</span>
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-success rounded-full border-2 border-white dark:border-ink animate-pulse" />
          </div>
          <div className="hidden sm:block">
            <span className="text-lg font-bold gradient-text">GNS</span>
            <p className="text-[10px] text-muted -mt-0.5">GenLayer Naming Service</p>
          </div>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden items-center gap-1 md:flex">
          {NAV.map((n) => {
            const isActive = location.pathname === n.href || location.pathname.startsWith(n.href + "/");
            return (
              <Link 
                key={n.href} 
                to={n.href} 
                className={`relative rounded-xl px-4 py-2.5 text-sm font-medium transition-all duration-200 ${
                  isActive 
                    ? "text-primary bg-primary/10 dark:text-primaryLight" 
                    : "text-ink/70 hover:text-ink hover:bg-section dark:text-white/70 dark:hover:text-white dark:hover:bg-white/5"
                }`}
              >
                <span className="flex items-center gap-2">
                  <span className="text-xs">{n.icon}</span>
                  {n.label}
                </span>
                {isActive && (
                  <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-gradient-to-r from-primary to-accent rounded-full" />
                )}
              </Link>
            );
          })}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <ConnectWalletButton compact />
          
          {/* Mobile menu button */}
          <button
            onClick={() => setOpen((v) => !v)}
            aria-label="Toggle menu"
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-border/60 bg-white/80 text-ink hover:bg-section md:hidden dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:bg-white/10 transition-all"
          >
            {open ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12" /></svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M3 12h18M3 6h18M3 18h18" /></svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="border-t border-border/60 px-4 pb-4 md:hidden dark:border-white/10 animate-fade-in">
          <div className="py-2 space-y-1">
            {NAV.map((n) => {
              const isActive = location.pathname === n.href;
              return (
                <Link 
                  key={n.href} 
                  to={n.href} 
                  onClick={() => setOpen(false)} 
                  className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all ${
                    isActive 
                      ? "bg-primary/10 text-primary dark:text-primaryLight" 
                      : "text-ink hover:bg-section dark:text-white/90 dark:hover:bg-white/5"
                  }`}
                >
                  <span>{n.icon}</span>
                  {n.label}
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </nav>
  );
}
