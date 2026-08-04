import { Link } from "react-router-dom";

export function Footer() {
  return (
    <footer className="mt-20 border-t border-border/40 dark:border-white/5">
      <div className="mx-auto max-w-6xl px-4 py-12">
        <div className="grid gap-8 md:grid-cols-4">
          {/* Brand */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary via-purple-500 to-accent flex items-center justify-center shadow-lg shadow-primary/20">
                <span className="text-white font-bold text-lg">G</span>
              </div>
              <div>
                <span className="text-lg font-bold gradient-text">GNS</span>
                <p className="text-[10px] text-muted -mt-0.5">GenLayer Naming Service</p>
              </div>
            </div>
            <p className="text-sm text-muted max-w-sm leading-relaxed">
              Readable names for the intelligent contract economy. Register .gen names for wallets, contracts, AI agents, and apps on GenLayer.
            </p>
          </div>

          {/* Links */}
          <div>
            <h4 className="font-semibold text-ink dark:text-white mb-4">Protocol</h4>
            <div className="space-y-3">
              <Link to="/search" className="block text-sm text-muted hover:text-primary transition-colors">Search Names</Link>
              <Link to="/resolve" className="block text-sm text-muted hover:text-primary transition-colors">Resolver</Link>
              <Link to="/dashboard" className="block text-sm text-muted hover:text-primary transition-colors">Dashboard</Link>
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-ink dark:text-white mb-4">Resources</h4>
            <div className="space-y-3">
              <Link to="/about" className="block text-sm text-muted hover:text-primary transition-colors">Documentation</Link>
              <Link to="/disputes" className="block text-sm text-muted hover:text-primary transition-colors">Report Issues</Link>
              <a href="https://explorer-studio.genlayer.com/" target="_blank" rel="noreferrer" className="block text-sm text-muted hover:text-primary transition-colors">
                Explorer ↗
              </a>
            </div>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-border/40 dark:border-white/5 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-muted">
            © 2024 GNS Protocol. Built on GenLayer Studionet.
          </p>
          <div className="flex items-center gap-4">
            <span className="inline-flex items-center gap-1.5 text-xs text-muted">
              <span className="h-2 w-2 rounded-full bg-success animate-pulse" />
              Network: Studionet
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
