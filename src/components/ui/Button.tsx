import type { ButtonHTMLAttributes, ReactNode } from "react";
import { classNames } from "@/lib/utils";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "success" | "gradient";
type Size = "xs" | "sm" | "md" | "lg";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  icon?: ReactNode;
  children: ReactNode;
};

const variants: Record<Variant, string> = {
  primary: "bg-gradient-to-r from-primary to-primaryDark text-white shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 hover:scale-[1.02] border-0",
  secondary: "bg-white text-primary hover:bg-primary/5 border border-primary/30 hover:border-primary/50 dark:bg-white/5 dark:text-primaryLight dark:hover:bg-white/10",
  ghost: "bg-transparent text-ink hover:bg-section border border-transparent hover:border-border dark:text-white/80 dark:hover:bg-white/5",
  danger: "bg-gradient-to-r from-error to-red-600 text-white shadow-lg shadow-error/25 hover:shadow-xl hover:shadow-error/30 border-0",
  success: "bg-gradient-to-r from-success to-emerald-600 text-white shadow-lg shadow-success/25 hover:shadow-xl border-0",
  gradient: "bg-gradient-to-r from-primary via-purple-500 to-accent text-white shadow-lg shadow-primary/25 hover:shadow-xl hover:scale-[1.02] border-0",
};

const sizes: Record<Size, string> = {
  xs: "h-7 px-2.5 text-xs rounded-lg gap-1",
  sm: "h-9 px-4 text-sm rounded-xl gap-1.5",
  md: "h-11 px-6 text-sm rounded-xl gap-2",
  lg: "h-13 px-8 text-base rounded-2xl gap-2",
};

export function Button({
  variant = "primary",
  size = "md",
  loading,
  icon,
  className,
  children,
  disabled,
  ...rest
}: Props) {
  return (
    <button
      disabled={disabled || loading}
      className={classNames(
        "inline-flex items-center justify-center font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none",
        variants[variant],
        sizes[size],
        className
      )}
      {...rest}
    >
      {loading ? (
        <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-25" />
          <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="3" strokeLinecap="round" className="opacity-75" />
        </svg>
      ) : icon ? (
        <span className="flex-shrink-0">{icon}</span>
      ) : null}
      <span>{children}</span>
    </button>
  );
}
