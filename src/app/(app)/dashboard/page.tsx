import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { headers } from "next/headers";
import { ArrowRight, BadgeCheck, Fingerprint, KeyRound, Link2, ShieldCheck, ShieldAlert } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { auth } from "@/lib/auth";
import { emailFeatures } from "@/lib/env";
import { isAdmin, requireSession } from "@/lib/session";

export const metadata: Metadata = { title: "Dashboard" };

export default function DashboardPage() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <Dashboard />
    </Suspense>
  );
}

async function Dashboard() {
  const { user } = await requireSession("/dashboard");
  const h = await headers();
  const [accounts, passkeys] = await Promise.all([
    auth.api.listUserAccounts({ headers: h }),
    auth.api.listPasskeys({ headers: h }),
  ]);

  const providers = accounts.map((a) => a.providerId);
  const hasPassword = providers.includes("credential");
  const social = providers.filter((p) => p !== "credential");
  const twoFactor = Boolean(user.twoFactorEnabled);
  const checks = [
    ...(emailFeatures.verificationRequired ? [{ done: user.emailVerified, label: "Verify your email" }] : []),
    { done: twoFactor, label: "Turn on two-factor authentication" },
    { done: passkeys.length > 0, label: "Add a passkey" },
  ];
  const score = checks.filter((c) => c.done).length;

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-semibold tracking-tight">Hi, {user.name.split(" ")[0]}</h1>
          {isAdmin(user.role) && <Badge variant="brand">Admin</Badge>}
        </div>
        <p className="text-sm text-muted-foreground">Here&apos;s an overview of your account security.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat icon={BadgeCheck} label="Email" value={user.emailVerified ? "Verified" : "Unverified"} ok={user.emailVerified} />
        <Stat icon={twoFactor ? ShieldCheck : ShieldAlert} label="Two-factor" value={twoFactor ? "On" : "Off"} ok={twoFactor} />
        <Stat icon={Fingerprint} label="Passkeys" value={String(passkeys.length)} ok={passkeys.length > 0} />
        <Stat icon={Link2} label="Sign-in methods" value={String(providers.length + passkeys.length)} ok />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Security checklist</CardTitle>
            <CardDescription>
              {score === checks.length ? "Your account is well protected." : `${score} of ${checks.length} done.`}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            <div className="mb-2 h-1.5 overflow-hidden rounded-full bg-muted">
              <div className="h-full rounded-full bg-success transition-all" style={{ width: `${(score / checks.length) * 100}%` }} />
            </div>
            {checks.map((c) => (
              <div key={c.label} className="flex items-center justify-between rounded-lg border px-3 py-2.5 text-sm">
                <span className={c.done ? "text-muted-foreground line-through" : ""}>{c.label}</span>
                {c.done ? (
                  <Badge variant="success">Done</Badge>
                ) : (
                  <Link href="/settings#security" className="inline-flex items-center gap-1 text-brand hover:underline">
                    Set up <ArrowRight className="size-3.5" />
                  </Link>
                )}
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Your account</CardTitle>
            <CardDescription>Signed in as {user.email}</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 text-sm">
            <Row label="Role" value={<Badge>{user.role ?? "user"}</Badge>} />
            <Row label="Password" value={hasPassword ? "Set" : "Not set"} />
            <Row
              label="Linked"
              value={
                social.length ? social.map((p) => <Badge key={p} className="capitalize">{p}</Badge>) : null
              }
            />
            <Row label="Member since" value={new Date(user.createdAt).toLocaleDateString("en", { dateStyle: "medium" })} />
            <Link href="/settings" className="mt-2 inline-flex items-center gap-1 text-brand hover:underline">
              <KeyRound className="size-4" /> Manage security settings
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Stat({ icon: Icon, label, value, ok }: { icon: React.ElementType; label: string; value: string; ok: boolean }) {
  return (
    <Card className="flex-row items-center gap-3 p-4">
      <span className={`flex size-10 items-center justify-center rounded-lg ${ok ? "bg-success-soft text-success" : "bg-destructive-soft text-destructive"}`}>
        <Icon className="size-5" />
      </span>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="font-semibold">{value}</p>
      </div>
    </Card>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-muted-foreground">{label}</span>
      <span className="flex flex-wrap justify-end gap-1">{value || <span className="text-muted-foreground">None</span>}</span>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="flex flex-col gap-8">
      <Skeleton className="h-8 w-48" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-[74px]" />
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <Skeleton className="h-72" />
        <Skeleton className="h-72" />
      </div>
    </div>
  );
}
