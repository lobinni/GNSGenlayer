import { truncateAddress } from "@/lib/utils";
import { CopyButton } from "./CopyButton";

export function AddressText({
  value,
  showCopy = true,
  className,
  full = false,
}: {
  value: string;
  showCopy?: boolean;
  className?: string;
  full?: boolean;
}) {
  if (!value) return <span className="text-muted">—</span>;
  return (
    <span className={`inline-flex items-center gap-2 ${className || ""}`}>
      <span className="font-mono text-sm text-ink dark:text-white">
        {full ? value : truncateAddress(value)}
      </span>
      {showCopy && <CopyButton value={value} />}
    </span>
  );
}
