import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useWallet } from "@/lib/wallet/WalletProvider";
import { resolveName, getSubnames, getAiStatus, getAiReview, aiReviewName, extractResult } from "@/lib/gns/contract";
import { getTrustSealIdentity, buildTrustSealMatches } from "@/lib/trustseal/client";
import { normaliseName, formatExpiry, daysUntil } from "@/lib/utils";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/Badge";
import { Button } from "@/components/ui/Button";
import { AddressText } from "@/components/AddressText";
import { AiResultCard } from "@/components/AiResultCard";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import type { GnsName, AiReview as AiReviewType, TrustSealIdentity, TrustSealMatch } from "@/lib/types";

export default function NameProfilePage() {
  const { name: paramName } = useParams<{ name: string }>();
  const fullName = normaliseName(decodeURIComponent(paramName || ""));
  const { address } = useWallet();

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<GnsName | null>(null);
  const [subs, setSubs] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const [aiReview, setAiReview] = useState<AiReviewType | null>(null);
  const [aiOpen, setAiOpen] = useState(false);
  const [claim, setClaim] = useState("");
  const [evidence, setEvidence] = useState("");
  const [extraCtx, setExtraCtx] = useState("");
  const [aiSubmitting, setAiSubmitting] = useState(false);
  const [aiMsg, setAiMsg] = useState<string | null>(null);
  const [showReviewDetails, setShowReviewDetails] = useState(false);

  const [, setTsIdentity] = useState<TrustSealIdentity | null>(null);
  const [tsMatches, setTsMatches] = useState<TrustSealMatch[]>([]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    (async () => {
      try {
        const [n, s] = await Promise.all([resolveName(fullName), getSubnames(fullName)]);
        if (!cancelled) { setData(n); setSubs(s); }
        if (n) {
          const status = await getAiStatus(fullName).catch(() => null);
          if (status?.last_review_id && !cancelled) {
            const review = await getAiReview(status.last_review_id).catch(() => null);
            if (!cancelled) setAiReview(review);
          }
          try {
            const identity = await getTrustSealIdentity(n.owner);
            if (!cancelled) {
              setTsIdentity(identity);
              setTsMatches(buildTrustSealMatches(identity, n.records || {}));
            }
          } catch { /* ignore */ }
        }
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : String(e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [fullName]);

  const runAiReview = async () => {
    setAiSubmitting(true);
    setAiMsg(null);
    try {
      const review = await aiReviewName(fullName, claim, evidence, extraCtx);
      setAiReview(review);
      setAiOpen(false);
      setAiMsg("AI review submitted.");
    } catch (e) {
      setAiMsg(e instanceof Error ? e.message : "AI review failed.");
    } finally {
      setAiSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="w-16 h-16 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
        <p className="mt-4 text-sm text-muted">Loading profile...</p>
      </div>
    );
  }

  if (error) return <Card padding="lg"><p className="text-error">{error}</p></Card>;
  if (!data) {
    return (
      <Card padding="lg" className="mx-auto max-w-md text-center">
        <span className="text-4xl">🔍</span>
        <p className="mt-3 text-muted">{fullName} was not found.</p>
        <Link to="/search" className="mt-4 inline-block text-sm text-primary hover:underline">← Search</Link>
      </Card>
    );
  }

  const isOwner = Boolean(address && data.owner.toLowerCase() === address.toLowerCase());
  const aiResult = extractResult(aiReview);
  const verified = aiResult?.verified ?? false;
  const hasReview = Boolean(aiReview);
  const isFlagged = data.status === "flagged";
  const riskHigh = aiResult && (aiResult.risk === "high" || aiResult.risk === "critical");
  const reviewIsProminent = isFlagged || riskHigh;
  const records = data.records || {};
  const recordEntries = Object.entries(records).filter(([, v]) => Boolean(v));
  const days = daysUntil(data.expires_at);

  const recordIcons: Record<string, string> = {
    avatar: "🖼️", website: "🌐", x: "🐦", github: "💻",
    discord: "💬", email: "📧", contract: "📜", agent: "🤖", description: "📝"
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6 animate-fade-in">
      {/* Header Card */}
      <Card padding="lg" variant="gradient">
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary via-purple-500 to-accent flex items-center justify-center text-2xl text-white font-bold shadow-lg">
              {data.full_name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="text-3xl font-bold text-ink dark:text-white">{data.full_name}</h1>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <Badge tone={data.is_subname ? "secondary" : "primary"}>
                  {data.is_subname ? "📁 Subname" : "🌐 Root"}
                </Badge>
                <Badge tone={isFlagged ? "red" : "green"} dot>{data.status}</Badge>
                {verified && <Badge tone="green" icon={<span>✓</span>}>Verified</Badge>}
              </div>
            </div>
          </div>
          
          <div className="text-right">
            <div className={`inline-block rounded-xl px-4 py-3 ${days <= 30 ? "bg-warning/10" : "bg-section dark:bg-white/5"}`}>
              <p className="text-xs text-muted">Expires in</p>
              <p className={`text-2xl font-bold ${days <= 30 ? "text-warning" : "text-ink dark:text-white"}`}>{days} days</p>
              <p className="text-xs text-muted">{formatExpiry(data.expires_at)}</p>
            </div>
          </div>
        </div>

        {/* Owner Info */}
        <dl className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="flex items-center justify-between p-4 rounded-xl bg-white/50 dark:bg-white/5">
            <dt className="text-sm text-muted flex items-center gap-2"><span>👤</span> Owner</dt>
            <dd><AddressText value={data.owner} /></dd>
          </div>
          <div className="flex items-center justify-between p-4 rounded-xl bg-white/50 dark:bg-white/5">
            <dt className="text-sm text-muted flex items-center gap-2"><span>📍</span> Primary</dt>
            <dd><AddressText value={data.primary_address} /></dd>
          </div>
        </dl>

        {isOwner && (
          <div className="mt-6 pt-4 border-t border-border/40 dark:border-white/10 flex flex-wrap gap-3">
            <Link to={`/manage/${encodeURIComponent(fullName)}`}>
              <Button variant="primary" icon={<span>⚙️</span>}>Manage</Button>
            </Link>
            {!data.is_subname && (
              <Link to={`/subnames/${encodeURIComponent(fullName)}`}>
                <Button variant="secondary" icon={<span>📁</span>}>Subnames</Button>
              </Link>
            )}
          </div>
        )}
      </Card>

      {/* Records */}
      {recordEntries.length > 0 && (
        <Card>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-xl">📝</div>
            <h2 className="text-lg font-bold text-ink dark:text-white">Profile Records</h2>
          </div>
          <dl className="space-y-3">
            {recordEntries.map(([k, v]) => (
              <div key={k} className="flex items-center justify-between p-3 rounded-xl bg-section dark:bg-white/5">
                <dt className="text-sm text-muted flex items-center gap-2">
                  <span>{recordIcons[k] || "📎"}</span>
                  <span className="capitalize">{k}</span>
                </dt>
                <dd className="font-mono text-sm text-ink dark:text-white max-w-xs truncate">{v}</dd>
              </div>
            ))}
          </dl>
        </Card>
      )}

      {/* TrustSeal */}
      {tsMatches.length > 0 && (
        <Card>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-success/10 flex items-center justify-center text-xl">🔏</div>
              <div>
                <h2 className="text-lg font-bold text-ink dark:text-white">TrustSeal Verification</h2>
                <p className="text-xs text-muted">On-chain identity proofs for linked accounts</p>
              </div>
            </div>
            <a href="https://github.com/lobinni/TrustSeal" target="_blank" rel="noreferrer" className="text-xs text-primary hover:underline">
              TrustSeal ↗
            </a>
          </div>
          <div className="space-y-2">
            {tsMatches.map((m: TrustSealMatch) => (
              <div key={m.platform} className="flex items-center justify-between p-3 rounded-xl bg-section dark:bg-white/5">
                <span className="text-sm text-muted">{m.label}: <span className="font-mono text-ink dark:text-white">{m.expected}</span></span>
                <Badge tone={m.matched ? "green" : m.status === "flagged" ? "red" : "grey"} dot={m.matched}>
                  {m.status}
                </Badge>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* AI Review - Prominent if flagged/high risk */}
      {reviewIsProminent && aiReview && aiResult && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <span className="text-xl">{isFlagged ? "🚨" : "🤖"}</span>
            <h2 className="text-lg font-bold text-ink dark:text-white">
              {isFlagged ? "Trust Alert" : "AI Review"}
            </h2>
          </div>
          <AiResultCard result={aiResult} title={`Review #${aiReview.id}`} />
        </div>
      )}

      {/* Verification Panel */}
      {!reviewIsProminent && (
        <Card>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center text-xl">🛡️</div>
              <div>
                <h2 className="text-lg font-bold text-ink dark:text-white">Verification</h2>
                <p className="text-xs text-muted">
                  {verified ? "AI-verified" : hasReview ? "Reviewed" : "Not reviewed"}
                </p>
              </div>
            </div>
            <Badge tone={verified ? "green" : hasReview ? "primary" : "grey"}>
              {verified ? "✓ Verified" : hasReview ? "Reviewed" : "Unreviewed"}
            </Badge>
          </div>
          
          <div className="flex flex-wrap gap-2">
            {hasReview && (
              <Button size="sm" variant="ghost" onClick={() => setShowReviewDetails((v) => !v)}>
                {showReviewDetails ? "Hide" : "Show"} Review
              </Button>
            )}
            <Button size="sm" variant="secondary" onClick={() => setAiOpen((v) => !v)} icon={<span>🤖</span>}>
              {aiOpen ? "Cancel" : "Run AI Review"}
            </Button>
          </div>
          
          {showReviewDetails && aiReview && aiResult && (
            <div className="mt-4">
              <AiResultCard result={aiResult} title={`Review #${aiReview.id}`} />
            </div>
          )}
        </Card>
      )}

      {/* AI Review Form */}
      {aiOpen && (
        <Card>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-xl">🤖</div>
            <div>
              <h2 className="text-lg font-bold text-ink dark:text-white">Submit AI Review</h2>
              <p className="text-xs text-muted">AI-assisted, not official endorsement</p>
            </div>
          </div>
          <div className="space-y-4">
            <Input label="Claim" value={claim} onChange={(e) => setClaim(e.target.value)} placeholder="e.g. This is the official Project X account" />
            <Input label="Evidence URL" value={evidence} onChange={(e) => setEvidence(e.target.value)} placeholder="https://..." />
            <Textarea label="Extra context" value={extraCtx} onChange={(e) => setExtraCtx(e.target.value)} rows={3} placeholder="Additional details..." />
            <Button onClick={runAiReview} loading={aiSubmitting} variant="gradient" className="w-full">
              Submit Review
            </Button>
            {aiMsg && <p className="text-sm text-muted">{aiMsg}</p>}
          </div>
        </Card>
      )}

      {/* Subnames */}
      {subs.length > 0 && (
        <Card>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-section flex items-center justify-center text-xl dark:bg-white/5">📁</div>
            <div>
              <h2 className="text-lg font-bold text-ink dark:text-white">Subnames</h2>
              <p className="text-xs text-muted">{subs.length} subname{subs.length !== 1 ? "s" : ""}</p>
            </div>
          </div>
          <div className="space-y-2">
            {subs.map((s) => (
              <Link key={s} to={`/name/${encodeURIComponent(s)}`} className="block p-3 rounded-xl bg-section hover:bg-primary/5 transition-all dark:bg-white/5 dark:hover:bg-white/10">
                <span className="font-mono text-sm text-primary">{s}</span>
              </Link>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
