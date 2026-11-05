"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Ban, Eye, LogOut, MoreHorizontal, ShieldCheck, ShieldOff, Trash2, UserCheck } from "lucide-react";
import { toast } from "sonner";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge, Card } from "@/components/ui/primitives";
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
    <Card className="overflow-hidden">
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
                    <span className="flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-accent-soft text-[11px] font-semibold text-accent">
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
                  <Badge tone={u.role.includes("admin") ? "accent" : "neutral"} className="capitalize">
                    {u.role}
                  </Badge>
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1">
                    {u.banned ? (
                      <Badge tone="danger" title={u.banReason ?? undefined}>
                        Banned{u.banExpires ? ` until ${new Date(u.banExpires).toLocaleDateString("en")}` : ""}
                      </Badge>
                    ) : u.emailVerified ? (
                      <Badge tone="success">Verified</Badge>
                    ) : (
                      <Badge>Unverified</Badge>
                    )}
                    {u.twoFactorEnabled && <Badge tone="accent">2FA</Badge>}
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
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const isAdmin = user.role.includes("admin");

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent | KeyboardEvent) => {
      if (e instanceof KeyboardEvent ? e.key === "Escape" : !ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", close);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", close);
    };
  }, [open]);

  async function run(action: () => Promise<{ error: unknown }>, success: string, after?: () => void) {
    setOpen(false);
    setPending(true);
    const res = await action();
    setPending(false);
    if (res.error) return toast.error(authErrorMessage(res.error as { message?: string }));
    toast.success(success);
    if (after) after();
    else router.refresh();
  }

  const items = [
    isAdmin
      ? {
          icon: ShieldOff,
          label: "Remove admin role",
          onClick: () => run(() => authClient.admin.setRole({ userId: user.id, role: "user" }), `${user.name} is now a user`),
        }
      : {
          icon: ShieldCheck,
          label: "Make admin",
          onClick: () => run(() => authClient.admin.setRole({ userId: user.id, role: "admin" }), `${user.name} is now an admin`),
        },
    user.banned
      ? {
          icon: UserCheck,
          label: "Unban",
          onClick: () => run(() => authClient.admin.unbanUser({ userId: user.id }), `${user.name} was unbanned`),
        }
      : {
          icon: Ban,
          label: "Ban…",
          onClick: () => {
            const reason = prompt(`Why are you banning ${user.email}?`, "Violated terms of service");
            if (reason === null) return setOpen(false);
            const days = prompt("Ban for how many days? Leave empty for a permanent ban.", "");
            if (days === null) return setOpen(false);
            const n = Number(days);
            return run(
              () =>
                authClient.admin.banUser({
                  userId: user.id,
                  banReason: reason || undefined,
                  banExpiresIn: days && n > 0 ? Math.round(n * 86400) : undefined,
                }),
              `${user.name} was banned and signed out`,
            );
          },
        },
    {
      icon: LogOut,
      label: "Sign out everywhere",
      onClick: () => run(() => authClient.admin.revokeUserSessions({ userId: user.id }), "All sessions revoked"),
    },
    ...(!isAdmin && !user.banned
      ? [
          {
            icon: Eye,
            label: "Impersonate",
            onClick: () =>
              run(
                () => authClient.admin.impersonateUser({ userId: user.id }),
                `Now viewing as ${user.email}`,
                () => {
                  router.push("/dashboard");
                  router.refresh();
                },
              ),
          },
        ]
      : []),
    {
      icon: Trash2,
      label: "Delete user",
      danger: true,
      onClick: () => {
        if (!confirm(`Permanently delete ${user.email}? This can't be undone.`)) return setOpen(false);
        return run(() => authClient.admin.removeUser({ userId: user.id }), `${user.email} was deleted`);
      },
    },
  ];

  return (
    <div className="relative inline-block text-left" ref={ref}>
      <Button size="icon" variant="ghost" aria-label={`Actions for ${user.email}`} aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen((o) => !o)} loading={pending}>
        {!pending && <MoreHorizontal />}
      </Button>
      {open && (
        <div role="menu" className="absolute right-0 z-50 mt-1 w-52 overflow-hidden rounded-xl border bg-card p-1 shadow-lg">
          {items.map((item) => (
            <button
              key={item.label}
              role="menuitem"
              onClick={item.onClick}
              className={cn(
                "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm hover:bg-muted",
                "danger" in item && item.danger && "text-destructive",
              )}
            >
              <item.icon className="size-4" /> {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
