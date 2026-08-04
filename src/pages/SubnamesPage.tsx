import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useWallet } from "@/lib/wallet/WalletProvider";
import { resolveName, getSubnames, createSubname } from "@/lib/gns/contract";
import { normaliseName, isValidSubLabel } from "@/lib/utils";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ConnectWalletButton } from "@/components/ConnectWalletButton";
import type { GnsName } from "@/lib/types";

const USE_CASES = [
  { label: "pay", desc: "Payment address", icon: "💳" },
  { label: "agent", desc: "AI agent endpoint", icon: "🤖" },
  { label: "app", desc: "Your dApp", icon: "📱" },
  { label: "team", desc: "Team wallet", icon: "👥" },
];

function CreateSubnameForm({ parent, onCreated }: { parent: string; onCreated: () => void }) {
  const { address } = useWallet();
  const [subLabel, setSubLabel] = useState("");
  const [primaryAddr, setPrimaryAddr] = useState("");
  const [creating, setCreating] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    if (address && !primaryAddr) setPrimaryAddr(address);
  }, [address, primaryAddr]);

  const onCreate = async () => {
    if (!isValidSubLabel(subLabel)) {
      setMsg({ ok: false, text: "Invalid sublabel." });
      return;
    }
    setCreating(true);
    setMsg(null);
    try {
      const res = await createSubname(parent, subLabel, primaryAddr || address || "");
      setMsg({ ok: res.success, text: res.success ? "Subname created!" : res.message });
      if (res.success) {
        setSubLabel("");
        onCreated();
      }
    } catch (e) {
      setMsg({ ok: false, text: e instanceof Error ? e.message : "Creation failed." });
    } finally {
      setCreating(false);
    }
  };

  return (
    <Card variant="gradient">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-xl">➕</div>
        <div>
          <h2 className="text-lg font-bold text-ink dark:text-white">Create Subname</h2>
          <p className="text-xs text-muted">Subnames share the parent's expiry</p>
        </div>
      </div>
      
      <div className="space-y-4">
        <div>
          <label className="mb-2 block text-sm font-medium text-ink dark:text-white">Subname</label>
          <div className="flex items-center gap-2">
            <Input
              value={subLabel}
              onChange={(e) => setSubLabel(e.target.value.toLowerCase())}
              placeholder="pay"
              className="flex-1"
            />
            <span className="text-sm font-mono text-muted bg-section dark:bg-white/10 px-3 py-2 rounded-lg">.{parent}</span>
          </div>
        </div>
        
        <Input
          label="Primary Address"
          value={primaryAddr}
          onChange={(e) => setPrimaryAddr(e.target.value)}
          placeholder="0x..."
          icon={<span>📍</span>}
        />
        
        <Button onClick={onCreate} loading={creating} variant="gradient" className="w-full" icon={<span>✨</span>}>
          Create {subLabel ? `${subLabel}.${parent}` : "Subname"}
        </Button>
        
        {msg && (
          <p className={`text-sm ${msg.ok ? "text-success" : "text-error"}`}>{msg.text}</p>
        )}
      </div>
    </Card>
  );
}

export default function SubnamesPage() {
  const { name: paramName } = useParams<{ name: string }>();
  const parent = normaliseName(decodeURIComponent(paramName || ""));
  const { address } = useWallet();

  const [data, setData] = useState<GnsName | null>(null);
  const [subs, setSubs] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const [n, s] = await Promise.all([resolveName(parent), getSubnames(parent)]);
      setData(n);
      setSubs(s);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [parent]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="w-16 h-16 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
        <p className="mt-4 text-sm text-muted">Loading...</p>
      </div>
    );
  }

  if (error) return <Card padding="lg"><p className="text-error">{error}</p></Card>;
  if (!data) return <Card padding="lg"><p className="text-muted">{parent} not found.</p></Card>;

  const isOwner = Boolean(address && data.owner.toLowerCase() === address.toLowerCase());

  return (
    <div className="mx-auto max-w-2xl space-y-6 animate-fade-in">
      {/* Header */}
      <div className="text-center">
        <Badge tone="primary" icon={<span>📁</span>}>Subnames</Badge>
        <h1 className="mt-4 text-3xl font-bold text-ink dark:text-white">
          Subnames of <span className="gradient-text">{parent}</span>
        </h1>
        <p className="mt-2 text-muted">Create and manage subnames for your .gen name</p>
      </div>

      {/* Create Form or Connect Prompt */}
      {isOwner ? (
        <CreateSubnameForm parent={parent} onCreated={() => load()} />
      ) : (
        <Card padding="lg" className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-warning/10 mb-4">
            <span className="text-3xl">🔐</span>
          </div>
          <h3 className="font-bold text-ink dark:text-white">Owner Access Required</h3>
          <p className="mt-2 text-sm text-muted">Connect the parent owner wallet to create subnames.</p>
          <div className="mt-4 flex justify-center"><ConnectWalletButton /></div>
        </Card>
      )}

      {/* Existing Subnames */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-section flex items-center justify-center text-xl dark:bg-white/5">📋</div>
            <div>
              <h2 className="text-lg font-bold text-ink dark:text-white">Existing Subnames</h2>
              <p className="text-xs text-muted">{subs.length} subname{subs.length !== 1 ? "s" : ""}</p>
            </div>
          </div>
        </div>
        
        {subs.length === 0 ? (
          <div className="text-center py-8">
            <span className="text-4xl">📭</span>
            <p className="mt-3 text-muted">No subnames created yet</p>
          </div>
        ) : (
          <div className="space-y-2">
            {subs.map((s) => (
              <Link 
                key={s} 
                to={`/name/${encodeURIComponent(s)}`} 
                className="flex items-center justify-between p-4 rounded-xl bg-section hover:bg-primary/5 transition-all dark:bg-white/5 dark:hover:bg-white/10 group"
              >
                <span className="font-mono font-semibold text-primary">{s}</span>
                <span className="text-sm text-muted group-hover:text-primary transition-colors">View →</span>
              </Link>
            ))}
          </div>
        )}
      </Card>

      {/* Use Cases */}
      <Card>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center text-xl">💡</div>
          <div>
            <h2 className="text-lg font-bold text-ink dark:text-white">Common Use Cases</h2>
            <p className="text-xs text-muted">Ideas for your subnames</p>
          </div>
        </div>
        
        <div className="grid gap-3 sm:grid-cols-2">
          {USE_CASES.map((u) => (
            <div key={u.label} className="flex items-center gap-3 p-4 rounded-xl bg-section dark:bg-white/5">
              <div className="w-10 h-10 rounded-lg bg-white dark:bg-white/10 flex items-center justify-center text-lg shadow-sm">
                {u.icon}
              </div>
              <div>
                <p className="font-mono text-sm font-semibold text-primary">{u.label}.{parent}</p>
                <p className="text-xs text-muted">{u.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
