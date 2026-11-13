"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { UserPlus } from "lucide-react";
import { toast } from "sonner";
import { PasswordInput } from "@/components/auth/password-input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/ui/field";
import { authClient } from "@/lib/auth-client";
import { authErrorMessage } from "@/lib/auth-errors";
import { emailSchema, fieldErrors, passwordSchema } from "@/lib/validation";
import { z } from "@/lib/zod";

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

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) setErrors({});
      }}
    >
      <DialogTrigger asChild>
        <Button>
          <UserPlus /> Create user
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create user</DialogTitle>
          <DialogDescription>The account is active right away, with a verified email.</DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
          <Field label="Name" htmlFor="cu-name" error={errors.name}>
            <Input id="cu-name" name="name" autoFocus />
          </Field>
          <Field label="Email" htmlFor="cu-email" error={errors.email}>
            <Input id="cu-email" name="email" type="email" />
          </Field>
          <Field
            label="Temporary password"
            htmlFor="cu-password"
            error={errors.password}
            hint="Share it securely. They can change it in Settings."
          >
            <PasswordInput id="cu-password" name="password" autoComplete="new-password" />
          </Field>
          <Field label="Role" htmlFor="cu-role">
            <select
              id="cu-role"
              name="role"
              defaultValue="user"
              className="h-9 rounded-md border border-input bg-transparent px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 dark:bg-input/30"
            >
              <option value="user">User</option>
              <option value="admin">Admin</option>
            </select>
          </Field>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" loading={pending}>
              Create user
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
