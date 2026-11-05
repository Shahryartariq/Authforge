"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";

export function ImpersonationBanner({ email }: { email: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function stop() {
    setPending(true);
    await authClient.admin.stopImpersonating();
    router.push("/admin");
    router.refresh();
  }

  return (
    <div className="flex flex-wrap items-center justify-center gap-3 bg-amber-500 px-4 py-2 text-sm font-medium text-amber-950">
      You&apos;re signed in as {email} (impersonation).
      <Button size="sm" variant="outline" className="border-amber-950/20 bg-amber-50 text-amber-950 hover:bg-amber-100" onClick={stop} loading={pending}>
        Stop impersonating
      </Button>
    </div>
  );
}
