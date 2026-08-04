import type { ReactNode } from "react";
import { classNames } from "@/lib/utils";

type Tone = "primary" | "secondary" | "success" | "warning" | "error" | "info" | "gradient" 
  | "blue" | "grey" | "amber" | "red" | "green";

const tones: Record<Tone, string> = {
  primary: "bg-primary/10 text-primary border-primary/20 dark:bg-primary/20 dark:text-primaryLight",
  blue: "bg-primary/10 text-primary border-primary/20 dark:bg-primary/20 dark:text-primaryLight",
  secondary: "bg-section text-muted border-border dark:bg-white/10 dark:text-white/70 dark:border-white/10",
  grey: "bg-section text-muted border-border dark:bg-white/10 dark:text-white/70 dark:border-white/10",
  success: "bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-400",
  green: "bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-400",
  warning: "bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-500/20 dark:text-amber-400",
  amber: "bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-500/20 dark:text-amber-400",
  error: "bg-red-50 text-red-600 border-red-200 dark:bg-red-500/20 dark:text-red-400",
  red: "bg-red-50 text-red-600 border-red-200 dark:bg-red-500/20 dark:text-red-400",
  info: "bg-cyan-50 text-cyan-600 border-cyan-200 dark:bg-cyan-500/20 dark:text-cyan-400",
  gradient: "bg-gradient-to-r from-primary/10 via-purple-500/10 to-accent/10 text-primary border-primary/20 dark:text-primaryLight",
};

export function Badge({
  children,
  tone = "primary",
  className,
  dot,
  icon,
}: {
  children: ReactNode;
  tone?: Tone;
  className?: string;
  dot?: boolean;
  icon?: ReactNode;
}) {
  return (
    <span
      className={classNames(
        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold transition-all",
        tones[tone],
        className
      )}
    >
      {dot && (
        <span className={classNames(
          "h-1.5 w-1.5 rounded-full animate-pulse",
          (tone === "success" || tone === "green") ? "bg-emerald-500" : 
          (tone === "error" || tone === "red") ? "bg-red-500" : 
          (tone === "warning" || tone === "amber") ? "bg-amber-500" : "bg-primary"
        )} />
      )}
      {icon && <span className="flex-shrink-0">{icon}</span>}
      {children}
    </span>
  );
}
