"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Ban, Eye, LogOut, MoreHorizontal, ShieldCheck, ShieldOff, Trash2, UserCheck } from "lucide-react";
import { toast } from "sonner";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { authClient } from "@/lib/auth-client";
import { authErrorMessage } from "@/lib/auth-errors";
import { cn, initials } from "@/lib/utils";

export type AdminUserRow = {
  id: string;
  name: string;
  email: string;
  image: string | null;
  role: string;
  emailVerified: boolean;
  banned: boolean;
  banReason: string | null;
  banExpires: string | null;
  twoFactorEnabled: boolean;
  createdAt: string;
};

type Props = {
  users: AdminUserRow[];
  currentUserId: string;
  page: number;
  pageCount: number;
  total: number;
  query: string;
};

export function UsersTable({ users, currentUserId, page, pageCount, total, query }: Props) {
  const href = (p: number) => `/admin?${new URLSearchParams({ ...(query ? { q: query } : {}), page: String(p) })}`;

  return (
    <Card className="gap-0 overflow-hidden py-0">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-sm">
          <thead className="border-b bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">User</th>
              <th className="px-4 py-3 font-medium">Role</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Joined</th>
              <th className="w-12 px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y">
            {users.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-muted-foreground">
                  {query ? `No users match "${query}".` : "No users yet."}
                </td>
              </tr>
            )}
            {users.map((u) => (
              <tr key={u.id} className={cn(u.banned && "bg-destructive-soft/40")}>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <span className="flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-brand-soft text-[11px] font-semibold text-brand">
                      {u.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={u.image} alt="" className="size-full object-cover" referrerPolicy="no-referrer" />
                      ) : (
                        initials(u.name, u.email)
                      )}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate font-medium">
                        {u.name} {u.id === currentUserId && <span className="text-xs font-normal text-muted-foreground">(you)</span>}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">{u.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <Badge variant={u.role.includes("admin") ? "brand" : "secondary"} className="capitalize">
                    {u.role}
                  </Badge>
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1">
                    {u.banned ? (
                      <Badge variant="destructive" title={u.banReason ?? undefined}>
                        Banned{u.banExpires ? ` until ${new Date(u.banExpires).toLocaleDateString("en")}` : ""}
                      </Badge>
                    ) : u.emailVerified ? (
                      <Badge variant="success">Verified</Badge>
                    ) : (
                      <Badge>Unverified</Badge>
                    )}
                    {u.twoFactorEnabled && <Badge variant="brand">2FA</Badge>}
                  </div>
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
                  {new Date(u.createdAt).toLocaleDateString("en", { dateStyle: "medium" })}
                </td>
                <td className="px-4 py-3 text-right">
                  {u.id !== currentUserId && <RowActions user={u} />}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex items-center justify-between border-t px-4 py-3 text-sm text-muted-foreground">
        <span>
          {total} user{total === 1 ? "" : "s"}
        </span>
        <div className="flex items-center gap-2">
          <span>
            Page {page} of {pageCount}
          </span>
          <Link
            href={href(page - 1)}
            aria-disabled={page <= 1}
            className={cn(buttonVariants({ variant: "outline", size: "sm" }), page <= 1 && "pointer-events-none opacity-50")}
          >
            Previous
          </Link>
          <Link
            href={href(page + 1)}
            aria-disabled={page >= pageCount}
            className={cn(buttonVariants({ variant: "outline", size: "sm" }), page >= pageCount && "pointer-events-none opacity-50")}
          >
            Next
          </Link>
        </div>
      </div>
    </Card>
  );
}

function RowActions({ user }: { user: AdminUserRow }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [dialog, setDialog] = useState<"ban" | "delete" | null>(null);
  const isAdmin = user.role.includes("admin");

  async function run(action: () => Promise<{ error: unknown }>, success: string, after?: () => void) {
    setPending(true);
    const res = await action();
    setPending(false);
    if (res.error) {
      toast.error(authErrorMessage(res.error as { message?: string }));
      return false;
    }
    toast.success(success);
    if (after) after();
    else router.refresh();
    return true;
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button size="icon" variant="ghost" aria-label={`Actions for ${user.email}`} loading={pending}>
            {!pending && <MoreHorizontal />}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-52">
          {isAdmin ? (
            <DropdownMenuItem
              onSelect={() =>
                run(() => authClient.admin.setRole({ userId: user.id, role: "user" }), `${user.name} is now a user`)
              }
            >
              <ShieldOff /> Remove admin role
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem
              onSelect={() =>
                run(() => authClient.admin.setRole({ userId: user.id, role: "admin" }), `${user.name} is now an admin`)
              }
            >
              <ShieldCheck /> Make admin
            </DropdownMenuItem>
          )}
          {user.banned ? (
            <DropdownMenuItem
              onSelect={() => run(() => authClient.admin.unbanUser({ userId: user.id }), `${user.name} was unbanned`)}
            >
              <UserCheck /> Unban
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem onSelect={() => setDialog("ban")}>
              <Ban /> Ban…
            </DropdownMenuItem>
          )}
          <DropdownMenuItem
            onSelect={() => run(() => authClient.admin.revokeUserSessions({ userId: user.id }), "All sessions revoked")}
          >
            <LogOut /> Sign out everywhere
          </DropdownMenuItem>
          {!isAdmin && !user.banned && (
            <DropdownMenuItem
              onSelect={() =>
                run(
                  () => authClient.admin.impersonateUser({ userId: user.id }),
                  `Now viewing as ${user.email}`,
                  () => {
                    router.push("/dashboard");
                    router.refresh();
                  },
                )
              }
            >
              <Eye /> Impersonate
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive" onSelect={() => setDialog("delete")}>
            <Trash2 /> Delete user
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <BanDialog
        user={user}
        open={dialog === "ban"}
        onOpenChange={(o) => setDialog(o ? "ban" : null)}
        onConfirm={async (reason, days) => {
          const done = await run(
            () =>
              authClient.admin.banUser({
                userId: user.id,
                banReason: reason || undefined,
                banExpiresIn: days ? days * 86400 : undefined,
              }),
            `${user.name} was banned and signed out`,
          );
          if (done) setDialog(null);
        }}
        pending={pending}
      />

      <AlertDialog open={dialog === "delete"} onOpenChange={(o) => setDialog(o ? "delete" : null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {user.email}?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently deletes the account, its sessions, passkeys and linked sign-ins. It can&apos;t be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => run(() => authClient.admin.removeUser({ userId: user.id }), `${user.email} was deleted`)}
            >
              Delete user
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

const BAN_LENGTHS = [
  { label: "1 day", days: 1 },
  { label: "7 days", days: 7 },
  { label: "30 days", days: 30 },
  { label: "Permanent", days: 0 },
];

function BanDialog({
  user,
  open,
  onOpenChange,
  onConfirm,
  pending,
}: {
  user: AdminUserRow;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (reason: string, days: number) => void;
  pending: boolean;
}) {
  const [days, setDays] = useState(7);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <form
          className="grid gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            onConfirm(String(new FormData(e.currentTarget).get("reason") ?? "").trim(), days);
          }}
        >
          <DialogHeader>
            <DialogTitle>Ban {user.email}</DialogTitle>
            <DialogDescription>They&apos;re signed out everywhere and can&apos;t sign in until the ban ends.</DialogDescription>
          </DialogHeader>
          <Field label="Reason" htmlFor="ban-reason" hint="Shown to admins only.">
            <Input id="ban-reason" name="reason" defaultValue="Violated terms of service" />
          </Field>
          <div className="grid gap-2">
            <span className="text-sm font-medium">Length</span>
            <div className="grid grid-cols-4 gap-2" role="radiogroup" aria-label="Ban length">
              {BAN_LENGTHS.map((b) => (
                <Button
                  key={b.label}
                  type="button"
                  role="radio"
                  aria-checked={days === b.days}
                  variant={days === b.days ? "default" : "outline"}
                  size="sm"
                  onClick={() => setDays(b.days)}
                >
                  {b.label}
                </Button>
              ))}
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" variant="destructive" loading={pending}>
              Ban user
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
