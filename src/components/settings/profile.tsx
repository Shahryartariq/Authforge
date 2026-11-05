"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Section } from "@/components/settings/section";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/primitives";
import { authClient } from "@/lib/auth-client";
import { authErrorMessage } from "@/lib/auth-errors";

export function ProfileForm({ name, email }: { name: string; email: string }) {
  const router = useRouter();
  const [value, setValue] = useState(name);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const trimmed = value.trim();

  async function save() {
    if (!trimmed) return setError("Enter your name");
    if (trimmed.length > 80) return setError("Keep it under 80 characters");
    setError("");
    setPending(true);
    const res = await authClient.updateUser({ name: trimmed });
    setPending(false);
    if (res.error) return toast.error(authErrorMessage(res.error));
    toast.success("Profile updated");
    router.refresh();
  }

  return (
    <Section
      title="Profile"
      description="How you appear across the app."
      footer={
        <Button size="sm" onClick={save} loading={pending} disabled={trimmed === name}>
          Save
        </Button>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Name" htmlFor="profile-name" error={error}>
          <Input id="profile-name" value={value} onChange={(e) => setValue(e.target.value)} autoComplete="name" />
        </Field>
        <Field label="Email" htmlFor="profile-email" hint="Your email is used to sign in and can't be changed here.">
          <Input id="profile-email" value={email} disabled readOnly />
        </Field>
      </div>
    </Section>
  );
}
