import { Skeleton } from "@/components/ui/primitives";

export function AuthFormSkeleton() {
  return (
    <div className="flex flex-col gap-6" aria-busy>
      <div className="flex flex-col gap-2">
        <Skeleton className="h-7 w-48" />
        <Skeleton className="h-4 w-64" />
      </div>
      <Skeleton className="h-10" />
      <Skeleton className="h-10" />
      <Skeleton className="h-10" />
      <Skeleton className="h-10" />
    </div>
  );
}
