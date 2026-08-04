import type { ReactNode } from "react";
import { classNames } from "@/lib/utils";

export function Card({
  children,
  className,
  padding = "md",
  variant = "default",
  hover = false,
}: {
  children: ReactNode;
  className?: string;
  padding?: "sm" | "md" | "lg" | "none";
  variant?: "default" | "glass" | "gradient" | "outlined";
  hover?: boolean;
}) {
  const pads: Record<string, string> = {
    none: "",
    sm: "p-4",
    md: "p-6",
    lg: "p-8",
  };

  const variants: Record<string, string> = {
    default: "bg-white/90 border border-border/60 shadow-sm dark:bg-inkLight/50 dark:border-white/10",
    glass: "glass border border-white/20 shadow-lg dark:border-white/10",
    gradient: "bg-gradient-to-br from-primary/5 via-white to-accent/5 border border-primary/20 dark:from-primary/10 dark:via-inkLight/50 dark:to-accent/10",
    outlined: "bg-transparent border-2 border-dashed border-border dark:border-white/20",
  };

  return (
    <div
      className={classNames(
        "rounded-2xl transition-all duration-300",
        variants[variant],
        pads[padding],
        hover && "hover:shadow-xl hover:scale-[1.02] hover:border-primary/40 cursor-pointer",
        className
      )}
    >
      {children}
    </div>
  );
}
