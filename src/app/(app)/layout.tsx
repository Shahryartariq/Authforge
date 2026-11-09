import { Suspense } from "react";
import Link from "next/link";
import { ImpersonationBanner } from "@/components/app/impersonation-banner";
import { NavLinks } from "@/components/app/nav-links";
import { UserMenu } from "@/components/app/user-menu";
import { Logo } from "@/components/icons";
import { ThemeToggle } from "@/components/theme-toggle";
import { Skeleton } from "@/components/ui/skeleton";
import { isAdmin, requireSession } from "@/lib/session";
import { site } from "@/lib/site";

export default function AppLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="flex min-h-dvh flex-col">
      <Suspense fallback={null}>
        <Impersonation />
      </Suspense>
      <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-5xl items-center gap-6 px-4 sm:px-6">
          <Link href="/dashboard" className="flex items-center gap-2 font-semibold tracking-tight">
            <Logo className="size-7" />
            <span className="hidden sm:inline">{site.name}</span>
          </Link>
          <Suspense fallback={<div className="flex-1" />}>
            <Nav />
          </Suspense>
          <ThemeToggle />
          <Suspense fallback={<Skeleton className="size-9 rounded-full" />}>
            <Account />
          </Suspense>
        </div>
      </header>
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 sm:px-6 sm:py-10">{children}</main>
    </div>
  );
}

async function Nav() {
  const { user } = await requireSession();
  return <NavLinks isAdmin={isAdmin(user.role)} />;
}

async function Account() {
  const { user } = await requireSession();
  return <UserMenu name={user.name} email={user.email} image={user.image} isAdmin={isAdmin(user.role)} />;
}

async function Impersonation() {
  const { session, user } = await requireSession();
  if (!session.impersonatedBy) return null;
  return <ImpersonationBanner email={user.email} />;
}
