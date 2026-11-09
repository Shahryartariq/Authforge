"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { KeyRound } from "lucide-react";
import { PasswordInput } from "@/components/auth/password-input";
import { SocialButtons } from "@/components/auth/social-buttons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/ui/field";
import { FormAlert } from "@/components/form-alert";
import { OrDivider } from "@/components/auth/or-divider";
import { authClient } from "@/lib/auth-client";
import { authErrorMessage } from "@/lib/auth-errors";
import type { EnabledProviders } from "@/lib/env";
import { safeRedirect } from "@/lib/utils";
import { fieldErrors, signInSchema } from "@/lib/validation";

/** The /sign-in page: reads callbackURL and error from the URL. */
export function SignInForm({ providers }: { providers: EnabledProviders }) {
  const params = useSearchParams();
  return (
    <SignInPanel
      providers={providers}
      callbackURL={safeRedirect(params.get("callbackURL"))}
      initialError={params.get("error") ? "Sign-in failed. Please try again." : ""}
      passkeyAutofill
    />
  );
}

/**
 * The sign-in form itself, shared by the /sign-in page and the sign-in popup.
 * `showHeader={false}` lets a dialog render its own accessible title.
 * `onNavigate` runs just before a successful sign-in leaves the page.
 */
export function SignInPanel({
  providers,
  callbackURL,
  initialError = "",
  showHeader = true,
  passkeyAutofill = false,
  onNavigate,
}: {
  providers: EnabledProviders;
  callbackURL: string;
  initialError?: string;
  showHeader?: boolean;
  passkeyAutofill?: boolean;
  onNavigate?: () => void;
}) {
  const router = useRouter();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState(initialError);
  const [notice, setNotice] = useState("");
  const [pending, setPending] = useState<"password" | "passkey" | null>(null);

  // Offer saved passkeys in the browser's autofill menu (conditional UI).
  useEffect(() => {
    if (
      !passkeyAutofill ||
      typeof window === "undefined" ||
      !window.PublicKeyCredential?.isConditionalMediationAvailable
    ) {
      return;
    }
    void window.PublicKeyCredential.isConditionalMediationAvailable().then((ok) => {
      if (!ok) return;
      void authClient.signIn.passkey({
        autoFill: true,
        fetchOptions: { onSuccess: () => router.push(callbackURL) },
      });
    });
  }, [router, callbackURL, passkeyAutofill]);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFormError("");
    setNotice("");
    const parsed = signInSchema.safeParse(Object.fromEntries(new FormData(e.currentTarget)));
    if (!parsed.success) return setErrors(fieldErrors(parsed.error));
    setErrors({});

    setPending("password");
    const { data, error } = await authClient.signIn.email({
      ...parsed.data,
      callbackURL,
      rememberMe: true,
    });
    if (error) {
      setPending(null);
      if (error.code === "EMAIL_NOT_VERIFIED") return setNotice(authErrorMessage(error));
      return setFormError(authErrorMessage(error));
    }
    // With 2FA on, the client plugin redirects to /two-factor instead.
    if (data && "twoFactorRedirect" in data && data.twoFactorRedirect) return;
    onNavigate?.();
    router.push(callbackURL);
    router.refresh();
  }

  async function passkeySignIn() {
    setFormError("");
    setPending("passkey");
    const { error } = await authClient.signIn.passkey();
    if (error) {
      setPending(null);
      return setFormError(authErrorMessage(error, "Passkey sign-in was cancelled or failed."));
    }
    onNavigate?.();
    router.push(callbackURL);
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-6">
      {showHeader && (
        <div className="flex flex-col gap-1.5">
          <h1 className="text-2xl font-semibold tracking-tight">Welcome back</h1>
          <p className="text-sm text-muted-foreground">Sign in to your account to continue.</p>
        </div>
      )}

      <SocialButtons providers={providers} callbackURL={callbackURL} />

      <Button type="button" variant="outline" onClick={passkeySignIn} loading={pending === "passkey"} disabled={pending !== null}>
        {pending !== "passkey" && <KeyRound />}
        Sign in with a passkey
      </Button>

      <OrDivider />

      <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
        {formError && <FormAlert>{formError}</FormAlert>}
        {notice && <FormAlert variant="success">{notice}</FormAlert>}

        <Field label="Email" htmlFor="email" error={errors.email}>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email webauthn"
            placeholder="you@example.com"
            aria-invalid={Boolean(errors.email)}
            aria-describedby={errors.email ? "email-error" : undefined}
          />
        </Field>

        <Field
          label="Password"
          htmlFor="password"
          error={errors.password}
          action={
            <Link href="/forgot-password" className="text-[13px] text-muted-foreground hover:text-foreground">
              Forgot password?
            </Link>
          }
        >
          <PasswordInput
            id="password"
            name="password"
            autoComplete="current-password webauthn"
            aria-invalid={Boolean(errors.password)}
            aria-describedby={errors.password ? "password-error" : undefined}
          />
        </Field>

        <Button type="submit" loading={pending === "password"} disabled={pending !== null}>
          Sign in
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        New here?{" "}
        <Link
          href={callbackURL !== "/dashboard" ? `/sign-up?callbackURL=${encodeURIComponent(callbackURL)}` : "/sign-up"}
          className="font-medium text-foreground underline-offset-4 hover:underline"
        >
          Create an account
        </Link>
      </p>
    </div>
  );
}
