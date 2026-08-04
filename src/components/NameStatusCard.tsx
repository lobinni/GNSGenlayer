import { Link } from "react-router-dom";
import { Card } from "./ui/Card";
import { Badge } from "./Badge";
import { Button } from "./ui/Button";
import { AddressText } from "./AddressText";
import type { GnsName } from "@/lib/types";
import { formatExpiry } from "@/lib/utils";

export function NameStatusCard({
  fullName,
  available,
  name,
}: {
  fullName: string;
  available: boolean;
  name?: GnsName | null;
}) {
  if (available) {
    return (
      <Card padding="lg" variant="gradient" className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-success/10 mb-4">
          <span className="text-3xl">✨</span>
        </div>
        <Badge tone="green" dot className="mb-3">Available</Badge>
        <h2 className="text-3xl font-bold text-ink dark:text-white">{fullName}</h2>
        <p className="mt-2 text-muted">This name is available! Claim your .gen identity now.</p>
        <div className="mt-6">
          <Link to={`/register/${encodeURIComponent(fullName)}`}>
            <Button size="lg" variant="gradient">
              🚀 Register {fullName}
            </Button>
          </Link>
        </div>
      </Card>
    );
  }

  return (
    <Card padding="lg">
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0 w-14 h-14 rounded-2xl bg-amber-100 dark:bg-amber-500/20 flex items-center justify-center">
          <span className="text-2xl">🔒</span>
        </div>
        <div className="flex-1">
          <Badge tone={name?.status === "flagged" ? "red" : "amber"} className="mb-2">
            {name?.status?.toUpperCase() || "REGISTERED"}
          </Badge>
          <h2 className="text-2xl font-bold text-ink dark:text-white">
            {fullName}
          </h2>
          <p className="mt-1 text-sm text-muted">This name is already registered</p>
        </div>
      </div>
      
      {name && (
        <dl className="mt-6 space-y-3">
          <div className="flex items-center justify-between py-3 border-b border-border/40 dark:border-white/10">
            <dt className="text-sm text-muted flex items-center gap-2">
              <span>👤</span> Owner
            </dt>
            <dd><AddressText value={name.owner} /></dd>
          </div>
          <div className="flex items-center justify-between py-3 border-b border-border/40 dark:border-white/10">
            <dt className="text-sm text-muted flex items-center gap-2">
              <span>📍</span> Primary Address
            </dt>
            <dd><AddressText value={name.primary_address} /></dd>
          </div>
          <div className="flex items-center justify-between py-3 border-b border-border/40 dark:border-white/10">
            <dt className="text-sm text-muted flex items-center gap-2">
              <span>📅</span> Expires
            </dt>
            <dd className="font-mono text-sm text-ink dark:text-white">{formatExpiry(name.expires_at)}</dd>
          </div>
          <div className="flex items-center justify-between py-3">
            <dt className="text-sm text-muted flex items-center gap-2">
              <span>📝</span> Records
            </dt>
            <dd className="font-mono text-sm text-ink dark:text-white">
              {Object.values(name.records || {}).filter(Boolean).length} configured
            </dd>
          </div>
        </dl>
      )}
      
      <div className="mt-6 flex flex-wrap gap-2">
        <Link to={`/name/${encodeURIComponent(fullName)}`}>
          <Button size="sm" variant="primary">👁️ View Profile</Button>
        </Link>
        <Link to={`/disputes`}>
          <Button size="sm" variant="ghost">⚠️ Report</Button>
        </Link>
      </div>
    </Card>
  );
}
