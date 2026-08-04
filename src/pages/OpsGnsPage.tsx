import { useEffect, useState } from "react";
import { useWallet } from "@/lib/wallet/WalletProvider";
import {
  getAdmin, getTreasury, getContractBalance, getTotalProtocolRevenue,
  getTotalWithdrawn, getTotalNames, getTotalReports, getPricePerYear,
  adminWithdraw, adminSetPricePerYear, adminSetTreasury, adminFlagName,
  adminUnflagName, adminSetReportStatus, weiToGen, genToWei,
} from "@/lib/gns/contract";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ConnectWalletButton } from "@/components/ConnectWalletButton";

export default function OpsGnsPage() {
  const { address } = useWallet();
  const [admin, setAdmin] = useState("");
  const [treasury, setTreasury] = useState("");
  const [balance, setBalance] = useState(0n);
  const [revenue, setRevenue] = useState(0n);
  const [withdrawn, setWithdrawn] = useState(0n);
  const [totalNames, setTotalNames] = useState(0);
  const [totalReports, setTotalReports] = useState(0);
  const [pricePerYear, setPricePerYear] = useState(0n);
  const [loading, setLoading] = useState(true);

  const [withdrawAmt, setWithdrawAmt] = useState("");
  const [newPrice, setNewPrice] = useState("");
  const [newTreasury, setNewTreasury] = useState("");
  const [flagName, setFlagName] = useState("");
  const [flagReason, setFlagReason] = useState("");
  const [unflagName, setUnflagName] = useState("");
  const [reportId, setReportId] = useState("");
  const [reportStatus, setReportStatus] = useState("reviewed");

  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [a, t, b, r, w, n, rep, p] = await Promise.all([
        getAdmin(), getTreasury(), getContractBalance(), getTotalProtocolRevenue(),
        getTotalWithdrawn(), getTotalNames(), getTotalReports(), getPricePerYear(),
      ]);
      setAdmin(a); setTreasury(t); setBalance(b); setRevenue(r);
      setWithdrawn(w); setTotalNames(n); setTotalReports(rep); setPricePerYear(p);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const isAdmin = Boolean(address && admin && address.toLowerCase() === admin.toLowerCase());

  const doAction = async (action: () => Promise<{ success: boolean; message: string }>, successMsg: string) => {
    setBusy(true); setMsg(null);
    try {
      const res = await action();
      setMsg({ ok: res.success, text: res.success ? successMsg : res.message });
      if (res.success) load();
    } catch (e) {
      setMsg({ ok: false, text: e instanceof Error ? e.message : "Failed." });
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="w-16 h-16 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
        <p className="mt-4 text-sm text-muted">Loading admin panel...</p>
      </div>
    );
  }

  if (!address) {
    return (
      <div className="mx-auto max-w-md animate-fade-in">
        <Card padding="lg" variant="gradient" className="text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-primary/10 mb-6">
            <span className="text-4xl">🔐</span>
          </div>
          <Badge tone="primary" icon={<span>⚙️</span>}>Admin Panel</Badge>
          <h1 className="mt-4 text-2xl font-bold text-ink dark:text-white">Protocol Controls</h1>
          <p className="mt-2 text-muted">Connect the admin wallet to access controls</p>
          <div className="mt-6 flex justify-center"><ConnectWalletButton /></div>
        </Card>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="mx-auto max-w-md animate-fade-in">
        <Card padding="lg">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-warning/10 mb-4">
              <span className="text-3xl">⛔</span>
            </div>
            <Badge tone="warning">Access Denied</Badge>
            <h1 className="mt-4 text-xl font-bold text-ink dark:text-white">Not Authorized</h1>
            <p className="mt-2 text-sm text-muted">Your wallet is not the contract admin.</p>
            <p className="mt-4 p-3 rounded-xl bg-section dark:bg-white/5 font-mono text-xs text-muted break-all">
              Admin: {admin}
            </p>
          </div>
        </Card>
      </div>
    );
  }

  const stats = [
    { label: "Contract Balance", value: `${weiToGen(balance)} GEN`, icon: "💰", color: "from-primary/10 to-accent/10" },
    { label: "Total Revenue", value: `${weiToGen(revenue)} GEN`, icon: "📈", color: "from-success/10 to-emerald-500/10" },
    { label: "Withdrawn", value: `${weiToGen(withdrawn)} GEN`, icon: "💸", color: "from-warning/10 to-amber-500/10" },
    { label: "Price/Year", value: `${weiToGen(pricePerYear)} GEN`, icon: "🏷️", color: "from-purple-500/10 to-pink-500/10" },
    { label: "Total Names", value: totalNames.toString(), icon: "🌐", color: "from-blue-500/10 to-cyan-500/10" },
    { label: "Total Reports", value: totalReports.toString(), icon: "⚠️", color: "from-red-500/10 to-orange-500/10" },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="text-center">
        <Badge tone="gradient" icon={<span>⚙️</span>}>Admin Panel</Badge>
        <h1 className="mt-4 text-3xl font-bold text-ink dark:text-white">Protocol Controls</h1>
        <p className="mt-2 text-muted">Manage GNS contract settings and withdrawals</p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map((s) => (
          <Card key={s.label} className={`bg-gradient-to-br ${s.color}`}>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-white/80 dark:bg-white/10 flex items-center justify-center text-2xl shadow-sm">
                {s.icon}
              </div>
              <div>
                <p className="text-xs text-muted uppercase tracking-wider">{s.label}</p>
                <p className="text-xl font-bold text-ink dark:text-white">{s.value}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Info Cards */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="bg-section/50 dark:bg-white/5">
          <p className="text-xs text-muted uppercase tracking-wider">Treasury Address</p>
          <p className="mt-2 font-mono text-sm text-ink dark:text-white break-all">{treasury || "Not set"}</p>
        </Card>
        <Card className="bg-section/50 dark:bg-white/5">
          <p className="text-xs text-muted uppercase tracking-wider">Admin Address</p>
          <p className="mt-2 font-mono text-sm text-ink dark:text-white break-all">{admin}</p>
        </Card>
      </div>

      {/* Status Message */}
      {msg && (
        <Card className={msg.ok ? "bg-success/10 border-success/30" : "bg-error/10 border-error/30"}>
          <p className={`text-sm font-medium ${msg.ok ? "text-success" : "text-error"}`}>
            {msg.ok ? "✓" : "✗"} {msg.text}
          </p>
        </Card>
      )}

      {/* Actions Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Withdraw */}
        <Card>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-success/10 flex items-center justify-center text-xl">💰</div>
            <div>
              <h2 className="text-lg font-bold text-ink dark:text-white">Withdraw</h2>
              <p className="text-xs text-muted">Send GEN to treasury</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Input value={withdrawAmt} onChange={(e) => setWithdrawAmt(e.target.value)} placeholder="Amount in GEN" />
            <Button onClick={() => doAction(() => adminWithdraw(genToWei(withdrawAmt)), "Withdrawn!")} loading={busy} variant="success">
              Withdraw
            </Button>
          </div>
        </Card>

        {/* Set Price */}
        <Card>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-xl">🏷️</div>
            <div>
              <h2 className="text-lg font-bold text-ink dark:text-white">Set Price/Year</h2>
              <p className="text-xs text-muted">Update registration cost</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Input value={newPrice} onChange={(e) => setNewPrice(e.target.value)} placeholder="Price in GEN" />
            <Button onClick={() => doAction(() => adminSetPricePerYear(genToWei(newPrice)), "Price updated!")} loading={busy}>
              Update
            </Button>
          </div>
        </Card>

        {/* Set Treasury */}
        <Card>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center text-xl">🏦</div>
            <div>
              <h2 className="text-lg font-bold text-ink dark:text-white">Set Treasury</h2>
              <p className="text-xs text-muted">Update treasury address</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Input value={newTreasury} onChange={(e) => setNewTreasury(e.target.value)} placeholder="0x..." />
            <Button onClick={() => doAction(() => adminSetTreasury(newTreasury), "Treasury updated!")} loading={busy} variant="secondary">
              Update
            </Button>
          </div>
        </Card>

        {/* Flag Name */}
        <Card>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-error/10 flex items-center justify-center text-xl">🚩</div>
            <div>
              <h2 className="text-lg font-bold text-ink dark:text-white">Flag Name</h2>
              <p className="text-xs text-muted">Mark as suspicious</p>
            </div>
          </div>
          <div className="space-y-3">
            <Input value={flagName} onChange={(e) => setFlagName(e.target.value)} placeholder="name.gen" />
            <Input value={flagReason} onChange={(e) => setFlagReason(e.target.value)} placeholder="Reason" />
            <Button onClick={() => doAction(() => adminFlagName(flagName, flagReason), "Name flagged!")} loading={busy} variant="danger" className="w-full">
              🚩 Flag Name
            </Button>
          </div>
        </Card>

        {/* Unflag Name */}
        <Card>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-success/10 flex items-center justify-center text-xl">✅</div>
            <div>
              <h2 className="text-lg font-bold text-ink dark:text-white">Unflag Name</h2>
              <p className="text-xs text-muted">Remove flag from name</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Input value={unflagName} onChange={(e) => setUnflagName(e.target.value)} placeholder="name.gen" />
            <Button onClick={() => doAction(() => adminUnflagName(unflagName), "Name unflagged!")} loading={busy} variant="success">
              Unflag
            </Button>
          </div>
        </Card>

        {/* Set Report Status */}
        <Card>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-warning/10 flex items-center justify-center text-xl">📋</div>
            <div>
              <h2 className="text-lg font-bold text-ink dark:text-white">Update Report</h2>
              <p className="text-xs text-muted">Change report status</p>
            </div>
          </div>
          <div className="space-y-3">
            <Input value={reportId} onChange={(e) => setReportId(e.target.value)} placeholder="Report ID" />
            <select
              value={reportStatus}
              onChange={(e) => setReportStatus(e.target.value)}
              className="h-12 w-full rounded-xl border border-border/60 bg-white/80 px-4 text-sm text-ink dark:bg-white/5 dark:border-white/10 dark:text-white"
            >
              <option value="open">⏳ Open</option>
              <option value="reviewed">✅ Reviewed</option>
              <option value="flagged">🚩 Flagged</option>
              <option value="dismissed">❌ Dismissed</option>
            </select>
            <Button onClick={() => doAction(() => adminSetReportStatus(reportId, reportStatus), "Status updated!")} loading={busy} className="w-full">
              Update Status
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
