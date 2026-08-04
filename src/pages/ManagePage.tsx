import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useWallet } from "@/lib/wallet/WalletProvider";
import {
  resolveName, setRecords, setPrimaryName,
  renewName, transferName, quoteRenewal, weiToGen,
} from "@/lib/gns/contract";
import { normaliseName } from "@/lib/utils";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ConnectWalletButton } from "@/components/ConnectWalletButton";
import type { GnsName, GnsRecords } from "@/lib/types";

const RECORD_FIELDS = [
  { key: "avatar", icon: "🖼️", placeholder: "https://..." },
  { key: "website", icon: "🌐", placeholder: "https://..." },
  { key: "x", icon: "🐦", placeholder: "@username" },
  { key: "github", icon: "💻", placeholder: "username" },
  { key: "discord", icon: "💬", placeholder: "username#0000" },
  { key: "email", icon: "📧", placeholder: "you@example.com" },
  { key: "contract", icon: "📜", placeholder: "0x..." },
  { key: "agent", icon: "🤖", placeholder: "agent.you.gen" },
  { key: "description", icon: "📝", placeholder: "Short bio..." },
];

export default function ManagePage() {
  const { name: paramName } = useParams<{ name: string }>();
  const fullName = normaliseName(decodeURIComponent(paramName || ""));
  const { address } = useWallet();

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<GnsName | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [records, setRecordsState] = useState<GnsRecords>({});
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const [renewYears, setRenewYears] = useState(1);
  const [renewQuote, setRenewQuote] = useState<bigint | null>(null);
  const [renewing, setRenewing] = useState(false);
  const [renewMsg, setRenewMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const [newOwner, setNewOwner] = useState("");
  const [transferring, setTransferring] = useState(false);
  const [transferMsg, setTransferMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const [settingPrimary, setSettingPrimary] = useState(false);
  const [primaryMsg, setPrimaryMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const n = await resolveName(fullName);
      setData(n);
      if (n) setRecordsState(n.records || {});
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [fullName]);

  useEffect(() => {
    quoteRenewal(renewYears).then(setRenewQuote).catch(() => setRenewQuote(null));
  }, [renewYears]);

  const isOwner = Boolean(address && data && data.owner.toLowerCase() === address.toLowerCase());

  const onSaveRecords = async () => {
    setSaving(true);
    setSaveMsg(null);
    try {
      const res = await setRecords(fullName, records);
      setSaveMsg({ ok: res.success, text: res.success ? "Records saved!" : res.message });
    } catch (e) {
      setSaveMsg({ ok: false, text: e instanceof Error ? e.message : "Failed." });
    } finally {
      setSaving(false);
    }
  };

  const onRenew = async () => {
    setRenewing(true);
    setRenewMsg(null);
    try {
      const res = await renewName(fullName, renewYears);
      setRenewMsg({ ok: res.success, text: res.success ? "Renewed successfully!" : res.message });
      if (res.success) load();
    } catch (e) {
      setRenewMsg({ ok: false, text: e instanceof Error ? e.message : "Renewal failed." });
    } finally {
      setRenewing(false);
    }
  };

  const onTransfer = async () => {
    setTransferring(true);
    setTransferMsg(null);
    try {
      const res = await transferName(fullName, newOwner);
      setTransferMsg({ ok: res.success, text: res.success ? "Transferred!" : res.message });
      if (res.success) load();
    } catch (e) {
      setTransferMsg({ ok: false, text: e instanceof Error ? e.message : "Transfer failed." });
    } finally {
      setTransferring(false);
    }
  };

  const onSetPrimary = async () => {
    setSettingPrimary(true);
    setPrimaryMsg(null);
    try {
      const res = await setPrimaryName(fullName);
      setPrimaryMsg({ ok: res.success, text: res.success ? "Set as primary!" : res.message });
    } catch (e) {
      setPrimaryMsg({ ok: false, text: e instanceof Error ? e.message : "Failed." });
    } finally {
      setSettingPrimary(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="w-16 h-16 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
        <p className="mt-4 text-sm text-muted">Loading...</p>
      </div>
    );
  }

  if (error) return <Card padding="lg"><p className="text-error">{error}</p></Card>;
  if (!data) return <Card padding="lg"><p className="text-muted">{fullName} not found.</p></Card>;

  if (!address) {
    return (
      <div className="mx-auto max-w-md">
        <Card padding="lg" className="text-center">
          <span className="text-4xl">🔐</span>
          <p className="mt-3 text-muted">Connect a wallet to manage this name.</p>
          <div className="mt-4 flex justify-center"><ConnectWalletButton /></div>
        </Card>
      </div>
    );
  }

  if (!isOwner) {
    return (
      <div className="mx-auto max-w-md">
        <Card padding="lg">
          <Badge tone="warning">⚠️ Not Owner</Badge>
          <p className="mt-3 text-ink dark:text-white">You don't own {fullName}.</p>
          <Link to={`/name/${encodeURIComponent(fullName)}`} className="mt-2 inline-block text-sm text-primary hover:underline">
            View profile →
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 animate-fade-in">
      {/* Header */}
      <div className="text-center">
        <Badge tone="primary" icon={<span>⚙️</span>}>Manage</Badge>
        <h1 className="mt-4 text-3xl font-bold gradient-text">{fullName}</h1>
      </div>

      {/* Records */}
      <Card>
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-xl">📝</div>
          <div>
            <h2 className="text-lg font-bold text-ink dark:text-white">Profile Records</h2>
            <p className="text-xs text-muted">Update your public profile</p>
          </div>
        </div>
        <div className="space-y-4">
          {RECORD_FIELDS.map((f) => (
            <Input
              key={f.key}
              label={f.key.charAt(0).toUpperCase() + f.key.slice(1)}
              value={(records as Record<string, string>)[f.key] || ""}
              onChange={(e) => setRecordsState((r) => ({ ...r, [f.key]: e.target.value }))}
              placeholder={f.placeholder}
              icon={<span>{f.icon}</span>}
            />
          ))}
          <Button onClick={onSaveRecords} loading={saving} variant="gradient" className="w-full">
            💾 Save Records
          </Button>
          {saveMsg && (
            <p className={`text-sm ${saveMsg.ok ? "text-success" : "text-error"}`}>{saveMsg.text}</p>
          )}
        </div>
      </Card>

      {/* Renew */}
      <Card>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-success/10 flex items-center justify-center text-xl">⏰</div>
          <div>
            <h2 className="text-lg font-bold text-ink dark:text-white">Renew</h2>
            <p className="text-xs text-muted">
              Cost: {renewQuote !== null ? `${weiToGen(renewQuote)} GEN` : "Loading..."}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={renewYears}
            onChange={(e) => setRenewYears(Number(e.target.value))}
            className="h-12 flex-1 rounded-xl border border-border/60 bg-white/80 px-4 text-sm text-ink dark:bg-white/5 dark:border-white/10 dark:text-white"
          >
            {[1, 2, 3, 5].map((y) => <option key={y} value={y}>{y} year{y > 1 ? "s" : ""}</option>)}
          </select>
          <Button onClick={onRenew} loading={renewing} variant="success">Renew</Button>
        </div>
        {renewMsg && <p className={`mt-2 text-sm ${renewMsg.ok ? "text-success" : "text-error"}`}>{renewMsg.text}</p>}
      </Card>

      {/* Transfer */}
      <Card>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-error/10 flex items-center justify-center text-xl">🔄</div>
          <div>
            <h2 className="text-lg font-bold text-ink dark:text-white">Transfer</h2>
            <p className="text-xs text-muted">Send ownership to another address</p>
          </div>
        </div>
        <div className="space-y-3">
          <Input value={newOwner} onChange={(e) => setNewOwner(e.target.value)} placeholder="0x..." icon={<span>📍</span>} />
          <Button variant="danger" onClick={onTransfer} loading={transferring} className="w-full">
            ⚠️ Transfer Ownership
          </Button>
        </div>
        {transferMsg && <p className={`mt-2 text-sm ${transferMsg.ok ? "text-success" : "text-error"}`}>{transferMsg.text}</p>}
      </Card>

      {/* Set Primary */}
      <Card>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center text-xl">🎯</div>
          <div>
            <h2 className="text-lg font-bold text-ink dark:text-white">Set as Primary</h2>
            <p className="text-xs text-muted">Reverse-resolve your wallet to this name</p>
          </div>
        </div>
        <Button variant="secondary" onClick={onSetPrimary} loading={settingPrimary} className="w-full">
          Set Primary Name
        </Button>
        {primaryMsg && <p className={`mt-2 text-sm ${primaryMsg.ok ? "text-success" : "text-error"}`}>{primaryMsg.text}</p>}
      </Card>
    </div>
  );
}
