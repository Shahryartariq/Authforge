"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { PasswordInput } from "@/components/auth/password-input";
import { Section } from "@/components/settings/section";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { FormAlert } from "@/components/form-alert";
import { authClient } from "@/lib/auth-client";
import { authErrorMessage } from "@/lib/auth-errors";

export function DeleteAccount({ hasPassword, emailDelivery }: { hasPassword: boolean; emailDelivery: boolean }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const password = String(new FormData(e.currentTarget).get("password") ?? "");
    if (hasPassword && !password) return setError("Enter your password");
    setError("");
    setPending(true);
    const res = await authClient.deleteUser({
      ...(hasPassword ? { password } : {}),
      callbackURL: "/",
    });
    setPending(false);
    if (res.error) {
      if (res.error.code === "INVALID_PASSWORD") return setError("That password isn't right");
      return toast.error(authErrorMessage(res.error));
    }
    if (!emailDelivery) {
      // No email confirmation on this deployment: the account is already gone.
      toast.success("Your account was deleted.");
      router.push("/");
      router.refresh();
      return;
    }
    setSent(true);
  }

  if (sent) {
    return (
      <Section title="Delete account" description="Check your inbox to finish." danger>
        <FormAlert variant="success">We emailed you a confirmation link. Your account is deleted once you open it.</FormAlert>
      </Section>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate>
      <Section
        title="Delete account"
        description={
          emailDelivery
            ? "Permanently delete your account and all its data. We'll email you a link to confirm."
            : "Permanently delete your account and all its data. This happens right away and can't be undone."
        }
        danger
        footer={
          open ? (
            <>
              <Button size="sm" type="button" variant="ghost" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button size="sm" type="submit" variant="destructive" loading={pending}>
                {emailDelivery ? "Send confirmation email" : "Delete my account"}
              </Button>
            </>
          ) : (
            <Button size="sm" type="button" variant="destructive" onClick={() => setOpen(true)}>
              Delete account
            </Button>
          )
        }
      >
        {open && hasPassword && (
          <div className="max-w-sm">
            <Field label="Confirm your password" htmlFor="delete-password" error={error}>
              <PasswordInput id="delete-password" name="password" autoComplete="current-password" autoFocus />
            </Field>
          </div>
        )}
      </Section>
    </form>
  );
}
