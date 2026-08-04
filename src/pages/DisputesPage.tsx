import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useWallet } from "@/lib/wallet/WalletProvider";
import { reportName, getTotalReports, getReport, aiReviewReport, extractResult } from "@/lib/gns/contract";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { ConnectWalletButton } from "@/components/ConnectWalletButton";
import { AiResultCard } from "@/components/AiResultCard";
import type { GnsReport, AiReview } from "@/lib/types";

const REASONS = [
  { value: "Impersonation", icon: "👤" },
  { value: "Phishing", icon: "🎣" },
  { value: "Fake support", icon: "🎭" },
  { value: "Brand misuse", icon: "™️" },
  { value: "Squatting", icon: "🏚️" },
  { value: "Other", icon: "📝" },
];

function ReportCard({ report, onUpdate }: { report: GnsReport; onUpdate: (r: GnsReport) => void }) {
  const { address } = useWallet();
  const [aiReview, setAiReview] = useState<AiReview | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [showAi, setShowAi] = useState(false);

  const runAiReview = async () => {
    if (!address) return;
    setAiLoading(true);
    try {
      const review = await aiReviewReport(report.id);
      setAiReview(review);
      const updated = await getReport(report.id);
      if (updated) onUpdate(updated);
    } catch { /* ignore */ }
    finally { setAiLoading(false); }
  };

  const statusConfig: Record<string, { tone: "red" | "grey" | "green" | "amber"; icon: string }> = {
    flagged: { tone: "red", icon: "🚩" },
    dismissed: { tone: "grey", icon: "❌" },
    reviewed: { tone: "green", icon: "✅" },
    open: { tone: "amber", icon: "⏳" },
  };

  const config = statusConfig[report.status] || statusConfig.open;
  const aiResult = extractResult(aiReview);

  return (
    <Card>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex-1">
          <Link to={`/name/${encodeURIComponent(report.name)}`} className="text-lg font-bold text-primary hover:underline">
            {report.name}
          </Link>
          <div className="mt-2 flex items-center gap-2 text-sm text-muted">
            <span>{REASONS.find(r => r.value === report.reason)?.icon || "📝"}</span>
            {report.reason}
          </div>
        </div>
        <Badge tone={config.tone} icon={<span>{config.icon}</span>}>
          {report.status}
        </Badge>
      </div>
      
      {report.comment && (
        <p className="mt-3 text-sm text-ink dark:text-white/80 bg-section dark:bg-white/5 rounded-lg p-3">
          {report.comment}
        </p>
      )}
      
      {report.evidence_url && (
        <a href={report.evidence_url} target="_blank" rel="noreferrer" className="mt-2 flex items-center gap-1.5 text-xs text-primary hover:underline">
          <span>🔗</span>
          <span className="truncate">{report.evidence_url}</span>
        </a>
      )}
      
      <div className="mt-4 pt-4 border-t border-border/40 dark:border-white/10 flex flex-wrap gap-2">
        <Button size="xs" variant="ghost" onClick={() => setShowAi((v) => !v)} icon={<span>🤖</span>}>
          {showAi ? "Hide AI" : "AI Review"}
        </Button>
        {showAi && !aiReview && (
          <Button size="xs" variant="secondary" onClick={runAiReview} loading={aiLoading}>
            Run Review
          </Button>
        )}
      </div>
      
      {showAi && aiReview && aiResult && (
        <div className="mt-4">
          <AiResultCard result={aiResult} title={`Review #${aiReview.id}`} />
        </div>
      )}
    </Card>
  );
}

export default function DisputesPage() {
  const { address, connect } = useWallet();
  const [name, setName] = useState("");
  const [reason, setReason] = useState(REASONS[0].value);
  const [evidenceUrl, setEvidenceUrl] = useState("");
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitMsg, setSubmitMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const [reports, setReports] = useState<GnsReport[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    (async () => {
      try {
        const total = await getTotalReports();
        const list: GnsReport[] = [];
        for (let i = total; i >= Math.max(1, total - 9); i--) {
          const r = await getReport(String(i));
          if (r && !cancelled) list.push(r);
        }
        if (!cancelled) setReports(list);
      } catch { /* ignore */ }
      finally { if (!cancelled) setLoading(false); }
    })();
    return () => { cancelled = true; };
  }, []);

  const onSubmit = async () => {
    if (!address) { await connect(); return; }
    if (!name.trim()) { setSubmitMsg({ ok: false, text: "Enter a name." }); return; }
    setSubmitting(true);
    setSubmitMsg(null);
    try {
      const res = await reportName(name, reason, evidenceUrl, comment);
      setSubmitMsg({ ok: res.success, text: res.success ? "Report submitted successfully!" : res.message });
      if (res.success) {
        setName("");
        setEvidenceUrl("");
        setComment("");
        const total = await getTotalReports();
        const r = await getReport(String(total));
        if (r) setReports((prev) => [r, ...prev]);
      }
    } catch (e) {
      setSubmitMsg({ ok: false, text: e instanceof Error ? e.message : "Report failed." });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="text-center">
        <Badge tone="warning" icon={<span>⚠️</span>}>Disputes</Badge>
        <h1 className="mt-4 text-3xl font-bold text-ink dark:text-white">Report Suspicious Names</h1>
        <p className="mt-2 text-muted">Help keep the GNS ecosystem safe</p>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Submit Form */}
        <Card>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-warning/10 flex items-center justify-center text-xl">
              📢
            </div>
            <div>
              <h2 className="text-lg font-bold text-ink dark:text-white">Submit Report</h2>
              <p className="text-xs text-muted">Reports are stored on-chain</p>
            </div>
          </div>
          
          <div className="space-y-4">
            <Input 
              label="Name to report" 
              value={name} 
              onChange={(e) => setName(e.target.value)} 
              placeholder="suspicious.gen"
              icon={<span>🌐</span>}
            />
            
            <div>
              <label className="mb-2 block text-sm font-medium text-ink dark:text-white">
                Reason
              </label>
              <div className="grid grid-cols-2 gap-2">
                {REASONS.map((r) => (
                  <button
                    key={r.value}
                    onClick={() => setReason(r.value)}
                    className={`flex items-center gap-2 rounded-xl border-2 px-3 py-2.5 text-sm font-medium transition-all ${
                      reason === r.value
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border/60 bg-white/80 text-ink hover:border-primary/30 dark:bg-white/5 dark:border-white/10 dark:text-white"
                    }`}
                  >
                    <span>{r.icon}</span>
                    {r.value}
                  </button>
                ))}
              </div>
            </div>
            
            <Input 
              label="Evidence URL" 
              value={evidenceUrl} 
              onChange={(e) => setEvidenceUrl(e.target.value)} 
              placeholder="https://..."
              icon={<span>🔗</span>}
            />
            
            <Textarea 
              label="Additional details" 
              value={comment} 
              onChange={(e) => setComment(e.target.value)} 
              rows={3} 
              placeholder="Describe the issue..."
            />
            
            {!address ? (
              <ConnectWalletButton />
            ) : (
              <Button onClick={onSubmit} loading={submitting} variant="gradient" className="w-full" icon={<span>📤</span>}>
                Submit Report
              </Button>
            )}
            
            {submitMsg && (
              <div className={`p-3 rounded-xl text-sm font-medium ${
                submitMsg.ok ? "bg-success/10 text-success" : "bg-error/10 text-error"
              }`}>
                {submitMsg.text}
              </div>
            )}
          </div>
        </Card>

        {/* Recent Reports */}
        <div>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-section flex items-center justify-center text-xl dark:bg-white/5">
              📋
            </div>
            <div>
              <h2 className="text-lg font-bold text-ink dark:text-white">Recent Reports</h2>
              <p className="text-xs text-muted">{reports.length} reports found</p>
            </div>
          </div>
          
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="w-10 h-10 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
            </div>
          ) : reports.length === 0 ? (
            <Card className="text-center py-12">
              <span className="text-4xl">📭</span>
              <p className="mt-3 text-muted">No reports yet</p>
            </Card>
          ) : (
            <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
              {reports.map((r) => (
                <ReportCard
                  key={r.id}
                  report={r}
                  onUpdate={(updated) => setReports((list) => list.map((x) => (x.id === updated.id ? updated : x)))}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
