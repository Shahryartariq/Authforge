"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import QRCode from "react-qr-code";
import { Copy, Download } from "lucide-react";
import { toast } from "sonner";
import { PasswordInput } from "@/components/auth/password-input";
import { Section } from "@/components/settings/section";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/ui/field";
import { FormAlert } from "@/components/form-alert";
import { authClient } from "@/lib/auth-client";
import { authErrorMessage } from "@/lib/auth-errors";
import { site } from "@/lib/site";
import { otpSchema } from "@/lib/validation";

type Step =
  | { kind: "idle" }
  | { kind: "password"; action: "enable" | "disable" | "codes" }
  | { kind: "scan"; totpURI: string; backupCodes: string[] }
  | { kind: "codes"; backupCodes: string[] };

export function TwoFactorSection({ enabled, hasPassword }: { enabled: boolean; hasPassword: boolean }) {
  const router = useRouter();
  const [step, setStep] = useState<Step>({ kind: "idle" });
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  const status = <Badge variant={enabled ? "success" : "secondary"}>{enabled ? "On" : "Off"}</Badge>;

  async function confirmPassword(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (step.kind !== "password") return;
    const password = String(new FormData(e.currentTarget).get("password") ?? "");
    if (!password) return setError("Enter your password");
    setError("");
    setPending(true);

    if (step.action === "enable") {
      const res = await authClient.twoFactor.enable({ password, issuer: site.name });
      setPending(false);
      if (res.error || !res.data || res.data.method !== "totp") return setError(authErrorMessage(res.error));
      setStep({ kind: "scan", totpURI: res.data.totpURI, backupCodes: res.data.backupCodes });
    } else if (step.action === "disable") {
      const res = await authClient.twoFactor.disable({ password });
      setPending(false);
      if (res.error) return setError(authErrorMessage(res.error));
      toast.success("Two-factor authentication turned off");
      setStep({ kind: "idle" });
      router.refresh();
    } else {
      const res = await authClient.twoFactor.generateBackupCodes({ password });
      setPending(false);
      if (res.error || !res.data) return setError(authErrorMessage(res.error));
      setStep({ kind: "codes", backupCodes: res.data.backupCodes });
    }
  }

  async function verify(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (step.kind !== "scan") return;
    const parsed = otpSchema.safeParse(new FormData(e.currentTarget).get("code"));
    if (!parsed.success) return setError(parsed.error.issues[0].message);
    setError("");
    setPending(true);
    const res = await authClient.twoFactor.verifyTotp({ code: parsed.data });
    setPending(false);
    if (res.error) return setError(authErrorMessage(res.error));
    toast.success("Two-factor authentication is on");
    setStep({ kind: "codes", backupCodes: step.backupCodes });
    router.refresh();
  }

  const cancel = () => {
    setError("");
    setStep({ kind: "idle" });
  };

  if (!hasPassword) {
    return (
      <Section
        title="Two-factor authentication"
        description={
          <span className="flex items-center gap-2">
            Set a password first. Two-factor protects password sign-ins. {status}
          </span>
        }
      />
    );
  }

  if (step.kind === "password") {
    const labels = { enable: "Continue", disable: "Turn off 2FA", codes: "Generate new codes" };
    return (
      <form onSubmit={confirmPassword} noValidate>
        <Section
          title="Two-factor authentication"
          description="Confirm your password to continue."
          footer={
            <>
              <Button size="sm" type="button" variant="ghost" onClick={cancel}>
                Cancel
              </Button>
              <Button size="sm" type="submit" loading={pending} variant={step.action === "disable" ? "destructive" : "default"}>
                {labels[step.action]}
              </Button>
            </>
          }
        >
          <div className="max-w-sm">
            <Field label="Password" htmlFor="tfa-password" error={error}>
              <PasswordInput id="tfa-password" name="password" autoComplete="current-password" autoFocus />
            </Field>
          </div>
        </Section>
      </form>
    );
  }

  if (step.kind === "scan") {
    const secret = new URL(step.totpURI).searchParams.get("secret") ?? "";
    return (
      <form onSubmit={verify} noValidate>
        <Section
          title="Set up your authenticator app"
          description="Scan the QR code with an app like Google Authenticator, 1Password or Authy, then enter the 6-digit code it shows."
          footer={
            <>
              <Button size="sm" type="button" variant="ghost" onClick={cancel}>
                Cancel
              </Button>
              <Button size="sm" type="submit" loading={pending}>
                Verify and turn on
              </Button>
            </>
          }
        >
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
            <div className="w-fit rounded-xl border bg-white p-3">
              <QRCode value={step.totpURI} size={164} />
            </div>
            <div className="flex flex-1 flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <p className="text-sm text-muted-foreground">Can&apos;t scan? Enter this key manually:</p>
                <div className="flex items-center gap-2">
                  <code className="break-all rounded-md bg-muted px-2 py-1 font-mono text-xs">{secret}</code>
                  <CopyButton value={secret} />
                </div>
              </div>
              <Field label="6-digit code" htmlFor="tfa-code" error={error}>
                <Input id="tfa-code" name="code" inputMode="numeric" autoComplete="one-time-code" maxLength={6} className="max-w-40 font-mono tracking-[0.3em]" autoFocus />
              </Field>
            </div>
          </div>
        </Section>
      </form>
    );
  }

  if (step.kind === "codes") {
    return (
      <Section
        title="Save your backup codes"
        description="Each code signs you in once if you lose your authenticator. Store them somewhere safe. You won't see them again."
        footer={
          <Button size="sm" onClick={cancel}>
            I&apos;ve saved them
          </Button>
        }
      >
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-2 rounded-xl border bg-muted/50 p-4 font-mono text-sm sm:grid-cols-5">
            {step.backupCodes.map((c) => (
              <span key={c}>{c}</span>
            ))}
          </div>
          <div className="flex gap-2">
            <CopyButton value={step.backupCodes.join("\n")} label="Copy codes" />
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                const blob = new Blob([`${site.name} backup codes\n\n${step.backupCodes.join("\n")}\n`], { type: "text/plain" });
                const a = document.createElement("a");
                a.href = URL.createObjectURL(blob);
                a.download = `${site.name.toLowerCase()}-backup-codes.txt`;
                a.click();
                URL.revokeObjectURL(a.href);
              }}
            >
              <Download /> Download
            </Button>
          </div>
        </div>
      </Section>
    );
  }

  return (
    <Section
      title="Two-factor authentication"
      description={
        <span className="flex flex-wrap items-center gap-2">
          {enabled
            ? "You'll be asked for a code from your authenticator app when you sign in with a password."
            : "Add a second step to password sign-ins with an authenticator app."}{" "}
          {status}
        </span>
      }
      footer={
        enabled ? (
          <>
            <Button size="sm" variant="outline" onClick={() => setStep({ kind: "password", action: "codes" })}>
              New backup codes
            </Button>
            <Button size="sm" variant="outline" onClick={() => setStep({ kind: "password", action: "disable" })}>
              Turn off
            </Button>
          </>
        ) : (
          <Button size="sm" onClick={() => setStep({ kind: "password", action: "enable" })}>
            Turn on 2FA
          </Button>
        )
      }
    >
      {enabled ? null : (
        <FormAlert variant="info">
          Recommended. It stops someone who learns your password from getting in.
        </FormAlert>
      )}
    </Section>
  );
}

function CopyButton({ value, label }: { value: string; label?: string }) {
  return (
    <Button
      size={label ? "sm" : "icon"}
      variant="outline"
      type="button"
      aria-label={label ?? "Copy"}
      onClick={async () => {
        await navigator.clipboard.writeText(value);
        toast.success("Copied");
      }}
    >
      <Copy /> {label}
    </Button>
  );
}
