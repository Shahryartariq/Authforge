"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Fingerprint, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Section } from "@/components/settings/section";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/ui/field";
import { authClient } from "@/lib/auth-client";
import { authErrorMessage } from "@/lib/auth-errors";

type Passkey = { id: string; name: string | null; createdAt: string | null; deviceType: string; backedUp: boolean };

export function PasskeysSection({ passkeys }: { passkeys: Passkey[] }) {
  const router = useRouter();
  const [adding, setAdding] = useState(false);
  const [pending, setPending] = useState<string | null>(null);

  async function add(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const name = String(new FormData(e.currentTarget).get("name") ?? "").trim() || defaultName();
    setPending("add");
    const res = await authClient.passkey.addPasskey({ name });
    setPending(null);
    if (res?.error) return toast.error(authErrorMessage(res.error, "Passkey setup was cancelled."));
    toast.success("Passkey added");
    setAdding(false);
    router.refresh();
  }

  async function remove(id: string) {
    setPending(id);
    const res = await authClient.passkey.deletePasskey({ id });
    setPending(null);
    if (res.error) return toast.error(authErrorMessage(res.error));
    toast.success("Passkey removed");
    router.refresh();
  }

  return (
    <Section
      title="Passkeys"
      description="Sign in with Face ID, Touch ID, Windows Hello or a security key. Faster than a password and can't be phished."
      footer={
        !adding && (
          <Button size="sm" onClick={() => setAdding(true)}>
            <Plus /> Add a passkey
          </Button>
        )
      }
    >
      <div className="flex flex-col gap-3">
        {passkeys.length === 0 && !adding && <p className="text-sm text-muted-foreground">No passkeys yet.</p>}
        {passkeys.map((p) => (
          <div key={p.id} className="flex items-center gap-3 rounded-lg border px-3 py-2.5">
            <Fingerprint className="size-5 text-muted-foreground" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{p.name || "Passkey"}</p>
              <p className="text-xs text-muted-foreground">
                {p.createdAt ? `Added ${new Date(p.createdAt).toLocaleDateString("en", { dateStyle: "medium" })}` : "Added"}
                {p.backedUp && " · Synced"}
              </p>
            </div>
            {p.deviceType === "multiDevice" && <Badge className="hidden sm:inline-flex">Multi-device</Badge>}
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button size="icon" variant="ghost" aria-label={`Remove ${p.name || "passkey"}`} loading={pending === p.id}>
                  {pending !== p.id && <Trash2 />}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Remove {p.name || "this passkey"}?</AlertDialogTitle>
                  <AlertDialogDescription>You won&apos;t be able to sign in with it anymore.</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction variant="destructive" onClick={() => remove(p.id)}>
                    Remove passkey
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        ))}
        {adding && (
          <form onSubmit={add} className="flex flex-col gap-3 rounded-lg border border-dashed p-4 sm:flex-row sm:items-end">
            <div className="flex-1">
              <Field label="Name this passkey" htmlFor="passkey-name" hint="So you can tell your devices apart.">
                <Input id="passkey-name" name="name" placeholder={defaultName()} autoFocus />
              </Field>
            </div>
            <div className="flex gap-2 sm:pb-6">
              <Button type="button" variant="ghost" onClick={() => setAdding(false)}>
                Cancel
              </Button>
              <Button type="submit" loading={pending === "add"}>
                Create passkey
              </Button>
            </div>
          </form>
        )}
      </div>
    </Section>
  );
}

function defaultName() {
  if (typeof navigator === "undefined") return "My passkey";
  const ua = navigator.userAgent;
  if (/iPhone|iPad/.test(ua)) return "iPhone";
  if (/Mac/.test(ua)) return "Mac";
  if (/Android/.test(ua)) return "Android phone";
  if (/Windows/.test(ua)) return "Windows PC";
  return "My passkey";
}
