"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { UserPlus, X } from "lucide-react";
import { toast } from "sonner";
import { PasswordInput } from "@/components/auth/password-input";
import { Button } from "@/components/ui/button";
import { Card, Field, Input } from "@/components/ui/primitives";
import { authClient } from "@/lib/auth-client";
import { authErrorMessage } from "@/lib/auth-errors";
import { emailSchema, fieldErrors, passwordSchema } from "@/lib/validation";
import { z } from "zod";

const schema = z.object({
  name: z.string().trim().min(1, "Enter a name"),
  email: emailSchema,
  password: passwordSchema,
  role: z.enum(["user", "admin"]),
});

export function CreateUser() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const parsed = schema.safeParse(Object.fromEntries(new FormData(e.currentTarget)));
    if (!parsed.success) return setErrors(fieldErrors(parsed.error));
    setErrors({});
    setPending(true);
    const res = await authClient.admin.createUser({ ...parsed.data, data: { emailVerified: true } });
    setPending(false);
    if (res.error) return toast.error(authErrorMessage(res.error));
    toast.success(`Created ${parsed.data.email}`);
    setOpen(false);
    router.refresh();
  }

  if (!open) {
    return (
      <Button onClick={() => setOpen(true)}>
        <UserPlus /> Create user
      </Button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 p-4 pt-[12vh]" role="dialog" aria-modal aria-labelledby="create-user-title">
      <Card className="w-full max-w-md p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 id="create-user-title" className="text-base font-semibold">
            Create user
          </h2>
          <Button size="icon" variant="ghost" aria-label="Close" onClick={() => setOpen(false)}>
            <X />
          </Button>
        </div>
        <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
          <Field label="Name" htmlFor="cu-name" error={errors.name}>
            <Input id="cu-name" name="name" autoFocus />
          </Field>
          <Field label="Email" htmlFor="cu-email" error={errors.email}>
            <Input id="cu-email" name="email" type="email" />
          </Field>
          <Field label="Temporary password" htmlFor="cu-password" error={errors.password} hint="Share it securely. They can change it in Settings.">
            <PasswordInput id="cu-password" name="password" autoComplete="new-password" />
          </Field>
          <Field label="Role" htmlFor="cu-role">
            <select id="cu-role" name="role" defaultValue="user" className="h-10 rounded-lg border border-input bg-card px-3 text-sm outline-none focus-visible:ring-4 focus-visible:ring-ring">
              <option value="user">User</option>
              <option value="admin">Admin</option>
            </select>
          </Field>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={pending}>
              Create user
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
