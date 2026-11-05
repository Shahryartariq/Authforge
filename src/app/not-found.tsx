import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-4 px-4 text-center">
      <p className="font-mono text-sm text-muted-foreground">404</p>
      <h1 className="text-2xl font-semibold tracking-tight">This page doesn&apos;t exist</h1>
      <Link href="/" className={buttonVariants({ variant: "outline" })}>
        Go home
      </Link>
    </main>
  );
}
