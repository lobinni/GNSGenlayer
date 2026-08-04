import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useWallet } from "@/lib/wallet/WalletProvider";
import { getNamesByOwner, resolveName } from "@/lib/gns/contract";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/Badge";
import { Button } from "@/components/ui/Button";
import { ConnectWalletButton } from "@/components/ConnectWalletButton";
import { DashboardNameCard } from "@/components/DashboardNameCard";
import type { GnsName } from "@/lib/types";

export default function DashboardPage() {
  const { address } = useWallet();
  const [names, setNames] = useState<GnsName[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!address) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    (async () => {
      try {
        const list = await getNamesByOwner(address);
        const resolved = await Promise.all(list.map((n) => resolveName(n).catch(() => null)));
        if (!cancelled) setNames(resolved.filter((n): n is GnsName => Boolean(n)));
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : String(e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [address]);

  if (!address) {
    return (
      <div className="mx-auto max-w-md animate-fade-in">
        <Card padding="lg" variant="gradient" className="text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-primary/10 mb-6">
            <span className="text-4xl">🔐</span>
          </div>
          <h2 className="text-2xl font-bold text-ink dark:text-white">Connect Your Wallet</h2>
          <p className="mt-3 text-muted">Connect your wallet to view and manage your .gen names</p>
          <div className="mt-6 flex justify-center">
            <ConnectWalletButton />
          </div>
        </Card>
      </div>
    );
  }

  const roots = names.filter((n) => !n.is_subname);
  const subs = names.filter((n) => n.is_subname);

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <Badge tone="primary" icon={<span>📊</span>}>Dashboard</Badge>
          <h1 className="mt-3 text-3xl font-bold text-ink dark:text-white">Your Names</h1>
          <p className="mt-1 text-muted">Manage all .gen names owned by your wallet</p>
        </div>
        <Link to="/search">
          <Button variant="gradient" icon={<span>➕</span>}>
            Register New
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="text-center">
          <p className="text-3xl font-bold gradient-text">{names.length}</p>
          <p className="text-sm text-muted mt-1">Total Names</p>
        </Card>
        <Card className="text-center">
          <p className="text-3xl font-bold text-ink dark:text-white">{roots.length}</p>
          <p className="text-sm text-muted mt-1">Root Names</p>
        </Card>
        <Card className="text-center">
          <p className="text-3xl font-bold text-ink dark:text-white">{subs.length}</p>
          <p className="text-sm text-muted mt-1">Subnames</p>
        </Card>
        <Card className="text-center">
          <p className="text-3xl font-bold text-success">{names.filter(n => n.status === "active").length}</p>
          <p className="text-sm text-muted mt-1">Active</p>
        </Card>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-16">
          <div className="w-16 h-16 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
          <p className="mt-4 text-sm text-muted">Loading your names...</p>
        </div>
      )}

      {/* Error */}
      {error && (
        <Card padding="lg" className="border-error/30">
          <div className="flex items-start gap-3">
            <span className="text-xl">⚠️</span>
            <div>
              <p className="font-semibold text-error">Error loading names</p>
              <p className="text-sm text-muted mt-1">{error}</p>
            </div>
          </div>
        </Card>
      )}

      {/* Empty State */}
      {!loading && !error && names.length === 0 && (
        <Card padding="lg" className="text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-section mb-6 dark:bg-white/5">
            <span className="text-4xl">🌐</span>
          </div>
          <h3 className="text-xl font-bold text-ink dark:text-white">No Names Yet</h3>
          <p className="mt-2 text-muted max-w-sm mx-auto">
            You haven't registered any .gen names yet. Search for an available name to get started!
          </p>
          <div className="mt-6">
            <Link to="/search">
              <Button variant="gradient" size="lg">🔍 Search for a Name</Button>
            </Link>
          </div>
        </Card>
      )}

      {/* Root Names */}
      {roots.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <span className="text-xl">🌐</span>
            <h2 className="text-xl font-bold text-ink dark:text-white">Root Names</h2>
            <Badge tone="secondary">{roots.length}</Badge>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {roots.map((n) => (
              <DashboardNameCard key={n.full_name} name={n} />
            ))}
          </div>
        </div>
      )}

      {/* Subnames */}
      {subs.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <span className="text-xl">📁</span>
            <h2 className="text-xl font-bold text-ink dark:text-white">Subnames</h2>
            <Badge tone="secondary">{subs.length}</Badge>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {subs.map((n) => (
              <DashboardNameCard key={n.full_name} name={n} />
            ))}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      {names.length > 0 && (
        <Card variant="gradient">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-ink dark:text-white">Quick Actions</h3>
              <p className="text-sm text-muted">Manage records or report suspicious names</p>
            </div>
            <div className="flex gap-3">
              <Link to="/disputes">
                <Button variant="secondary" icon={<span>⚠️</span>}>
                  Report Issues
                </Button>
              </Link>
              <Link to="/resolve">
                <Button variant="ghost" icon={<span>🔗</span>}>
                  Resolver
                </Button>
              </Link>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
