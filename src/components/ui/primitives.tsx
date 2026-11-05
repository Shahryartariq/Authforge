import * as React from "react";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function Input({ className, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      className={cn(
        "flex h-10 w-full rounded-lg border border-input bg-card px-3 text-sm outline-none transition-shadow placeholder:text-muted-foreground focus-visible:border-accent focus-visible:ring-4 focus-visible:ring-ring disabled:opacity-50 aria-invalid:border-destructive",
        className,
      )}
      {...props}
    />
  );
}

export function Label({ className, ...props }: React.ComponentProps<"label">) {
  return <label className={cn("text-sm font-medium leading-none", className)} {...props} />;
}

export function Card({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn("rounded-xl border bg-card shadow-[0_1px_2px_rgb(0_0_0/0.04)]", className)}
      {...props}
    />
  );
}

export function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("flex flex-col gap-1.5 p-6 pb-4", className)} {...props} />;
}

export function CardTitle({ className, ...props }: React.ComponentProps<"h2">) {
  return <h2 className={cn("text-base font-semibold tracking-tight", className)} {...props} />;
}

export function CardDescription({ className, ...props }: React.ComponentProps<"p">) {
  return <p className={cn("text-sm text-muted-foreground", className)} {...props} />;
}

export function CardContent({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("px-6 pb-6", className)} {...props} />;
}

export function Badge({
  className,
  tone = "neutral",
  ...props
}: React.ComponentProps<"span"> & { tone?: "neutral" | "accent" | "success" | "danger" }) {
  const tones = {
    neutral: "bg-muted text-muted-foreground",
    accent: "bg-accent-soft text-accent",
    success: "bg-success-soft text-success",
    danger: "bg-destructive-soft text-destructive",
  };
  return (
    <span
      className={cn("inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium", tones[tone], className)}
      {...props}
    />
  );
}

export function Alert({
  tone = "error",
  children,
  className,
}: {
  tone?: "error" | "success";
  children: React.ReactNode;
  className?: string;
}) {
  const Icon = tone === "error" ? AlertCircle : CheckCircle2;
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={cn(
        "flex items-start gap-2 rounded-lg px-3 py-2.5 text-sm",
        tone === "error" ? "bg-destructive-soft text-destructive" : "bg-success-soft text-success",
        className,
      )}
    >
      <Icon className="mt-0.5 size-4 shrink-0" aria-hidden />
      <div>{children}</div>
    </div>
  );
}

export function Separator({ label, className }: { label?: string; className?: string }) {
  if (!label) return <hr className={cn("border-t", className)} />;
  return (
    <div className={cn("flex items-center gap-3 text-xs uppercase tracking-wide text-muted-foreground", className)}>
      <span className="h-px flex-1 bg-border" />
      {label}
      <span className="h-px flex-1 bg-border" />
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-lg bg-muted", className)} aria-hidden />;
}

export function Field({
  label,
  htmlFor,
  error,
  hint,
  action,
  children,
}: {
  label: string;
  htmlFor: string;
  error?: string;
  hint?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <Label htmlFor={htmlFor}>{label}</Label>
        {action}
      </div>
      {children}
      {error ? (
        <p id={`${htmlFor}-error`} className="text-[13px] text-destructive">
          {error}
        </p>
      ) : hint ? (
        <p className="text-[13px] text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
}
