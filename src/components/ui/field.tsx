import * as React from "react";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

/**
 * A labelled form field in the style of shadcn's Field: label (with an
 * optional action on the right), the control, then an error or a hint.
 */
function Field({
  label,
  htmlFor,
  error,
  hint,
  action,
  className,
  children,
}: {
  label: string;
  htmlFor: string;
  error?: string;
  hint?: string;
  action?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div data-slot="field" data-invalid={Boolean(error) || undefined} className={cn("flex flex-col gap-2", className)}>
      <div className="flex items-center justify-between">
        <Label htmlFor={htmlFor}>{label}</Label>
        {action}
      </div>
      {children}
      {error ? (
        <p id={`${htmlFor}-error`} data-slot="field-error" className="text-[13px] text-destructive">
          {error}
        </p>
      ) : hint ? (
        <p data-slot="field-description" className="text-[13px] text-muted-foreground">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

export { Field };
