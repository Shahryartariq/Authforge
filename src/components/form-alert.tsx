import { AlertCircle, CheckCircle2, Info } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { cn } from "@/lib/utils";

const icons = { error: AlertCircle, success: CheckCircle2, info: Info };
const variants = { error: "destructive", success: "success", info: "brand" } as const;

/** A one-line form message (error, success or info) built on shadcn's Alert. */
export function FormAlert({
  variant = "error",
  className,
  children,
}: {
  variant?: keyof typeof icons;
  className?: string;
  children: React.ReactNode;
}) {
  const Icon = icons[variant];
  return (
    <Alert variant={variants[variant]} className={cn("py-2.5", className)}>
      <Icon aria-hidden />
      <AlertDescription>{children}</AlertDescription>
    </Alert>
  );
}
