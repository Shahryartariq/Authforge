"use client";

import { useState, useSyncExternalStore } from "react";
import { toast } from "sonner";
import { GitHubIcon, GoogleIcon } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { authClient } from "@/lib/auth-client";
import { authErrorMessage } from "@/lib/auth-errors";
import type { EnabledProviders } from "@/lib/env";

const PROVIDERS = [
  { id: "google", label: "Google", Icon: GoogleIcon },
  { id: "github", label: "GitHub", Icon: GitHubIcon },
] as const;

const noopSubscribe = () => () => {};

export function SocialButtons({
  providers,
  callbackURL,
}: {
  providers: EnabledProviders;
  callbackURL: string;
}) {
  const [pending, setPending] = useState<string | null>(null);
  // Read the "last used" cookie on the client only, without a hydration mismatch.
  const lastUsed = useSyncExternalStore(
    noopSubscribe,
    () => authClient.getLastUsedLoginMethod(),
    () => null,
  );

  const enabled = PROVIDERS.filter((p) => providers[p.id]);
  if (enabled.length === 0) return null;

  async function go(provider: (typeof PROVIDERS)[number]["id"]) {
    setPending(provider);
    const { error } = await authClient.signIn.social({
      provider,
      callbackURL,
      errorCallbackURL: "/sign-in",
    });
    if (error) {
      toast.error(authErrorMessage(error));
      setPending(null);
    }
  }

  return (
    <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${enabled.length}, minmax(0, 1fr))` }}>
      {enabled.map(({ id, label, Icon }) => (
        <Button
          key={id}
          type="button"
          variant="outline"
          className="relative"
          loading={pending === id}
          disabled={pending !== null}
          onClick={() => go(id)}
        >
          {pending !== id && <Icon />}
          {label}
          {lastUsed === id && (
            <Badge variant="brand" className="absolute -top-2 right-2 px-1.5 py-0 text-[10px]">
              Last used
            </Badge>
          )}
        </Button>
      ))}
    </div>
  );
}
