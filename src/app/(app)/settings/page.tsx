import type { Metadata } from "next";
import { Suspense } from "react";
import { headers } from "next/headers";
import { ConnectedAccounts } from "@/components/settings/connected-accounts";
import { DeleteAccount } from "@/components/settings/delete-account";
import { PasskeysSection } from "@/components/settings/passkeys";
import { PasswordSection } from "@/components/settings/password";
import { ProfileForm } from "@/components/settings/profile";
import { SessionsSection } from "@/components/settings/sessions";
import { TwoFactorSection } from "@/components/settings/two-factor";
import { Skeleton } from "@/components/ui/primitives";
import { auth } from "@/lib/auth";
import { providers } from "@/lib/env";
import { requireSession } from "@/lib/session";

export const metadata: Metadata = { title: "Settings" };

export default function SettingsPage() {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground">Manage your profile, sign-in methods and security.</p>
      </div>
      <Suspense fallback={<SettingsSkeleton />}>
        <Settings />
      </Suspense>
    </div>
  );
}

async function Settings() {
  const { user, session } = await requireSession("/settings");
  const h = await headers();
  const [accounts, sessions, passkeys] = await Promise.all([
    auth.api.listUserAccounts({ headers: h }),
    auth.api.listSessions({ headers: h }),
    auth.api.listPasskeys({ headers: h }),
  ]);
  const hasPassword = accounts.some((a) => a.providerId === "credential");

  return (
    <div className="flex flex-col gap-6">
      <ProfileForm name={user.name} email={user.email} />
      <div id="security" className="flex scroll-mt-20 flex-col gap-6">
        <PasswordSection hasPassword={hasPassword} email={user.email} />
        <TwoFactorSection enabled={Boolean(user.twoFactorEnabled)} hasPassword={hasPassword} />
        <PasskeysSection
          passkeys={passkeys.map((p) => ({
            id: p.id,
            name: p.name ?? null,
            createdAt: p.createdAt ? new Date(p.createdAt).toISOString() : null,
            deviceType: p.deviceType,
            backedUp: p.backedUp,
          }))}
        />
      </div>
      <ConnectedAccounts
        enabled={providers}
        linked={accounts.map((a) => ({ providerId: a.providerId, id: a.id }))}
      />
      <SessionsSection
        currentId={session.id}
        sessions={sessions.map((s) => ({
          id: s.id,
          token: s.token,
          userAgent: s.userAgent ?? null,
          ipAddress: s.ipAddress ?? null,
          createdAt: new Date(s.createdAt).toISOString(),
          updatedAt: new Date(s.updatedAt).toISOString(),
        }))}
      />
      <DeleteAccount hasPassword={hasPassword} />
    </div>
  );
}

function SettingsSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      {[0, 1, 2, 3].map((i) => (
        <Skeleton key={i} className="h-40" />
      ))}
    </div>
  );
}
