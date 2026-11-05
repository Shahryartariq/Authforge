"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { PasswordInput } from "@/components/auth/password-input";
import { Section } from "@/components/settings/section";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/primitives";
import { authClient } from "@/lib/auth-client";
import { authErrorMessage } from "@/lib/auth-errors";
import { changePasswordSchema, fieldErrors } from "@/lib/validation";

export function PasswordSection({ hasPassword, email }: { hasPassword: boolean; email: string }) {
  const router = useRouter();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pending, setPending] = useState(false);

  if (!hasPassword) {
    return (
      <Section
        title="Password"
        description="You sign in with a social account or passkey. Add a password to also sign in with your email."
        footer={
          <Button
            size="sm"
            variant="outline"
            loading={pending}
            onClick={async () => {
              setPending(true);
              const res = await authClient.requestPasswordReset({ email, redirectTo: "/reset-password" });
              setPending(false);
              if (res.error) return toast.error(authErrorMessage(res.error));
              toast.success(`We sent a link to ${email} to set your password.`);
            }}
          >
            Email me a link to set one
          </Button>
        }
      />
    );
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const parsed = changePasswordSchema.safeParse(Object.fromEntries(new FormData(form)));
    if (!parsed.success) return setErrors(fieldErrors(parsed.error));
    setErrors({});
    setPending(true);
    const res = await authClient.changePassword({
      currentPassword: parsed.data.currentPassword,
      newPassword: parsed.data.newPassword,
      revokeOtherSessions: true,
    });
    setPending(false);
    if (res.error) {
      if (res.error.code === "INVALID_PASSWORD") return setErrors({ currentPassword: "That password isn't right" });
      return toast.error(authErrorMessage(res.error));
    }
    form.reset();
    toast.success("Password changed. Other devices were signed out.");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} noValidate>
      <Section
        title="Password"
        description="Changing your password signs you out on every other device."
        footer={
          <Button size="sm" type="submit" loading={pending}>
            Change password
          </Button>
        }
      >
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Current password" htmlFor="currentPassword" error={errors.currentPassword}>
            <PasswordInput id="currentPassword" name="currentPassword" autoComplete="current-password" />
          </Field>
          <Field label="New password" htmlFor="newPassword" error={errors.newPassword}>
            <PasswordInput id="newPassword" name="newPassword" autoComplete="new-password" showStrength />
          </Field>
          <Field label="Confirm new password" htmlFor="confirmPassword" error={errors.confirmPassword}>
            <PasswordInput id="confirmPassword" name="confirmPassword" autoComplete="new-password" />
          </Field>
        </div>
      </Section>
    </form>
  );
}
