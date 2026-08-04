import { useEffect, useRef, useState } from "react";
import { useWallet, EXPECTED_CHAIN_ID } from "@/lib/wallet/WalletProvider";
import { truncateAddress } from "@/lib/utils";
import { Button } from "./ui/Button";

const EXPLORER = "https://explorer-studio.genlayer.com";

export function ConnectWalletButton({ compact = false }: { compact?: boolean }) {
  const { address, chainId, connect, disconnect, connecting, switchToGenLayer } = useWallet();
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  if (!address) {
    return (
      <Button 
        onClick={connect} 
        loading={connecting} 
        size={compact ? "sm" : "md"}
        variant="gradient"
        icon={
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h14a2 2 0 012 2v14a2 2 0 01-2 2z"/>
            <path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37z"/>
          </svg>
        }
      >
        Connect
      </Button>
    );
  }

  const wrongNetwork = chainId !== null && chainId !== EXPECTED_CHAIN_ID;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch { /* noop */ }
  };

  return (
    <div ref={rootRef} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className={`inline-flex items-center gap-2.5 rounded-xl border px-4 py-2.5 text-sm font-medium transition-all duration-200 hover:scale-[1.02] ${
          wrongNetwork
            ? "border-error/50 bg-error/10 text-error"
            : "border-border/60 bg-white/80 text-ink hover:border-primary/40 hover:bg-primary/5 dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:bg-white/10"
        }`}
      >
        <span className={`h-2.5 w-2.5 rounded-full ${wrongNetwork ? "bg-error animate-pulse" : "bg-success"}`} />
        {wrongNetwork ? (
          <span>Wrong Network</span>
        ) : (
          <span className="font-mono">{truncateAddress(address)}</span>
        )}
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" className={`text-muted transition-transform duration-200 ${open ? "rotate-180" : ""}`}>
          <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-80 rounded-2xl border border-border/60 bg-white/95 p-2 shadow-2xl backdrop-blur-xl dark:border-white/10 dark:bg-ink/95 animate-fade-in">
          <div className="px-4 pt-3 pb-2">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium uppercase tracking-wider text-muted">Connected Wallet</p>
              <span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                wrongNetwork ? "bg-error/10 text-error" : "bg-success/10 text-success"
              }`}>
                <span className={`h-1.5 w-1.5 rounded-full ${wrongNetwork ? "bg-error" : "bg-success"}`} />
                {wrongNetwork ? "Wrong Chain" : "Connected"}
              </span>
            </div>
            <p className="mt-2 break-all font-mono text-sm text-ink dark:text-white">{address}</p>
            <p className="mt-2 text-xs text-muted">
              {wrongNetwork
                ? `Chain ${chainId} — Expected ${EXPECTED_CHAIN_ID}`
                : `GenLayer Studionet · Chain ${chainId}`}
            </p>
          </div>
          
          <div className="my-2 h-px bg-border/60 dark:bg-white/10" />
          
          <div className="space-y-1">
            {wrongNetwork && (
              <MenuItem 
                onClick={() => { setOpen(false); switchToGenLayer(); }}
                icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M23 4v6h-6M1 20v-6h6"/><path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/></svg>}
              >
                Switch to Studionet
              </MenuItem>
            )}
            <MenuItem 
              onClick={copy}
              icon={copied 
                ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>
                : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>
              }
            >
              {copied ? "Copied!" : "Copy Address"}
            </MenuItem>
            <MenuItem
              onClick={() => {
                window.open(`${EXPLORER}/address/${address}`, "_blank", "noreferrer");
                setOpen(false);
              }}
              icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>}
            >
              View on Explorer
            </MenuItem>
            
            <div className="my-2 h-px bg-border/60 dark:bg-white/10" />
            
            <MenuItem
              destructive
              onClick={() => { disconnect(); setOpen(false); }}
              icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>}
            >
              Disconnect
            </MenuItem>
          </div>
        </div>
      )}
    </div>
  );
}

function MenuItem({
  children,
  onClick,
  destructive,
  icon,
}: {
  children: React.ReactNode;
  onClick: () => void;
  destructive?: boolean;
  icon?: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-left text-sm font-medium transition-all ${
        destructive 
          ? "text-error hover:bg-error/10" 
          : "text-ink hover:bg-section dark:text-white dark:hover:bg-white/5"
      }`}
    >
      {icon && <span className="flex-shrink-0 opacity-60">{icon}</span>}
      {children}
    </button>
  );
}
