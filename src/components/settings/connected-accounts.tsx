"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { GitHubIcon, GoogleIcon } from "@/components/icons";
import { Section } from "@/components/settings/section";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { authClient } from "@/lib/auth-client";
import { authErrorMessage } from "@/lib/auth-errors";
import type { EnabledProviders } from "@/lib/env";

const PROVIDERS = [
  { id: "google", label: "Google", Icon: GoogleIcon },
  { id: "github", label: "GitHub", Icon: GitHubIcon },
] as const;

export function ConnectedAccounts({
  enabled,
  linked,
}: {
  enabled: EnabledProviders;
  linked: { providerId: string; id: string }[];
}) {
  const router = useRouter();
  const [pending, setPending] = useState<string | null>(null);
  const available = PROVIDERS.filter((p) => enabled[p.id]);
  const methodCount = linked.length;

  if (available.length === 0) {
    return (
      <Section
        title="Connected accounts"
        description="Google and GitHub sign-in aren't configured on this deployment. Add their client ID and secret to the environment to enable them."
      />
    );
  }

  async function link(provider: (typeof PROVIDERS)[number]["id"]) {
    setPending(provider);
    const res = await authClient.linkSocial({ provider, callbackURL: "/settings" });
    if (res.error) {
      setPending(null);
      toast.error(authErrorMessage(res.error));
    }
  }

  async function unlink(providerId: string, accountId: string) {
    setPending(providerId);
    const res = await authClient.unlinkAccount({ accountId });
    setPending(null);
    if (res.error) return toast.error(authErrorMessage(res.error));
    toast.success("Account disconnected");
    router.refresh();
  }

  return (
    <Section title="Connected accounts" description="Sign in with these accounts as well as your email.">
      <div className="flex flex-col gap-3">
        {available.map(({ id, label, Icon }) => {
          const account = linked.find((l) => l.providerId === id);
          return (
            <div key={id} className="flex items-center gap-3 rounded-lg border px-3 py-2.5">
              <Icon className="size-5" />
              <span className="flex-1 text-sm font-medium">{label}</span>
              {account ? (
                <>
                  <Badge variant="success">Connected</Badge>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => unlink(id, account.id)}
                    loading={pending === id}
                    disabled={methodCount <= 1}
                    title={methodCount <= 1 ? "You need at least one way to sign in" : undefined}
                  >
                    Disconnect
                  </Button>
                </>
              ) : (
                <Button size="sm" variant="outline" onClick={() => link(id)} loading={pending === id}>
                  Connect
                </Button>
              )}
            </div>
          );
        })}
      </div>
    </Section>
  );
}
