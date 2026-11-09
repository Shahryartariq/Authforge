"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Laptop, Smartphone } from "lucide-react";
import { toast } from "sonner";
import { Section } from "@/components/settings/section";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { authClient } from "@/lib/auth-client";
import { authErrorMessage } from "@/lib/auth-errors";
import { describeUserAgent } from "@/lib/user-agent";

type SessionRow = {
  id: string;
  token: string;
  userAgent: string | null;
  ipAddress: string | null;
  createdAt: string;
  updatedAt: string;
};

export function SessionsSection({ sessions, currentId }: { sessions: SessionRow[]; currentId: string }) {
  const router = useRouter();
  const [pending, setPending] = useState<string | null>(null);
  const others = sessions.filter((s) => s.id !== currentId);
  const sorted = [...sessions].sort((a, b) => (a.id === currentId ? -1 : b.id === currentId ? 1 : b.updatedAt.localeCompare(a.updatedAt)));

  async function revoke(token: string, id: string) {
    setPending(id);
    const res = await authClient.revokeSession({ token });
    setPending(null);
    if (res.error) return toast.error(authErrorMessage(res.error));
    toast.success("Session signed out");
    router.refresh();
  }

  async function revokeOthers() {
    setPending("others");
    const res = await authClient.revokeOtherSessions();
    setPending(null);
    if (res.error) return toast.error(authErrorMessage(res.error));
    toast.success("Signed out of all other sessions");
    router.refresh();
  }

  return (
    <Section
      title="Active sessions"
      description="Devices where you're signed in. Sign out of any you don't recognise."
      footer={
        others.length > 0 && (
          <Button size="sm" variant="outline" onClick={revokeOthers} loading={pending === "others"}>
            Sign out of all other sessions
          </Button>
        )
      }
    >
      <div className="flex flex-col gap-3">
        {sorted.map((s) => {
          const ua = describeUserAgent(s.userAgent);
          const Icon = ua.mobile ? Smartphone : Laptop;
          const current = s.id === currentId;
          return (
            <div key={s.id} className="flex items-center gap-3 rounded-lg border px-3 py-2.5">
              <Icon className="size-5 text-muted-foreground" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">
                  {ua.browser} on {ua.os}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {s.ipAddress || "Unknown IP"} · Last active{" "}
                  {new Date(s.updatedAt).toLocaleString("en", { dateStyle: "medium", timeStyle: "short" })}
                </p>
              </div>
              {current ? (
                <Badge variant="brand">This device</Badge>
              ) : (
                <Button size="sm" variant="ghost" onClick={() => revoke(s.token, s.id)} loading={pending === s.id}>
                  Sign out
                </Button>
              )}
            </div>
          );
        })}
      </div>
    </Section>
  );
}
