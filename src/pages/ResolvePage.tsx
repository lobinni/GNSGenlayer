import { useState } from "react";
import { Link } from "react-router-dom";
import { resolveName, reverseLookup } from "@/lib/gns/contract";
import { normaliseName } from "@/lib/utils";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { AddressText } from "@/components/AddressText";
import type { GnsName } from "@/lib/types";

export default function ResolvePage() {
  const [mode, setMode] = useState<"forward" | "reverse">("forward");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nameResult, setNameResult] = useState<GnsName | null>(null);
  const [reverseResult, setReverseResult] = useState<string | null>(null);

  const onResolve = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setError(null);
    setNameResult(null);
    setReverseResult(null);
    try {
      if (mode === "forward") {
        const n = await resolveName(normaliseName(query));
        setNameResult(n);
        if (!n) setError("Name not found.");
      } else {
        const name = await reverseLookup(query.trim());
        setReverseResult(name || null);
        if (!name) setError("No primary name set for this address.");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Resolve failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-xl space-y-6 animate-fade-in">
      {/* Header */}
      <div className="text-center">
        <Badge tone="primary" icon={<span>🔗</span>}>Resolver</Badge>
        <h1 className="mt-4 text-3xl font-bold text-ink dark:text-white">Name Resolution</h1>
        <p className="mt-2 text-muted">Look up a .gen name or wallet address</p>
      </div>

      {/* Mode Toggle */}
      <Card>
        <div className="flex gap-2 p-1 bg-section rounded-xl dark:bg-white/5 mb-6">
          <button
            onClick={() => setMode("forward")}
            className={`flex-1 flex items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-semibold transition-all ${
              mode === "forward"
                ? "bg-white text-primary shadow-sm dark:bg-white/10"
                : "text-muted hover:text-ink dark:hover:text-white"
            }`}
          >
            <span>📛</span> Name → Address
          </button>
          <button
            onClick={() => setMode("reverse")}
            className={`flex-1 flex items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-semibold transition-all ${
              mode === "reverse"
                ? "bg-white text-primary shadow-sm dark:bg-white/10"
                : "text-muted hover:text-ink dark:hover:text-white"
            }`}
          >
            <span>🔄</span> Address → Name
          </button>
        </div>

        <div className="space-y-4">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={mode === "forward" ? "Enter name (e.g. papito.gen)" : "Enter address (0x...)"}
            onKeyDown={(e) => e.key === "Enter" && onResolve()}
            icon={mode === "forward" ? <span>🌐</span> : <span>📍</span>}
          />
          <Button 
            onClick={onResolve} 
            loading={loading} 
            variant="gradient" 
            className="w-full"
            icon={<span>🔍</span>}
          >
            Resolve
          </Button>
        </div>
      </Card>

      {/* Error */}
      {error && (
        <Card padding="lg" className="border-warning/30 bg-warning/5">
          <div className="flex items-center gap-3">
            <span className="text-xl">⚠️</span>
            <p className="text-sm text-warning font-medium">{error}</p>
          </div>
        </Card>
      )}

      {/* Forward Result */}
      {nameResult && (
        <Card padding="lg" variant="gradient">
          <div className="flex items-center gap-2 mb-4">
            <Badge tone="green" dot>Found</Badge>
          </div>
          
          <h2 className="text-2xl font-bold text-ink dark:text-white">{nameResult.full_name}</h2>
          
          <dl className="mt-6 space-y-3">
            <div className="flex items-center justify-between py-3 border-b border-border/40 dark:border-white/10">
              <dt className="text-sm text-muted flex items-center gap-2">
                <span>👤</span> Owner
              </dt>
              <dd><AddressText value={nameResult.owner} /></dd>
            </div>
            <div className="flex items-center justify-between py-3 border-b border-border/40 dark:border-white/10">
              <dt className="text-sm text-muted flex items-center gap-2">
                <span>📍</span> Primary Address
              </dt>
              <dd><AddressText value={nameResult.primary_address} /></dd>
            </div>
            <div className="flex items-center justify-between py-3">
              <dt className="text-sm text-muted flex items-center gap-2">
                <span>📊</span> Status
              </dt>
              <dd>
                <Badge tone={nameResult.status === "flagged" ? "red" : "green"} dot>
                  {nameResult.status}
                </Badge>
              </dd>
            </div>
          </dl>
          
          <div className="mt-6 pt-4 border-t border-border/40 dark:border-white/10">
            <Link to={`/name/${encodeURIComponent(nameResult.full_name)}`}>
              <Button variant="secondary" className="w-full" icon={<span>👁️</span>}>
                View Full Profile
              </Button>
            </Link>
          </div>
        </Card>
      )}

      {/* Reverse Result */}
      {reverseResult && (
        <Card padding="lg" variant="gradient" className="text-center">
          <Badge tone="green" dot className="mb-4">Found</Badge>
          <p className="text-sm text-muted">Primary name for this address:</p>
          <Link 
            to={`/name/${encodeURIComponent(reverseResult)}`} 
            className="mt-2 block text-3xl font-bold gradient-text hover:opacity-80 transition-opacity"
          >
            {reverseResult}
          </Link>
          <div className="mt-6">
            <Link to={`/name/${encodeURIComponent(reverseResult)}`}>
              <Button variant="secondary" icon={<span>👁️</span>}>
                View Profile
              </Button>
            </Link>
          </div>
        </Card>
      )}
    </div>
  );
}
