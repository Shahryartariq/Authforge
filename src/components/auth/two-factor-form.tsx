"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Field } from "@/components/ui/field";
import { FormAlert } from "@/components/form-alert";
import { authClient } from "@/lib/auth-client";
import { authErrorMessage } from "@/lib/auth-errors";
import { safeRedirect } from "@/lib/utils";
import { otpSchema } from "@/lib/validation";

export function TwoFactorForm() {
  const router = useRouter();
  const params = useSearchParams();
  const callbackURL = safeRedirect(params.get("callbackURL"));
  const [mode, setMode] = useState<"totp" | "backup">("totp");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const raw = String(form.get("code") ?? "").replace(/\s/g, "");
    const trustDevice = form.get("trustDevice") === "on";

    let result;
    if (mode === "totp") {
      const parsed = otpSchema.safeParse(raw);
      if (!parsed.success) return setError(parsed.error.issues[0].message);
      setError("");
      setPending(true);
      result = await authClient.twoFactor.verifyTotp({ code: parsed.data, trustDevice });
    } else {
      if (raw.length < 6) return setError("Enter one of your backup codes");
      setError("");
      setPending(true);
      result = await authClient.twoFactor.verifyBackupCode({ code: raw, trustDevice });
    }

    if (result.error) {
      setPending(false);
      return setError(authErrorMessage(result.error));
    }
    router.push(callbackURL);
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-6">
      <span className="flex size-11 items-center justify-center rounded-full bg-brand-soft text-brand">
        <ShieldCheck className="size-5" />
      </span>
      <div className="flex flex-col gap-1.5">
        <h1 className="text-2xl font-semibold tracking-tight">Two-factor authentication</h1>
        <p className="text-sm text-muted-foreground">
          {mode === "totp"
            ? "Enter the 6-digit code from your authenticator app."
            : "Enter one of the backup codes you saved when you turned on 2FA. Each code works once."}
        </p>
      </div>

      <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate key={mode}>
        {error && <FormAlert>{error}</FormAlert>}
        <Field label={mode === "totp" ? "Authentication code" : "Backup code"} htmlFor="code">
          <Input
            id="code"
            name="code"
            autoFocus
            autoComplete="one-time-code"
            inputMode={mode === "totp" ? "numeric" : "text"}
            maxLength={mode === "totp" ? 6 : 32}
            placeholder={mode === "totp" ? "123456" : "xxxxx-xxxxx"}
            className="font-mono tracking-[0.3em]"
          />
        </Field>
        <div className="flex items-center gap-2">
          <Checkbox id="trustDevice" name="trustDevice" />
          <Label htmlFor="trustDevice" className="font-normal text-muted-foreground">
            Trust this device for 30 days
          </Label>
        </div>
        <Button type="submit" loading={pending}>
          Verify
        </Button>
      </form>

      <div className="flex items-center justify-between text-sm">
        <button
          type="button"
          className="text-muted-foreground hover:text-foreground"
          onClick={() => {
            setError("");
            setMode((m) => (m === "totp" ? "backup" : "totp"));
          }}
        >
          {mode === "totp" ? "Use a backup code" : "Use your authenticator app"}
        </button>
        <Link href="/sign-in" className="text-muted-foreground hover:text-foreground">
          Cancel
        </Link>
      </div>
    </div>
  );
}
