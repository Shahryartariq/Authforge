import { Card } from "@/components/ui/primitives";
import { cn } from "@/lib/utils";

export function Section({
  title,
  description,
  children,
  footer,
  danger,
}: {
  title: string;
  description: React.ReactNode;
  children?: React.ReactNode;
  footer?: React.ReactNode;
  danger?: boolean;
}) {
  return (
    <Card className={cn(danger && "border-destructive/40")}>
      <div className="flex flex-col gap-1 p-6 pb-4">
        <h2 className={cn("text-base font-semibold tracking-tight", danger && "text-destructive")}>{title}</h2>
        <div className="text-sm text-muted-foreground">{description}</div>
      </div>
      {children && <div className="px-6 pb-6">{children}</div>}
      {footer && <div className="flex justify-end gap-2 rounded-b-xl border-t bg-muted/50 px-6 py-3">{footer}</div>}
    </Card>
  );
}
