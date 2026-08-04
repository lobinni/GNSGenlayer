import type { TextareaHTMLAttributes } from "react";
import { classNames } from "@/lib/utils";

type Props = TextareaHTMLAttributes<HTMLTextAreaElement> & { label?: string; hint?: string; error?: string };

export function Textarea({ label, hint, error, className, id, ...rest }: Props) {
  const inputId = id || rest.name;
  return (
    <div className="w-full">
      {label && (
        <label htmlFor={inputId} className="mb-2 block text-sm font-medium text-ink dark:text-white">
          {label}
        </label>
      )}
      <textarea
        id={inputId}
        {...rest}
        className={classNames(
          "w-full rounded-xl border bg-white/80 px-4 py-3 text-sm text-ink placeholder:text-muted/60 transition-all duration-200",
          "focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50",
          "dark:bg-white/5 dark:text-white dark:placeholder:text-white/30",
          error ? "border-error/50" : "border-border/60 dark:border-white/10",
          className
        )}
      />
      {error ? (
        <p className="mt-1.5 text-xs text-error">{error}</p>
      ) : hint ? (
        <p className="mt-1.5 text-xs text-muted">{hint}</p>
      ) : null}
    </div>
  );
}
