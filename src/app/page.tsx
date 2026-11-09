import Link from "next/link";
import { ArrowRight, Fingerprint, KeyRound, Mail, ShieldCheck, Users, Zap } from "lucide-react";
import { GitHubIcon, GoogleIcon, Logo } from "@/components/icons";
import { ThemeToggle } from "@/components/theme-toggle";
import { SignInButton } from "@/components/auth/sign-in-button";
import { Button, buttonVariants } from "@/components/ui/button";
import { providers } from "@/lib/env";
import { site } from "@/lib/site";
import { cn } from "@/lib/utils";

const features = [
  {
    icon: Mail,
    title: "Email and password",
    body: "Verified sign-ups, password reset links, breached-password checks and strength hints.",
  },
  {
    icon: KeyRound,
    title: "Google and GitHub",
    body: "One-click social sign-in with safe account linking when the email matches.",
  },
  {
    icon: ShieldCheck,
    title: "Two-factor",
    body: "Authenticator-app codes, single-use backup codes, trusted devices and lockout after failed tries.",
  },
  {
    icon: Fingerprint,
    title: "Passkeys",
    body: "Face ID, Touch ID, Windows Hello and security keys, including browser autofill.",
  },
  {
    icon: Users,
    title: "Roles and admin panel",
    body: "Search users, change roles, ban, revoke sessions and impersonate to debug.",
  },
  {
    icon: Zap,
    title: "Production defaults",
    body: "Rate limits, secure cookies, session revocation, security headers and typed env validation.",
  },
];

const stack = ["Next.js 16", "TypeScript", "Better Auth", "Drizzle or Prisma", "PostgreSQL", "shadcn/ui", "Resend", "Tailwind CSS"];

export default function Home() {
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="mx-auto flex w-full max-w-5xl items-center justify-between px-4 py-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
          <Logo className="size-7" />
          {site.name}
        </Link>
        <nav className="flex items-center gap-1">
          <a href={site.repo} className={buttonVariants({ variant: "ghost", size: "icon" })} aria-label="GitHub repository">
            <GitHubIcon className="size-5" />
          </a>
          <ThemeToggle />
          <SignInButton providers={providers}>
            <Button variant="ghost">Sign in</Button>
          </SignInButton>
        </nav>
      </header>

      <main className="flex-1">
        <section className="mx-auto flex max-w-5xl flex-col items-center px-4 pb-16 pt-16 text-center sm:px-6 sm:pt-24">
          <span className="mb-6 inline-flex items-center gap-2 rounded-full border bg-card px-3 py-1 text-xs text-muted-foreground">
            <span className="size-1.5 rounded-full bg-success" /> Open source starter for Next.js
          </span>
          <h1 className="max-w-3xl text-balance text-4xl font-semibold tracking-tight sm:text-6xl">
            Authentication you can ship on day one.
          </h1>
          <p className="mt-5 max-w-2xl text-balance text-lg text-muted-foreground">
            {site.name} gives every new project email and password, Google and GitHub, two-factor, passkeys and an
            admin panel. Clone it, set a few environment variables and start building your actual product.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link href="/sign-up" className={buttonVariants({ size: "lg" })}>
              Try the live demo <ArrowRight />
            </Link>
            <a href={site.repo} className={buttonVariants({ size: "lg", variant: "outline" })}>
              <GitHubIcon /> View on GitHub
            </a>
          </div>
          <div className="mt-6 flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <GoogleIcon className="size-3.5" /> Google
            </span>
            <span className="flex items-center gap-1.5">
              <GitHubIcon className="size-3.5" /> GitHub
            </span>
            <span className="flex items-center gap-1.5">
              <Fingerprint className="size-3.5" /> Passkeys
            </span>
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="size-3.5" /> 2FA
            </span>
          </div>
        </section>

        <section className="mx-auto max-w-5xl px-4 pb-20 sm:px-6">
          <div className="grid gap-px overflow-hidden rounded-2xl border bg-border sm:grid-cols-2 lg:grid-cols-3">
            {features.map(({ icon: Icon, title, body }) => (
              <div key={title} className="flex flex-col gap-3 bg-card p-6">
                <span className="flex size-9 items-center justify-center rounded-lg bg-brand-soft text-brand">
                  <Icon className="size-4.5" />
                </span>
                <h2 className="font-semibold tracking-tight">{title}</h2>
                <p className="text-sm leading-relaxed text-muted-foreground">{body}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-5xl px-4 pb-24 sm:px-6">
          <div className="flex flex-col items-start gap-6 rounded-2xl border bg-card p-6 sm:p-10 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-col gap-2">
              <h2 className="text-xl font-semibold tracking-tight">Start a new project with it</h2>
              <p className="text-sm text-muted-foreground">Three commands to a working auth system on your machine.</p>
            </div>
            <pre className="w-full overflow-x-auto rounded-xl bg-muted px-4 py-3 font-mono text-[13px] leading-6 lg:w-auto">
{`npx degit Shahryartariq/authforge my-app
cd my-app && pnpm install
pnpm env:setup && pnpm dev`}
            </pre>
          </div>
          <div className="mt-6 flex flex-wrap gap-2">
            {stack.map((s) => (
              <span key={s} className={cn("rounded-full border px-3 py-1 text-xs text-muted-foreground")}>
                {s}
              </span>
            ))}
          </div>
        </section>
      </main>

      <footer className="border-t">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-2 px-4 py-6 text-xs text-muted-foreground sm:px-6">
          <span>
            {site.name} · MIT licensed
          </span>
          <span>
            Built by{" "}
            <a href="https://github.com/Shahryartariq" className="text-foreground hover:underline">
              Shahryar Tariq
            </a>
          </span>
        </div>
      </footer>
    </div>
  );
}
