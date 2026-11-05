"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { PasswordInput } from "@/components/auth/password-input";
import { Button } from "@/components/ui/button";
import { Alert, Field, Input } from "@/components/ui/primitives";
import { authClient } from "@/lib/auth-client";
import { authErrorMessage } from "@/lib/auth-errors";
import { emailSchema, fieldErrors, resetPasswordSchema } from "@/lib/validation";

export function ForgotPasswordForm() {
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const [sent, setSent] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const parsed = emailSchema.safeParse(new FormData(e.currentTarget).get("email"));
    if (!parsed.success) return setError(parsed.error.issues[0].message);
    setError("");
    setPending(true);
    const res = await authClient.requestPasswordReset({ email: parsed.data, redirectTo: "/reset-password" });
    setPending(false);
    // Always show the same message so the form can't be used to discover accounts.
    if (res.error?.status === 429) return setError(authErrorMessage(res.error));
    setSent(true);
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1.5">
        <h1 className="text-2xl font-semibold tracking-tight">Reset your password</h1>
        <p className="text-sm text-muted-foreground">Enter your email and we&apos;ll send you a reset link.</p>
      </div>
      {sent ? (
        <Alert tone="success">If an account exists for that email, a reset link is on its way. It expires in 1 hour.</Alert>
      ) : (
        <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
          <Field label="Email" htmlFor="email" error={error}>
            <Input id="email" name="email" type="email" autoComplete="email" placeholder="you@example.com" aria-invalid={Boolean(error)} />
          </Field>
          <Button type="submit" loading={pending}>
            Send reset link
          </Button>
        </form>
      )}
      <Link href="/sign-in" className="text-center text-sm text-muted-foreground hover:text-foreground">
        Back to sign in
      </Link>
    </div>
  );
}

export function ResetPasswordForm() {
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get("token");
  const linkError = params.get("error");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState("");
  const [pending, setPending] = useState(false);

  if (!token || linkError) {
    return (
      <div className="flex flex-col gap-6">
        <h1 className="text-2xl font-semibold tracking-tight">Link expired</h1>
        <Alert>This reset link is invalid or has expired. Request a new one to continue.</Alert>
        <Link href="/forgot-password" className="text-sm font-medium underline-offset-4 hover:underline">
          Request a new link
        </Link>
      </div>
    );
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFormError("");
    const parsed = resetPasswordSchema.safeParse(Object.fromEntries(new FormData(e.currentTarget)));
    if (!parsed.success) return setErrors(fieldErrors(parsed.error));
    setErrors({});
    setPending(true);
    const { error } = await authClient.resetPassword({ newPassword: parsed.data.password, token: token! });
    setPending(false);
    if (error) return setFormError(authErrorMessage(error));
    toast.success("Password updated. Sign in with your new password.");
    router.push("/sign-in");
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1.5">
        <h1 className="text-2xl font-semibold tracking-tight">Choose a new password</h1>
        <p className="text-sm text-muted-foreground">You&apos;ll be signed out on all other devices.</p>
      </div>
      <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
        {formError && <Alert>{formError}</Alert>}
        <Field label="New password" htmlFor="password" error={errors.password}>
          <PasswordInput id="password" name="password" autoComplete="new-password" showStrength aria-invalid={Boolean(errors.password)} />
        </Field>
        <Field label="Confirm password" htmlFor="confirmPassword" error={errors.confirmPassword}>
          <PasswordInput id="confirmPassword" name="confirmPassword" autoComplete="new-password" aria-invalid={Boolean(errors.confirmPassword)} />
        </Field>
        <Button type="submit" loading={pending}>
          Update password
        </Button>
      </form>
    </div>
  );
}
