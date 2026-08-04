import type { AiResult } from "@/lib/types";
import { Card } from "./ui/Card";
import { Badge } from "./Badge";

const RISK_TONE: Record<string, "green" | "primary" | "amber" | "red" | "grey"> = {
  low: "green",
  unreviewed: "grey",
  medium: "amber",
  high: "red",
  critical: "red",
};

export function AiResultCard({ result, title }: { result: AiResult; title?: string }) {
  const tone = RISK_TONE[result.risk] || "grey";
  return (
    <Card padding="lg" variant="gradient">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Badge tone="gradient" icon={<span>🤖</span>}>AI-assisted · beta</Badge>
          <Badge tone={tone}>Risk: {result.risk}</Badge>
          {result.verified ? (
            <Badge tone="green" dot>Verified</Badge>
          ) : (
            <Badge tone="grey">Unverified</Badge>
          )}
        </div>
        {title && <p className="text-xs text-muted">{title}</p>}
      </div>
      
      <div className="mt-4 space-y-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted">Verdict</p>
          <p className="mt-1 text-lg font-semibold text-ink dark:text-white">{result.verdict}</p>
        </div>
        
        {result.summary && (
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted">Summary</p>
            <p className="mt-1 text-sm text-ink dark:text-white/80">{result.summary}</p>
          </div>
        )}
        
        {result.reasons?.length > 0 && (
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted">Reasons</p>
            <ul className="mt-2 space-y-1.5">
              {result.reasons.map((r, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-ink dark:text-white/80">
                  <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary flex-shrink-0" />
                  {r}
                </li>
              ))}
            </ul>
          </div>
        )}
        
        {(result.recommended_action || result.recommended_report_status) && (
          <div className="rounded-xl bg-primary/5 p-4 dark:bg-primary/10">
            <p className="text-xs font-semibold uppercase tracking-wider text-primary">Recommended Action</p>
            <p className="mt-1 text-sm font-medium text-ink dark:text-white">
              {result.recommended_action || result.recommended_report_status}
            </p>
          </div>
        )}
      </div>
      
      <p className="mt-4 text-xs text-muted border-t border-border/40 dark:border-white/10 pt-4">
        ⚠️ AI-assisted review for informational purposes only. Not an official endorsement.
      </p>
    </Card>
  );
}
