import type { Metadata } from "next";
import { Suspense } from "react";
import { count, desc, eq, ilike, or, sql } from "drizzle-orm";
import { CreateUser } from "@/components/admin/create-user";
import { UserSearch } from "@/components/admin/user-search";
import { UsersTable, type AdminUserRow } from "@/components/admin/users-table";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { db } from "@/db";
import { user } from "@/db/schema";
import { requireAdmin } from "@/lib/session";

export const metadata: Metadata = { title: "Admin" };

const PAGE_SIZE = 20;

export default function AdminPage({ searchParams }: PageProps<"/admin">) {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight">Admin</h1>
          <p className="text-sm text-muted-foreground">Manage users, roles, bans and sessions.</p>
        </div>
        <Suspense fallback={null}>
          <AdminOnly>
            <CreateUser />
          </AdminOnly>
        </Suspense>
      </div>
      <Suspense fallback={<StatsSkeleton />}>
        <Stats />
      </Suspense>
      <Suspense fallback={<Skeleton className="h-96" />}>
        <Users searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function AdminOnly({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  return children;
}

async function Stats() {
  await requireAdmin();
  const [row] = await db
    .select({
      total: count(),
      verified: sql<number>`count(*) filter (where ${user.emailVerified})`.mapWith(Number),
      twoFactor: sql<number>`count(*) filter (where ${user.twoFactorEnabled})`.mapWith(Number),
      banned: sql<number>`count(*) filter (where ${user.banned})`.mapWith(Number),
    })
    .from(user);
  const [admins] = await db.select({ n: count() }).from(user).where(eq(user.role, "admin"));

  const stats = [
    { label: "Users", value: row.total },
    { label: "Verified", value: row.verified },
    { label: "Using 2FA", value: row.twoFactor },
    { label: "Admins", value: admins.n },
    { label: "Banned", value: row.banned },
  ];
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
      {stats.map((s) => (
        <Card key={s.label} className="gap-1 p-4">
          <p className="text-xs text-muted-foreground">{s.label}</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums">{s.value}</p>
        </Card>
      ))}
    </div>
  );
}

async function Users({ searchParams }: { searchParams: PageProps<"/admin">["searchParams"] }) {
  const { user: me } = await requireAdmin();
  const params = await searchParams;
  const q = typeof params.q === "string" ? params.q.trim().slice(0, 100) : "";
  const page = Math.max(1, Number(params.page) || 1);

  // Case-insensitive search across name and email. `%` and `_` are escaped.
  const pattern = `%${q.replace(/[\\%_]/g, (c) => `\\${c}`)}%`;
  const where = q ? or(ilike(user.name, pattern), ilike(user.email, pattern)) : undefined;

  const [users, [{ total }]] = await Promise.all([
    db
      .select()
      .from(user)
      .where(where)
      .orderBy(desc(user.createdAt))
      .limit(PAGE_SIZE)
      .offset((page - 1) * PAGE_SIZE),
    db.select({ total: count() }).from(user).where(where),
  ]);

  const rows: AdminUserRow[] = users.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    image: u.image,
    role: u.role ?? "user",
    emailVerified: u.emailVerified,
    banned: Boolean(u.banned),
    banReason: u.banReason,
    banExpires: u.banExpires ? u.banExpires.toISOString() : null,
    twoFactorEnabled: Boolean(u.twoFactorEnabled),
    createdAt: u.createdAt.toISOString(),
  }));

  return (
    <div className="flex flex-col gap-4">
      <UserSearch initial={q} />
      <UsersTable
        users={rows}
        currentUserId={me.id}
        page={page}
        pageCount={Math.max(1, Math.ceil(total / PAGE_SIZE))}
        total={total}
        query={q}
      />
    </div>
  );
}

function StatsSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
      {[0, 1, 2, 3, 4].map((i) => (
        <Skeleton key={i} className="h-[76px]" />
      ))}
    </div>
  );
}
