import type { InputHTMLAttributes } from "react";
import { classNames } from "@/lib/utils";

type Props = InputHTMLAttributes<HTMLInputElement> & { 
  label?: string; 
  hint?: string; 
  error?: string;
  icon?: React.ReactNode;
};

export function Input({ label, hint, error, icon, className, id, ...rest }: Props) {
  const inputId = id || rest.name;
  return (
    <div className="w-full">
      {label && (
        <label htmlFor={inputId} className="mb-2 block text-sm font-medium text-ink dark:text-white">
          {label}
        </label>
      )}
      <div className="relative">
        {icon && (
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted">
            {icon}
          </span>
        )}
        <input
          id={inputId}
          {...rest}
          className={classNames(
            "h-12 w-full rounded-xl border bg-white/80 px-4 text-sm text-ink placeholder:text-muted/60 transition-all duration-200",
            "focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50",
            "dark:bg-white/5 dark:text-white dark:placeholder:text-white/30",
            error ? "border-error/50 focus:ring-error/30" : "border-border/60 dark:border-white/10",
            icon ? "pl-11" : "",
            className
          )}
        />
      </div>
      {error ? (
        <p className="mt-1.5 text-xs text-error flex items-center gap-1">
          <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          {error}
        </p>
      ) : hint ? (
        <p className="mt-1.5 text-xs text-muted">{hint}</p>
      ) : null}
    </div>
  );
}
