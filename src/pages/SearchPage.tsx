import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { useWallet } from "@/lib/wallet/WalletProvider";
import { searchName, aiSuggestNames } from "@/lib/gns/contract";
import { stripGenSuffix, generateNameSuggestions } from "@/lib/utils";
import { NameSearchBar } from "@/components/NameSearchBar";
import { NameStatusCard } from "@/components/NameStatusCard";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/Badge";
import type { SearchResult, AiSuggestion } from "@/lib/types";

function LoadingSpinner() {
  return (
    <div className="flex flex-col items-center justify-center py-16">
      <div className="relative">
        <div className="w-16 h-16 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xl">🔍</span>
        </div>
      </div>
      <p className="mt-4 text-sm text-muted">Searching...</p>
    </div>
  );
}

function SearchInner() {
  const [params] = useSearchParams();
  const raw = params.get("name") || "";
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<SearchResult | null>(null);
  const [aiSuggestions, setAiSuggestions] = useState<AiSuggestion[]>([]);
  const [aiBusy, setAiBusy] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const { address, connect } = useWallet();

  useEffect(() => {
    if (!raw) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    searchName(raw)
      .then((r) => { if (!cancelled) setResult(r); })
      .catch((e) => { if (!cancelled) setError(e instanceof Error ? e.message : String(e)); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [raw]);

  const runAiSuggest = async () => {
    if (!address) { await connect(); return; }
    setAiBusy(true);
    setAiError(null);
    try {
      const suggestions = await aiSuggestNames(stripGenSuffix(raw), "Find safe, brandable .gen alternatives for this label.");
      setAiSuggestions(suggestions);
    } catch (e) {
      setAiError(e instanceof Error ? e.message : "AI suggestion failed.");
    } finally {
      setAiBusy(false);
    }
  };

  const localSuggestions = raw ? generateNameSuggestions(raw) : [];

  return (
    <div className="mx-auto max-w-2xl space-y-8 animate-fade-in">
      {/* Header */}
      <div className="text-center">
        <Badge tone="primary" icon={<span>🔍</span>}>Search</Badge>
        <h1 className="mt-4 text-3xl font-bold text-ink dark:text-white">Find Your .gen Name</h1>
        <p className="mt-2 text-muted">Search for available names on GenLayer</p>
      </div>

      {/* Search Bar */}
      <NameSearchBar size="sm" />

      {/* Empty State */}
      {!raw && (
        <Card padding="lg" className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-section mb-4">
            <span className="text-3xl">🔎</span>
          </div>
          <p className="text-muted">Enter a name above to check availability</p>
        </Card>
      )}

      {/* Loading */}
      {loading && <LoadingSpinner />}

      {/* Error */}
      {error && (
        <Card padding="lg" className="border-error/30">
          <div className="flex items-start gap-3">
            <span className="text-xl">⚠️</span>
            <div>
              <p className="font-semibold text-error">Search Error</p>
              <p className="text-sm text-muted mt-1">{error}</p>
            </div>
          </div>
        </Card>
      )}

      {/* Result */}
      {!loading && result && (
        <NameStatusCard fullName={result.fullName} available={result.available} name={result.name} />
      )}

      {/* Suggestions */}
      {!loading && result && !result.available && localSuggestions.length > 0 && (
        <Card>
          <div className="flex items-center gap-2 mb-4">
            <span className="text-xl">💡</span>
            <h3 className="text-lg font-bold text-ink dark:text-white">Try these instead</h3>
          </div>
          
          <div className="flex flex-wrap gap-2">
            {localSuggestions.map((s) => (
              <Link 
                key={s} 
                to={`/search?name=${encodeURIComponent(s.replace(".gen", ""))}`} 
                className="rounded-xl border border-border/60 bg-white/80 px-4 py-2 text-sm font-medium text-primary hover:bg-primary/5 hover:border-primary/30 transition-all dark:bg-white/5 dark:border-white/10 dark:hover:bg-white/10"
              >
                {s}
              </Link>
            ))}
          </div>
          
          <div className="mt-6 pt-4 border-t border-border/40 dark:border-white/10">
            <Button 
              size="sm" 
              variant="secondary" 
              onClick={runAiSuggest} 
              loading={aiBusy}
              icon={<span>🤖</span>}
            >
              Ask AI for suggestions
            </Button>
            {aiError && <p className="mt-2 text-xs text-error">{aiError}</p>}
          </div>
          
          {aiSuggestions.length > 0 && (
            <div className="mt-4 space-y-2">
              <Badge tone="gradient" icon={<span>✨</span>}>AI Suggestions</Badge>
              <div className="mt-3 space-y-2">
                {aiSuggestions.map((s, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-section dark:bg-white/5">
                    <Link 
                      to={`/search?name=${encodeURIComponent(s.name.replace(".gen", ""))}`} 
                      className="font-mono text-sm font-semibold text-primary hover:underline"
                    >
                      {s.name}
                    </Link>
                    <span className="text-xs text-muted">{s.reason}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}

export default function SearchPage() {
  return <SearchInner />;
}
