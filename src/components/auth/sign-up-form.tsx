"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { MailCheck } from "lucide-react";
import { PasswordInput } from "@/components/auth/password-input";
import { SocialButtons } from "@/components/auth/social-buttons";
import { Button } from "@/components/ui/button";
import { Alert, Field, Input, Separator } from "@/components/ui/primitives";
import { authClient } from "@/lib/auth-client";
import { authErrorMessage } from "@/lib/auth-errors";
import type { EmailFeatures, EnabledProviders } from "@/lib/env";
import { safeRedirect } from "@/lib/utils";
import { fieldErrors, signUpSchema } from "@/lib/validation";

export function SignUpForm({
  providers,
  email: emailFeatures,
}: {
  providers: EnabledProviders;
  email: EmailFeatures;
}) {
  const router = useRouter();
  const params = useSearchParams();
  const callbackURL = safeRedirect(params.get("callbackURL"));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState("");
  const [pending, setPending] = useState(false);
  const [sentTo, setSentTo] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFormError("");
    const parsed = signUpSchema.safeParse(Object.fromEntries(new FormData(e.currentTarget)));
    if (!parsed.success) return setErrors(fieldErrors(parsed.error));
    setErrors({});

    setPending(true);
    const { name, email, password } = parsed.data;
    const { error } = await authClient.signUp.email({
      name,
      email,
      password,
      callbackURL: `/verify-email?next=${encodeURIComponent(callbackURL)}`,
    });
    if (error) {
      setPending(false);
      return setFormError(authErrorMessage(error));
    }
    if (!emailFeatures.verificationRequired) {
      // Demo mode: the account is active and signed in right away.
      router.push(callbackURL);
      router.refresh();
      return;
    }
    setPending(false);
    setSentTo(email);
  }

  if (sentTo) return <CheckInbox email={sentTo} callbackURL={callbackURL} />;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1.5">
        <h1 className="text-2xl font-semibold tracking-tight">Create your account</h1>
        <p className="text-sm text-muted-foreground">It takes less than a minute.</p>
      </div>

      {!emailFeatures.verificationRequired && (
        <p className="rounded-lg border border-dashed px-3 py-2 text-[13px] text-muted-foreground">
          Demo mode: email verification is off on this deployment, so you can sign in right after creating an
          account. Use any email; no messages are sent.
        </p>
      )}

      <SocialButtons providers={providers} callbackURL={callbackURL} />
      {(providers.google || providers.github) && <Separator label="or" />}

      <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
        {formError && <Alert>{formError}</Alert>}

        <Field label="Name" htmlFor="name" error={errors.name}>
          <Input id="name" name="name" autoComplete="name" placeholder="Ada Lovelace" aria-invalid={Boolean(errors.name)} />
        </Field>
        <Field label="Email" htmlFor="email" error={errors.email}>
          <Input id="email" name="email" type="email" autoComplete="email" placeholder="you@example.com" aria-invalid={Boolean(errors.email)} />
        </Field>
        <Field label="Password" htmlFor="password" error={errors.password} hint="At least 8 characters. A passphrase works well.">
          <PasswordInput id="password" name="password" autoComplete="new-password" showStrength aria-invalid={Boolean(errors.password)} />
        </Field>
        <Field label="Confirm password" htmlFor="confirmPassword" error={errors.confirmPassword}>
          <PasswordInput id="confirmPassword" name="confirmPassword" autoComplete="new-password" aria-invalid={Boolean(errors.confirmPassword)} />
        </Field>

        <Button type="submit" loading={pending}>
          Create account
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link href="/sign-in" className="font-medium text-foreground underline-offset-4 hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}

export function CheckInbox({ email, callbackURL = "/dashboard" }: { email: string; callbackURL?: string }) {
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");

  async function resend() {
    setState("sending");
    const { error } = await authClient.sendVerificationEmail({
      email,
      callbackURL: `/verify-email?next=${encodeURIComponent(callbackURL)}`,
    });
    setState(error ? "error" : "sent");
  }

  return (
    <div className="flex flex-col items-start gap-5">
      <span className="flex size-11 items-center justify-center rounded-full bg-accent-soft text-accent">
        <MailCheck className="size-5" />
      </span>
      <div className="flex flex-col gap-1.5">
        <h1 className="text-2xl font-semibold tracking-tight">Check your inbox</h1>
        <p className="text-sm text-muted-foreground">
          We sent a verification link to <span className="font-medium text-foreground">{email}</span>. Open it to
          activate your account. The link expires in 1 hour.
        </p>
      </div>
      {state === "sent" && <Alert tone="success">A new link is on its way.</Alert>}
      {state === "error" && <Alert>Couldn&apos;t resend right now. Please wait a minute and try again.</Alert>}
      <div className="flex gap-2">
        <Button variant="outline" onClick={resend} loading={state === "sending"} disabled={state === "sent"}>
          Resend email
        </Button>
        <Link href="/sign-in" className="inline-flex h-10 items-center px-3 text-sm text-muted-foreground hover:text-foreground">
          Back to sign in
        </Link>
      </div>
    </div>
  );
}
