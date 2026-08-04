import { Link } from "react-router-dom";
import { Card } from "./ui/Card";
import { Badge } from "./Badge";
import { Button } from "./ui/Button";
import type { GnsName } from "@/lib/types";
import { daysUntil, formatExpiry } from "@/lib/utils";

export function DashboardNameCard({ name }: { name: GnsName }) {
  const days = daysUntil(name.expires_at);
  const recordCount = Object.values(name.records || {}).filter(Boolean).length;
  const isExpiringSoon = days <= 30;
  
  return (
    <Card hover className="group">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex-1">
          <Link to={`/name/${encodeURIComponent(name.full_name)}`} className="block">
            <h3 className="text-xl font-bold text-ink group-hover:text-primary transition-colors dark:text-white">
              {name.full_name}
            </h3>
          </Link>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <Badge tone={name.is_subname ? "secondary" : "primary"}>
              {name.is_subname ? "📁 Subname" : "🌐 Root"}
            </Badge>
            <Badge tone={name.status === "flagged" ? "red" : "green"} dot>
              {name.status}
            </Badge>
          </div>
        </div>
        
        <div className="text-right">
          <div className={`rounded-xl px-4 py-2 ${
            isExpiringSoon 
              ? "bg-warning/10 border border-warning/20" 
              : "bg-section dark:bg-white/5"
          }`}>
            <p className="text-xs text-muted">Expires in</p>
            <p className={`text-lg font-bold ${isExpiringSoon ? "text-warning" : "text-ink dark:text-white"}`}>
              {days} days
            </p>
            <p className="text-xs text-muted">{formatExpiry(name.expires_at)}</p>
          </div>
        </div>
      </div>
      
      <div className="mt-4 flex items-center gap-4 text-sm text-muted">
        <span className="flex items-center gap-1.5">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
          </svg>
          {recordCount} records
        </span>
      </div>
      
      <div className="mt-4 pt-4 border-t border-border/40 dark:border-white/10 flex flex-wrap gap-2">
        <Link to={`/manage/${encodeURIComponent(name.full_name)}`}>
          <Button size="sm" variant="primary">
            ⚙️ Manage
          </Button>
        </Link>
        {!name.is_subname && (
          <Link to={`/subnames/${encodeURIComponent(name.full_name)}`}>
            <Button size="sm" variant="secondary">
              📁 Subnames
            </Button>
          </Link>
        )}
        <Link to={`/name/${encodeURIComponent(name.full_name)}`}>
          <Button size="sm" variant="ghost">
            👁️ Profile
          </Button>
        </Link>
      </div>
    </Card>
  );
}
